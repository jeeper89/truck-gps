# Claude Code skills installed in this repo

Skills are vendored under `.claude/skills/` as **project skills** rather than
installed as plugins. Project skills are committed to the repo, so they work in
every session — local and in Claude Code on the web — without per-machine setup,
and survive the ephemeral containers web sessions run in.

## What's installed

| Skill | Source | License | Notes |
|---|---|---|---|
| `find-skills` | [vercel-labs/skills](https://github.com/vercel-labs/skills) | — | Discovers/installs skills via `npx skills` |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) v4.0.4 | Apache-2.0 | Frontend design; 34 reference playbooks + 4 subagents |
| `task-observer` | [rebelytics/one-skill-to-rule-them-all](https://github.com/rebelytics/one-skill-to-rule-them-all) | CC BY 4.0 | Meta-skill; logs skill-improvement observations |
| 14 Superpowers skills | [obra/superpowers](https://github.com/obra/superpowers) v6.2.0 | MIT | `brainstorming`, `test-driven-development`, `systematic-debugging`, `writing-plans`, `verification-before-completion`, etc. |

Superpowers ships 14 separate skills, flattened into `.claude/skills/` so each
is individually invocable. Impeccable's 4 subagents are in `.claude/agents/`.

## Activation wiring

Two of these can't rely on description matching alone, so `.claude/settings.json`
registers hooks:

- **`SessionStart` → `.claude/hooks/session-start.sh`** — injects the
  `using-superpowers` skill content (upstream ships this in its plugin hook;
  adapted here to resolve from `CLAUDE_PROJECT_DIR` instead of
  `CLAUDE_PLUGIN_ROOT`) and points `task-observer` at its log. Task Observer's
  own SKILL.md asks for exactly this hook — it states that description-level
  matching "is not enforceable."
- **`PostToolUse` (Edit/Write/MultiEdit) and `Stop` → Impeccable's `hook.mjs`** —
  scans UI changes for design defects. **Requires Node 22+**; the hook
  self-disables with a message on older Node.

### Performance cost

These hooks run on every session start, every file edit, and every stop (the
`Stop` pass has a 30s timeout). That is real per-turn latency and context. If
turns feel slow, drop the `Stop` hook first — it's the most expensive and the
most redundant with the `PostToolUse` one.

## Task Observer state

Its log lives in `skill-observations/` **in the repo**, not in a home directory.
This is deliberate: the skill warns that state written under ephemeral paths is
lost at teardown, which is exactly what happens to `~` in a web session.
Committing the log is what makes it persist.

Its value is deferred — it accrues only if the weekly review in
`.claude/skills/task-observer/references/weekly-review.md` actually gets run.

## claude-mem — not installed, and not installable here

claude-mem was requested but **cannot work in Claude Code on the web**. It is a
runtime system, not a document: SQLite store at `~/.claude-mem`, hooks in
`~/.claude`, plus a background compression worker. Web session containers are
reclaimed after inactivity, destroying `~/.claude-mem` and with it the
cross-session memory that is the entire feature.

Vendoring its skills without the runtime would install ~19 skills
(`mem-search`, `timeline-report`, …) that query a database that does not exist.

Run `.claude/install-claude-mem.sh` **on a local machine** instead.

## Updating

These are vendored copies, not tracked dependencies — there is no `update`
command. Re-clone upstream and re-copy to update, and re-check that the hook
paths in `.claude/settings.json` still match the upstream layout.
