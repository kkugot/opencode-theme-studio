---
description: Prepare and ship an opencode-theme-studio release
argument-hint: "[patch|minor|major] [optional notes]"
---

Prepare a release for `opencode-theme-studio`.

Interpret `$ARGUMENTS` as the bump type plus optional release notes. If no bump type is provided, default to `patch`.

Follow this workflow:

1. Inspect `git status`, preserve unrelated local changes, and base work on the latest `upstream/main`.
2. Determine the next version from `package.json` and create a branch named `release/vX.Y.Z`.
3. Commit release-ready source changes before running the version bump so `npm version <type> -m "chore(release): %s"` can create the release commit and local `vX.Y.Z` tag on a clean tree.
4. Run `npm run test`, `npm run lint`, and `npm run build`.
5. Push the branch, create a PR against `main`, and summarize the user-facing changes plus verification results.
6. Try to assign `dmytro-zhytnik` and request review from `mykola-sharshov` and `vladyslav-kosachev`; if GitHub cannot resolve them, note that clearly instead of failing the release.
7. Merge the PR using the repository's allowed merge method. If the repo only allows squash merge, retag `vX.Y.Z` to the merged `main` commit before pushing the tag.
8. Push the release tag, fetch `upstream`, and sync local `main` to `upstream/main`.

Guardrails:

- Do not include unrelated files like `.DS_Store` or local config noise.
- Do not force-push or amend unless the user explicitly asks.
- If branch protection blocks the merge, ask once whether to wait for approval or use admin merge.
