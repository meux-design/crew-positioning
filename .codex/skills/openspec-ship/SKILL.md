---
name: openspec-ship
description: Ship an OpenSpec change or feature branch by committing pending work, merging into main, and pushing only after an explicit confirmation gate. Use when the user runs /opsx:ship or asks to ship the current branch.
license: MIT
compatibility: Requires git CLI and an origin remote.
metadata:
  author: openspec
  version: "1.0"
  command: "/opsx:ship"
---

Ship the current feature branch to `main`.

This is the final step of the OpenSpec change workflow. It may be run after `/opsx:archive`, or standalone from any feature branch.

**Input**: No change name is required. The current git branch is the feature branch to ship.

**Steps**

1. **Pre-flight checks**

   Run:
   ```bash
   git branch --show-current
   git remote -v
   ```

   Save the current branch as `FEATURE_BRANCH`.

   Bail out early if:
   - `FEATURE_BRANCH` is empty or cannot be determined.
   - `FEATURE_BRANCH` is `main`. Show: "`/opsx:ship` must be run from a feature branch, not `main`."
   - No `origin` remote exists. Show instructions: `git remote add origin <url>`.

2. **Commit pending changes**

   Run:
   ```bash
   git status --porcelain
   ```

   If the tree is clean, skip to merge.

   If there are pending changes:
   - Stage all pending work:
     ```bash
     git add -A
     ```
   - Derive the commit message from the branch name:
     - Strip a leading `feat/` if present.
     - Use `feat: ship <branch-slug>`.
     - Examples:
       - `feat/opsx-ship` -> `feat: ship opsx-ship`
       - `my-branch` -> `feat: ship my-branch`
   - Commit with a Claude co-author trailer:
     ```bash
     git commit -m "feat: ship <branch-slug>" -m "Co-Authored-By: Claude"
     ```

   If commit fails, stop and report the error.

3. **Merge into `main`**

   Run:
   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff <FEATURE_BRANCH>
   ```

   If merge conflicts occur:
   - Run `git merge --abort`.
   - Return to the feature branch with `git checkout <FEATURE_BRANCH>`.
   - List conflicting files from the merge output or `git diff --name-only --diff-filter=U`.
   - Stop and ask the user to resolve conflicts manually before re-running `/opsx:ship`.
   - Never attempt auto-resolution.

   If the merge succeeds, report the merge commit subject/hash in the working notes.

4. **Confirmation gate before push**

   This gate is mandatory and must never be skipped.

   Build a push summary:
   ```bash
   git remote get-url origin
   git log --oneline origin/main..HEAD
   ```

   Show:
   - Feature branch being shipped: `<FEATURE_BRANCH> -> main`
   - Remote URL
   - Number of commits ahead of `origin/main`
   - Commit summary from `git log --oneline origin/main..HEAD`

   Ask the user to choose:
   - `Push now`
   - `Cancel - I'll push manually`

   Do not run `git push` until the user explicitly chooses `Push now`.

5. **Push or cancel**

   If the user cancels:
   - Preserve the local merge on `main`.
   - Show:
     ```text
     ## Merge complete, push skipped

     **Branch:** <FEATURE_BRANCH> merged into main (local only)

     Push when ready:
       git push origin main
     ```

   If the user confirms push:
   ```bash
   git push origin main
   ```

   If push is rejected because the remote diverged:
   - Do not force-push.
   - Show the git error.
   - Advise: `git pull --rebase origin main`, then re-run `/opsx:ship`.
   - Preserve the local merge commit.

   On success, report the remote URL and shipped commit hash + subject.

**Output On Success**

```text
## Shipped ✓

**Branch:** <FEATURE_BRANCH> -> main
**Remote:** <remote-url>
**Commit:** <hash> — <subject>
```

**Output On Cancel**

```text
## Merge complete, push skipped

**Branch:** <FEATURE_BRANCH> merged into main (local only)

Push when ready:
  git push origin main
```

**Guardrails**

- Never skip the confirmation gate before pushing.
- Never force-push or use `--force`.
- Abort on merge conflict and never auto-resolve conflicts.
- Exit before doing anything if already on `main`.
- Exit before doing anything if there is no `origin` remote.
- Do not revert unrelated user changes.
- Do not delete the feature branch unless the user explicitly asks.
