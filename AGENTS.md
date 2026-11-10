# Agent instructions — Daneo

Read `CLAUDE.md` for this repository's conventions, build and test commands.


## Owner-approved automation policy

Set by the repository owner (nwilliams22) on 2026-09-27 and recorded here on 2026-11-10 so that
repository-scoped tooling sees it directly. This is an explicit, standing repository opt-in.

- **This repository opts into the Beads _Team-maintainer_ profile.** Agents working for the owner's
  Paperclip studio may commit, run quality gates, close beads, `bd dolt push`, and `git push` to
  `main` as part of finishing a task, **without asking first**. No per-push approval card is needed.
- Before every push: scan `git diff origin/main..HEAD` for credentials, then confirm the remote ref
  moved. After every push: confirm the GitHub Actions run for that commit concluded `success`.
- **Still requires the owner's explicit approval:** opening, updating or merging a pull request;
  tags and releases; force-pushes; deleting remote refs; adding remotes; changing visibility.
- Never commit a credential, token or personal data, and never commit or stash another agent's
  uncommitted changes.
