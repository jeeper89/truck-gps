# The Skill Layer — Research

Date: 2026-09-04
Status: primary sources read; one clear gap identified

Companion to `00-research-and-plan.md`. That document mapped dashboards and
control planes. This one maps the layer underneath them: how skills get authored,
packaged, distributed, discovered and trusted. It is the layer the earlier research
did not cover, and the one the `watch-video` skill is an instance of.

---

## 1. Why this layer, now

`Newuxtreme/watch-video-skill` prompted this. It is a good specimen: a self-contained
capability, distributed as a git repo, installed by copying into a skills directory,
with vendored third-party engine code and its own dependency requirements. Every
question you would ask about it — is it any good, is it safe, does it still work, who
maintains the engine it vendored — is a question the ecosystem currently answers badly
or not at all.

---

## 2. What that skill actually is (read from source)

Claude sees images but cannot watch video. The skill fakes it:

1. `yt-dlp` downloads the video (YouTube plus anything yt-dlp supports — Vimeo, TikTok,
   X, Twitch, Loom, Instagram — and local files).
2. ffmpeg extracts JPEG frames on an auto-scaled budget.
3. A transcript comes from native captions, falling back to cloud Whisper (Groq
   preferred, OpenAI backup).
4. It prints a markdown report listing every frame path with `t=MM:SS`.
5. Claude reads the frames in parallel, aligns each to the transcript line at that
   timestamp, and writes a structured notes file.

Engineering worth noting: the frame budget scales by duration and hard-caps at 100
frames / 2 fps, so token cost is bounded; `--start`/`--end` packs frames densely into
one window; and the trigger is **slash-command only** by default, explicitly to stop a
pasted URL from silently burning tokens on a long video. The engine is vendored from
`bradautomates/claude-video` (MIT); this repo adds the slash-only trigger, a persistent
notes file, cleanup, and a frame-sampling guide.

### Install state in this environment

Installed at `~/.claude/skills/watch-video` and registering as `/watch-video`.
Dependencies resolved the hard way, since binary downloads are blocked here:

- `yt-dlp` from PyPI.
- Static ffmpeg via the `imageio-ffmpeg` wheel.
- `ffprobe` does not ship in that wheel, and both the upstream static-ffmpeg fetch and
  the LFS-backed binary repo are blocked. Wrote a shim at `/usr/local/bin/ffprobe`
  that parses `ffmpeg -i` stderr and emits the JSON subset `frames.py` needs
  (`format.duration`, `format.size`, per-stream `codec_type`/`codec_name`/`width`/`height`).

Verified end to end on a generated 12-second clip: 6 frames extracted, report produced,
frames read back correctly as images. **Local-file mode works here.**

**YouTube does not.** `yt-dlp` returns `Tunnel connection failed: 403 Forbidden` for all
three of the video IDs from the earlier research. That is now the third independent
confirmation of the same gateway block, after WebFetch and the npm transcript library.
The skill is sound; the network is not. On a normal machine it will work.

---

## 3. The distribution layer is already taken

Two well-resourced package managers now exist, both recent, both open.

### `vercel-labs/skills` — "the CLI for the open agent skills ecosystem"

TypeScript. Installs from GitHub shorthand, full GitHub URLs, a direct path to one skill
inside a repo, GitLab, any git URL, or a local path. Private repos work through the
credentials git already has — it deliberately does **not** shell out for a stored token
or copy a credential into its own process. Notable second command: `skills use` resolves
a source, writes to a temp directory, and prints only a generated prompt to stdout, so a
skill can be used once without being installed at all. Claims support for 77 agents.

### `withastro/rosie` — "npm, but for skills"

Rust, distributed via npm, Homebrew, apt, AUR and FreeBSD pkg, with a typed JS API and a
`.agents/rosie.lock` lockfile. Detects Claude, Cursor, Codex, OpenCode, Gemini, Cline,
Windsurf and Aider.

**Read this as a market signal.** Vercel and Astro both shipped a skill package manager.
The format is converging cross-agent. Building another one would be building into a
commodity with two funded incumbents.

---

## 4. Rosie's security model — and what it refuses to solve

Rosie's design doc is the sharpest thinking in the ecosystem, and its scope boundaries
are the most useful finding in this research.

