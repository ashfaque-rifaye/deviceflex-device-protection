# Two repos, one codebase

There are two GitHub repos in play and they are **not** peers.

| | repo | role |
|---|---|---|
| `origin` | [`ashfaque-rifaye/deviceflex-device-protection`](https://github.com/ashfaque-rifaye/deviceflex-device-protection) | **Canonical.** All work happens here, on `main`. |
| `lovable` | [`ashfaque-rifaye/pixel-perfect-at-t`](https://github.com/ashfaque-rifaye/pixel-perfect-at-t) | Lovable's own repo. Two-way synced with the Lovable editor. |

The local branch `lovable-sync` is the bridge. It tracks `lovable/main` and exists
only to carry work across — never develop on it.

## Why it's arranged this way

Lovable **only exports**. Their docs are explicit: *"Lovable only supports exporting
from Lovable to GitHub, not importing. When you connect a project, it creates a new
repository."* It cannot be pointed at an existing populated repo, which is why
connecting it to `deviceflex-device-protection` did nothing at all. So Lovable made
its own repo, and we merge into that.

## Pushing our work to Lovable

```bash
git switch lovable-sync
git merge main -m "Sync DeviceFlex main into the Lovable project"
git push lovable lovable-sync:main
git switch main
```

Lovable auto-pulls commits on its default branch, so the editor and preview rebuild
within a minute or so.

The first sync used `--allow-unrelated-histories -X ours` to fold the two trees
together. Every subsequent sync is an ordinary merge.

## Pulling Lovable's edits back

If someone edits in the Lovable editor, those land as commits on `lovable/main`:

```bash
git fetch lovable
git switch lovable-sync && git merge lovable/main
# then, only if the change is worth keeping in the canonical repo:
git switch main && git cherry-pick <sha>
```

## Rules

- **Never force-push, rebase, amend or squash anything already pushed to `lovable`.**
  Lovable's own `AGENTS.md` warns that rewriting published history *"rewrites history
  on Lovable's side and the user will likely lose their project history."*
- **Only the default branch syncs.** A commit on any other branch of the Lovable repo
  is invisible to the editor.
- **Keep `lovable/main` in a working state** — it is what the editor loads.
- **Leave Lovable's scaffolding alone.** `AGENTS.md`, `.lovable/project.json`,
  `components.json`, `bunfig.toml`, `bun.lock`, `src/components/ui/**`,
  `src/hooks/use-mobile.tsx` and `src/routes/README.md` exist only on the Lovable
  side. They're preserved by the merge and nothing of ours imports them.

## Not in either repo

`Screenshots/`, `chat-images/` and `First Document.docx` are gitignored. Several of
those images are captures of a real myAT&T account — account numbers, balances,
billing pages — and shouldn't sit in a hosted repo.
