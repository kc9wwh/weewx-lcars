---
name: release
description: >-
  Guides and executes a versioned release of the weewx-lcars skin: validates git state,
  confirms the target SemVer version with the user when omitted, bumps install.py,
  skins/LCARS/skin.conf, and CHANGELOG.md, builds the extension zip, commits, tags,
  pushes, and checks the GitHub Actions Release workflow. Activate when the user invokes
  /release or asks to cut, bump, or tag a release.
---

# Release Skill (`weewx-lcars`)

Use this skill when cutting or re-tagging a `weewx-lcars` release.

## 1. Pre-flight Checks

1. Inspect git status and the current branch:
   ```bash
   git status -s
   git branch --show-current
   ```
   - If there are uncommitted changes or the current branch is not `main`, stop and confirm with the user before proceeding.
2. Fetch tags and inspect the current version and commits since the last release:
   ```bash
   git fetch origin --tags
   git describe --tags --abbrev=0 2>/dev/null || true
   ```
   - Read `VERSION` in `install.py` and `SKIN_VERSION` in `skins/LCARS/skin.conf`.
   - List commits since the latest tag:
     ```bash
     git log <last-tag>..HEAD --oneline
     ```

## 2. Version Selection & Confirmation

1. **If the user provided a version** (for example `/release 0.1.2` or `/release v0.1.2`):
   - Strip any leading `v` to get `<version>`.
   - Validate that `<version>` strictly matches SemVer `X.Y.Z` (`^[0-9]+\.[0-9]+\.[0-9]+$`). If invalid, stop and ask the user for a valid `X.Y.Z` version.
2. **If the user did not specify a version**:
   - Review `git log <last-tag>..HEAD --oneline` and summarize what changed since `<last-tag>`.
   - Compute candidate next SemVer bumps (patch, minor, major) from the current version and identify the recommended bump.
   - **Always ask the user to confirm the target version** (for example with `ask_question`) before modifying any files or creating tags.
3. **Check for existing tags**:
   ```bash
   git tag -l "v<version>"
   git ls-remote --tags origin "refs/tags/v<version>"
   ```
   - If `v<version>` already exists locally or on `origin`, stop and ask the user whether to choose a different version or move/replace the existing `v<version>` tag.

## 3. Update Version Files & Changelog

1. Update `install.py`:
   - Set `VERSION = "<version>"`.
2. Update `skins/LCARS/skin.conf`:
   - Set `SKIN_VERSION = <version>`.
3. Update `CHANGELOG.md`:
   - Prepend a `## <version> (<YYYY-MM-DD>)` section above the previous release heading, summarizing user-facing changes since `<last-tag>` in the same concise bullet style used in `CHANGELOG.md`.

## 4. Validate Build & Diff

1. Run the build script with the target version so all version checks run:
   ```bash
   scripts/build.sh "<version>"
   ```
   Confirm it exits `0` and reports `Built dist/weewx-lcars-<version>.zip and dist/weewx-lcars.zip`.
2. Review the diff and working tree:
   ```bash
   git status -s
   git diff
   ```
   Confirm only `install.py`, `skins/LCARS/skin.conf`, and `CHANGELOG.md` are modified.

## 5. Commit, Tag, and Push

1. Stage and commit the release bump on `main`:
   ```bash
   git add install.py skins/LCARS/skin.conf CHANGELOG.md
   git commit -m "chore: release v<version>"
   ```
2. If replacing an existing tag (only after explicit user confirmation):
   ```bash
   git tag -d "v<version>"
   git push origin ":refs/tags/v<version>"
   ```
3. Create the tag and push `main` and the tag:
   ```bash
   git tag "v<version>"
   git push origin main
   git push origin "v<version>"
   ```

## 6. Verify GitHub Actions Release Workflow

1. Check the `Release` workflow triggered by pushing `v<version>`:
   ```bash
   gh run list --workflow=release.yml --limit 3
   ```
2. Optionally inspect the active run (`gh run view <run-id>`) and report the workflow run status/URL and release link to the user.