Its stated threat framing: rosie installs markdown from arbitrary repos directly into an
agent's context window, which makes it *a prompt-injection delivery vehicle*. It also
draws a distinction worth keeping — a `SKILL.md` was authored as agent instructions, so
the user implicitly trusts it, whereas a README pulled in as a reference was not, so
defenses lean harder on references.

**In scope, shipped by default:**

- Markdown comment stripping on reference installs, outside fenced code blocks.
- Hidden-content defenses against invisible Unicode.
- The lockfile as trust anchor — every install pins an exact commit SHA, checked into
  git, so code review now covers what landed in the agent's context.
- **Re-tag detection.** If a pinned tag resolves to a different SHA than the lockfile
  records, it is flagged `tag_rewritten` at high severity. It does not block, since a
  legitimate security re-tag looks identical, but it surfaces.
- A structured audit log of installs and updates, with content diffs.

**Explicitly out of scope, in its own words:**

- Signed-skill verification, registries, reputation, allowlists.
- Sandboxing what the agent *does* with the content — "not rosie's job."
- Heuristic phrase-matching for injection text — judged "too lossy in both directions."

---

## 5. Discovery is relevance, not quality

`claude-code-skills` ships a catalog of over a thousand SKILL.md files across 16
categories as both an MCP server and a CLI, with no backend and no LLM calls in the hot
path. Its "deterministic ranking" is **BM25 plus tag and framework boosts**.

That is a search index. It ranks what *matches*, not what *works*. There is no quality
signal, no success rate, no evidence a listed skill functions at all.

---

## 6. The ecosystem, scored

| Layer | State | Owner |
|---|---|---|
| Skill format | Converging, cross-agent | De facto standard |
| Distribution | **Solved twice over** | Vercel, Astro |
| Install-time content hygiene | **Solved** | Rosie |
| Supply-chain pinning, re-tag detection | **Solved** | Rosie |
| Discovery / search | Partial — relevance only | Catalog packages |
| Authoring quality | Weak — tooling exists, no standard | Scattered |
| **Efficacy evaluation** | **Unsolved at ecosystem level** | — |
| **Reputation, signing, registry trust** | **Unsolved, explicitly disclaimed** | — |
| **Runtime attribution** | **Unsolved** | — |

Efficacy evaluation exists only *inside closed systems*: Paperclip has an eval kernel
and performance reviews for agents; `modimihir07/agentic-os` scores skills per run with
history. Neither is an ecosystem-level signal — a score inside one company's deployment
tells nobody else anything.

---

## 7. The gap, stated plainly

**Nobody can tell you whether a skill actually works.**

Distribution has become a commodity with two funded incumbents. Install-time safety is
handled. What is missing is everything after install:

- No success rate. No "this skill completed its task 8 times in 10."
- No regression signal. A skill that broke when an upstream API changed looks identical
  to one that still works.
- No provenance beyond a SHA. `watch-video` vendors another project's engine; nothing
  tracks that relationship or notices when the upstream changes.
- No reputation, and rosie has explicitly declined to build one.
- **No runtime attribution.** Rubric governs an agent's tool calls and writes a
  tamper-evident audit log, but that log knows nothing about *which skill was active*
  when a call was made. Nobody joins "skill X is installed" to "skill X caused this
  action, and it cost this much, and it worked."

That last one is the bridge, and it is the most interesting thing in either document.
Everything needed already exists in pieces: hook-based tool-call capture from Rubric, the
append-only event log from the earlier research, per-run eval scoring from the local
cockpits, and lockfile-pinned skill identity from rosie. Join them and you get per-skill
efficacy and per-skill risk data that no one currently has.

---

## 8. Open questions before any of this becomes a plan

1. Is skill efficacy a **product** or a **feature**? A quality signal is only worth
   something if enough people publish runs into it. That is a cold-start problem, and
   cold-start problems kill more registries than competitors do.
2. Would the incumbents simply absorb it? Rosie declined reputation on scope grounds,
   not capability grounds. That reads as a deliberate v1 boundary, not a permanent one.
3. Is the honest first move a **local** tool — per-skill efficacy for one person's own
   setup, useful on day one with no network effect required — that only later aggregates?

No recommendation yet. Direction is still open per the current decision.

---

## 9. Local clones from this research

Under `/home/user/srcstudy/`: `watch-video-skill`, `bradautomates_claude-video`,
`vercel-labs_skills`, `withastro_rosie`, `NousResearch_hermes-agent`, plus the five from
the earlier round. Not committed; re-clone with `git clone --depth 1`.
