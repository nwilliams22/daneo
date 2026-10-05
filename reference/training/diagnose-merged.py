"""Compare the merged HF model with native GGUF on the same smoke input."""
import os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
WORK=ROOT/'.local-models/compatibility'
for key,folder in [('HF_HOME','hf'),('TRITON_CACHE_DIR','triton'),('TORCHINDUCTOR_CACHE_DIR','inductor'),('UNSLOTH_COMPILE_LOCATION','unsloth-cache')]:
    os.environ[key]=str(WORK/folder)
os.environ['HF_HUB_OFFLINE']='1'
from unsloth import FastLanguageModel
import torch
import json
import time
row=json.loads((ROOT/'reference/training/smoke-examples.json').read_text())['items'][0]
model,processor=FastLanguageModel.from_pretrained(model_name=str(WORK/'merged'),max_seq_length=2048,
    dtype=torch.bfloat16,load_in_4bit=False,load_in_16bit=True)
FastLanguageModel.for_inference(model)
tokenizer=getattr(processor,'tokenizer',processor)
text=processor.apply_chat_template([dict(role='user',content=row['prompt'])],tokenize=False,add_generation_prompt=True,enable_thinking=False)
inputs=tokenizer(text,return_tensors='pt',add_special_tokens=False).to('cuda')
start=time.monotonic()
with torch.inference_mode():
    output=model.generate(**inputs,max_new_tokens=512,do_sample=False)
reply=tokenizer.decode(output[0,inputs.input_ids.shape[1]:],skip_special_tokens=True)
result=dict(input=row['english'],rawReply=reply,seconds=time.monotonic()-start)
(WORK/'merged-hf-reply.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False),flush=True)
