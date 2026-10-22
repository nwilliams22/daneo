"""Exercise the real optimizer loop with a tiny CPU model and an interruption."""
import ast
import hashlib
import json
import math
import os
from pathlib import Path
import random
import tempfile
import time
from types import SimpleNamespace
import unittest
from training_preflight import identities, read_receipt, write_receipt

ROOT = Path(__file__).resolve().parents[2]
RUNNER = ROOT / 'reference/training/train-v1.py'


class ReceiptTests(unittest.TestCase):
    def test_receipt_rejects_changed_input_and_cannot_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root/'data'
            source.write_text('approved')
            bound = identities(root, [source])
            receipt = root/'receipt.json'
            write_receipt(receipt, bound, 'a'*40)
            self.assertTrue(read_receipt(receipt, bound)['passed'])
            with self.assertRaises(FileExistsError):
                write_receipt(receipt, bound, 'a'*40)
            source.write_text('changed')
            with self.assertRaisesRegex(ValueError, 'identity mismatch'):
                read_receipt(receipt, identities(root, [source]))


class RecoveryTests(unittest.TestCase):
    def test_interrupted_loop_matches_uninterrupted_selection(self):
        import torch
        # Execute the actual runner loop, replacing only the model and GPU IO.
        tree = ast.parse(RUNNER.read_text())
        first = next(i for i,n in enumerate(tree.body) if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'params' for t in n.targets))
        last = next(i for i,n in enumerate(tree.body) if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'report' for t in n.targets))
        program = compile(ast.Module(body=tree.body[first:last], type_ignores=[]), str(RUNNER), 'exec')

        class Model(torch.nn.Module):
            def __init__(self):
                super().__init__()
                self.lora_weight = torch.nn.Parameter(torch.tensor([0.25]))
            def forward(self, **unused):
                return SimpleNamespace(loss=(self.lora_weight * torch.rand(1) - 0.7).square().mean())

        class TorchProxy:
            cuda = SimpleNamespace(reset_peak_memory_stats=lambda: None, synchronize=lambda: None,
                                   get_rng_state_all=lambda: [], set_rng_state_all=lambda _: None)
            def __getattr__(self, name):
                return getattr(torch, name)
            def tensor(self, *args, **kwargs):
                kwargs['device'] = 'cpu'
                return torch.tensor(*args, **kwargs)

        def run(folder, resume=False, interrupt=False, changed=False):
            torch.manual_seed(3407)
            random.seed(3407)
            model = Model()
            cfg = dict(seed=3407, learning_rate=0.001 if changed else 0.01, weight_decay=0.01,
                       epochs=6, schedule='cosine', warmup_steps=5, max_grad_norm=1.0)
            env = dict(torch=TorchProxy(), model=model, cfg=cfg, random=random, time=time, math=math,
                       os=os, json=json, Path=Path, ROOT=ROOT, __file__=str(RUNNER), WORK=folder,
                       args=SimpleNamespace(probe=False, resume=resume), rows=list(range(10)),
                       encoded=[(str(i), [1], [2]) for i in range(10)], dev_encoded=[True],
                       sha=lambda p: hashlib.sha256(p.read_bytes()).hexdigest(),
                       development_loss=lambda step, epoch: dict(step=step, epoch=epoch,
                           response_token_mean_loss=float((model.lora_weight.detach()-0.5).square())),
                       print=lambda *a, **k: None)
            original_step = torch.optim.AdamW.step
            calls = 0
            def step(optimizer, *a, **k):
                nonlocal calls
                calls += 1
                if interrupt and calls == 28:
                    raise InterruptedError('simulated shutdown')
                return original_step(optimizer, *a, **k)
            torch.optim.AdamW.step = step
            try:
                exec(program, env)
            finally:
                torch.optim.AdamW.step = original_step
            return env

        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            control, recovery = root/'control', root/'recovery'
            control.mkdir(); recovery.mkdir()
            expected = run(control)
            with self.assertRaises(InterruptedError):
                run(recovery, interrupt=True)
            with self.assertRaisesRegex(AssertionError, 'identity mismatch'):
                run(recovery, resume=True, changed=True)
            actual = run(recovery, resume=True)
            self.assertEqual(actual['completed_steps'], 25)
            self.assertEqual(actual['losses'], expected['losses'])
            self.assertEqual(actual['dev_losses'], expected['dev_losses'])
            self.assertEqual(actual['selected_epoch'], expected['selected_epoch'])
            self.assertTrue(torch.equal(actual['model'].lora_weight, expected['model'].lora_weight))


if __name__ == '__main__':
    unittest.main()
