# Safe Git branch cleanup

Use this guide to review stale branches in the Aura Logbook repository. Cleanup is a deliberate, manual operation: never delete a branch only because it looks old or its name refers to a closed issue.

## 1. Inspect repository state

Start from a clean working tree. Preserve local edits and commit or otherwise protect any work before switching branches.

```bash
git status --short --branch
git worktree list
git fetch --prune origin
git branch -vv
git branch -r -vv
```

`git fetch --prune` removes only local remote-tracking references for branches that have already been deleted on the remote. It does not delete live branches on GitHub.

Do not remove `master`, `dev`, the branch currently checked out, or a branch checked out in any worktree. Resolve or preserve worktree contents before removing a worktree; branch cleanup alone is not permission to discard a worktree.

## 2. Verify each local branch

For a candidate local branch, first confirm that its tip is already contained in the current remote default branch:

```bash
git merge-base --is-ancestor <branch> origin/master
```

Exit status `0` means the branch tip is an ancestor of `origin/master`; any other result means **keep the branch and investigate**. Also check its associated pull requests and ensure no unmerged work needs to be retained.

Only after confirming the branch is not checked out, its work is preserved in `master`, and the working tree is safe, delete it with Git's guarded deletion:

```bash
git switch master
git pull --ff-only origin master
git branch -d <branch>
```

If `master` is already checked out in another worktree, run the commands there after confirming that worktree is clean; do not check out the same branch in a second worktree.

If Git refuses the deletion, stop and investigate. Do not use `-D` to bypass the guard as part of routine cleanup.

## 3. Verify each remote branch

Check the exact branch in GitHub and review every associated pull request. A merged pull request is strong evidence that the change was delivered, but still verify the remote branch is not protected or in active use. Closed-but-unmerged pull requests require extra review: delete only when the issue's intended work is complete and no unique branch work needs to be kept.

For a remote branch whose tip is verified as included in `master`, check ancestry:

```bash
git merge-base --is-ancestor origin/<branch> origin/master
```

Only after confirming the branch is not protected, has no open pull request, and contains no unique work, remove that exact remote branch:

```bash
git push origin --delete <branch>
```

Do not use wildcard deletion. If a branch is unmerged, has an open pull request, is checked out in a worktree, or its status is unclear, retain it and report why.

## 4. Verify and report

After cleanup, refresh tracking references and inspect the remaining branches:

```bash
git fetch --prune origin
git branch -vv
git branch -r -vv
git worktree list
git status --short --branch
```

Record the exact local and remote branches removed, the checks used to establish they were safe to remove, and any retained branches with the reason they were preserved. Keep unrelated local changes untouched.
