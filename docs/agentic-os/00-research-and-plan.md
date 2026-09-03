# Agentic Dashboard / Agent OS — Research, Comparison, and Build Plan

Date: 2026-09-03 (rev. 2 — primary sources)
Status: research complete on 5 of 6 sources; plan revised

---

## 0. Method and what changed in rev. 2

Rev. 1 of this document was written from search-index summaries only, because the
session's egress proxy blocked direct page fetches. Rev. 2 replaces most of that with
**primary source**: the npm registry and anonymous GitHub clones are reachable through
the proxy even though the web is not.

What is now first-hand:

| System | Source obtained | How |
|---|---|---|
| Rubric governance adapter | `@rubric-app/claude-code` v0.4.0, full package | npm registry |
| Rubric SDK | `github.com/getrubric/sdk` | anonymous clone |
| Paperclip | `github.com/paperclipai/paperclip`, 189 MB | anonymous clone |
| Local cockpit | `github.com/cth9191/agentic-os-dashboard` | anonymous clone |
| C-suite template | `github.com/aporb/agentic-os` | anonymous clone |
| Multi-runtime OS | `github.com/modimihir07/agentic-os` | anonymous clone |

What remains unreachable, now **proven** rather than assumed:

- The three YouTube videos. Installed `youtube-transcript` from npm and called it
  against all three IDs. Every call failed. The library reports "video is no longer
  available", but the proxy log shows the true cause: `connect_rejected — gateway
  answered 403 to CONNECT, host www.youtube.com:443`. The package layer is open; the
  video host is not.
- The Skool file. A signed, expiring URL on a blocked host.
- `getrubric.app` and `x.com`. Both refused at CONNECT.

No skill closes these. A skill is instructions plus scripts running in this same
sandbox under this same network policy. The blocker is egress, not capability. To close
them, paste the video titles/channels or transcripts, and paste the Skool contents.

### Correction to rev. 1

Rev. 1 claimed `getrubric.app` and `rubric-app.com` were "two different products with
the same name". **That is not supported.** The SDK's GitHub organisation is
`getrubric`, and its packages declare `homepage: https://rubric-app.com`. The two names
share one org. Whether `getrubric.app` is the same company's other surface is still
unverified, since that host is blocked — but they should not be described as unrelated.

Two limits carry over unchanged: the prior-chat examples are not in this session's
context, and this repository contains no agentic setup, so the baseline comparison is
made against what is actually on disk.

---

## 1. What each system actually is (from source)

### 1.1 Rubric — governance adapter

Read from the published package and the SDK repo. MIT, Node 22+, two packages:
`@rubric-app/core` (framework-neutral identity, bundle polling, audit sink, policy
evaluator) and `@rubric-app/claude-code` (the adapter). A Python package also exists.

The mechanism, exactly:

- `rubric init` prompts for an agent name and an `enr_…` enrollment token, exchanges it
  with the control plane, and writes a 64-char hex daemon token to
  `~/.config/rubric/daemon.token` at mode 0600.
- It patches `~/.claude/settings.json` so `PreToolUse` and `PostToolUse` hooks POST to
  `http://127.0.0.1:47821/v1/hook`.
- It installs a launchd (macOS) or systemd-user (Linux) service so the daemon survives
  reboots.
- The daemon binds loopback only. Policy bundles are pulled from the control plane.
- **It fails closed.** The daemon refuses to bind until it holds an authoritative
  bundle — deliberately, to prevent a cold-start window of ungoverned tool calls.
- Audit events carry tool name, agent identity, decision plus matched rule, and the
  tool input/response through a secrets-redaction pass covering JWTs, bearer headers,
  Postgres credentials, AWS keys, and OpenAI/GitHub/Slack tokens.
- `rubric doctor` runs six checks: config integrity, daemon liveness, control-plane
  reachability, identity refresh, hook entries, bundle freshness.
- The documented trust model is explicit that same-UID processes can read the token and
  forge events. It defends against prompts inside the agent, not against local malware.

**Worth stealing.** Fail-closed startup, and redaction at the daemon before egress.
Both are things a naive hook implementation gets wrong.

### 1.2 Paperclip — the org-chart control plane

This is the big finding of rev. 2, and it invalidates the rev. 1 build plan.

Not "a Node server with a React dashboard". It is a mature control plane: **236 SQL
migrations**, a pnpm monorepo with 13 packages, a server, a UI, a CLI, an eval kernel, a
runner with a generated protocol schema bundle, a skills catalog, a teams catalog, an
MCP server, and a Tailscale HTTPS broker. Positioning line: *"If OpenClaw is an
employee, Paperclip is the company."*

Twelve server subsystems: Identity & Access · Work & Tasks · Heartbeat Execution ·
Governance & Approvals · Org Chart & Agents · Workspaces & Runtime · Plugins · Budget &
Costs · Routines & Schedules · Secrets & Storage · Activity & Events · Company
Portability.

Four stated pillars: an agentic task manager, an org chart for agents, agent employee
training (skill studio, evals, performance reviews), and an agentic OS layer (SSO, GRC,
RBAC, sandboxing, cost controls).

The hard details it claims to have solved, which are exactly the ones a from-scratch
build gets wrong:

- **Atomic execution.** Task checkout and budget enforcement are atomic, so no
  double-work and no runaway spend.
- **Persistent agent state** across heartbeats, rather than restarting cold.
- **Runtime skill injection** so agents learn workflows without retraining.
- **Governance with rollback** — approval gates enforced, config revisioned.
- **Goal-aware execution** — tasks carry full goal ancestry, so the agent sees the why.
- **Company portability** — export/import orgs, agents and skills with secret scrubbing
  and collision handling.
- **True multi-org isolation** — every entity company-scoped.

Connection model: adapters. Built-ins cover Claude Code, Codex, Cursor, OpenClaw, bash
and HTTP, and `adapter-plugin.md` documents an in-progress mutable registry that accepts
external adapter types at runtime. The bar for integration is a heartbeat — *"if it can
receive a heartbeat, it's hired."*

Its `DESIGN.md` is a genuinely good operator-UI document: one token source, status as a
single semantic set used identically in badge, row, chart and log, machine values in
monospace, and an explicit stance that "density in service of scanning beats whitespace
in service of aesthetics."

The README states plainly: *"Paperclip is a full control plane, not a wrapper. Before
you build any of this yourself, know that it already exists."*

### 1.3 The three local cockpits

Rev. 1 lumped these together and got their stacks wrong. From source:

- **`cth9191/agentic-os-dashboard`** — **Streamlit and Python**, essentially one
  `app.py`. Not a JS app. Three tabs. The TokenBurn 5-hour meter reads real `tokens_5h`
  rows written by a `/metrics-pull` skill into `system/metrics/metrics.csv`. Running a
  skill spawns `claude.exe -p` inline and streams phases and tokens into a hero card.
  Clicking more chips during a run queues them as `system/queue/<uuid>.json` files that
  a separate daemon repo picks up, **max 3 concurrent**. Reads `~/.claude/` and a vault;
  nothing leaves the machine.
- **`aporb/agentic-os`** — **Next.js 15** console on `127.0.0.1:18443`, talking to the
  Hermes Agent runtime over its OpenAI-compatible HTTP API on port 8642. Seven surfaces:
  Today, Skills, Wiki, Journal, Sources, Automations, Settings. Seven C-suite skill
  packs. Vault zones carry ownership rules — the Journal is user-owned and agent-read-only.
  Bootstrap is an 8-step script including a persona wizard and optional private-repo vault backup.
- **`modimihir07/agentic-os`** — **FastAPI and Python**. Routes between opencode, Hermes
  and agy. SQLite **FTS5** memory over a `brain/` folder with entity extraction.
  APScheduler cron. Cost analytics per provider/model/agent with free-tier alerts.
  Notably: a **circuit breaker** that trips after N failures and auto-recovers after
  300s, an error dashboard, session replay, a webhook receiver, an auto-skill generator
  that writes SKILL.md from natural language, and a mobile PWA with a service worker.

### 1.4 Ridark — the org-chart desk (search-derived, unverified)

The one source still second-hand. Eight role-based agents on a trading desk — search,
risk, sniper, whale, rug, exit, shill — under a head-of-desk agent that never trades and
escalates a single decision. Onboarding by screen demonstration, then messaging and
wallet webhooks. Coordination via Paperclip. Treat the specific figures as marketing
claims; the *pattern* is corroborated by Paperclip's source.

---

## 2. The five layers, rescored against source

| Layer | Strongest implementation | Evidence quality |
|---|---|---|
| **State** | aporb's vault zones; Paperclip's company-scoped entities | Source read |
| **Runtime** | Paperclip heartbeats + adapter registry | Source read |
| **Organisation** | Paperclip org chart, delegation, atomic budget | Source read |
| **Observability** | cth9191's TokenBurn; modimihir07's circuit breaker | Source read |
| **Governance** | Rubric fail-closed daemon; Paperclip approval gates | Source read |

Rev. 1 concluded "nobody ships all five well." **That was wrong.** Paperclip ships four
of five at production depth and has real answers in the fifth. The genuine gap is
narrower than rev. 1 claimed: Paperclip's telemetry is operational rather than
*glanceable*, and it has no file-native vault that an agent reads as plain markdown.

---

## 3. What we actually have

Ground truth: 75 files, one commit. Next.js 14 App Router, TypeScript, Tailwind, ~50
shadcn components, a Prisma schema not yet wired, one HERE-Maps-backed API route,
Leaflet, React Hook Form and Zod.

**No agentic setup at all** — no `CLAUDE.md`, no `.claude/`, no skills, hooks, agent
definitions or metrics.

The strategic point rev. 1 missed: the product here is a **truck routing app**. An
agentic OS is infrastructure for building it, not the thing being sold. That reframes
the whole build decision.

---

## 4. Revised recommendation — adopt, don't rebuild

Rev. 1 proposed building all five layers across eleven phases. Having read Paperclip's
source, that recommendation does not survive. Reproducing atomic task checkout,
budget-enforced heartbeats, revisioned approvals, multi-org isolation and an adapter
registry is months of work against a mature MIT codebase that already does it.

### Track A — adopt and extend *(recommended)*

| Step | Action | Effort |
|---|---|---|
| A1 | Run Paperclip locally. Define the org chart: a router plus specialists for routing/compliance work, Next.js work, and data. | ~1 day |
| A2 | Attach Claude Code via the built-in adapter. Set per-agent monthly budgets. | ~0.5 day |
| A3 | Install Rubric, or reimplement its hook pattern locally if the hosted control plane is unwanted. Adopt fail-closed startup and pre-egress redaction either way. | ~1 day |
| A4 | Author skills for the actual product work: route-restriction validation, HERE API contract checks, Prisma migration review. | ~2 days |
| A5 | Build the one genuinely missing piece — a **glanceable telemetry panel** in the style of the TokenBurn meter, reading Paperclip's own cost events. | ~3 days |
| A6 | Add a file-native vault the agents read as markdown, using aporb's zone-ownership model. | ~2 days |

Roughly **two weeks to a working, governed, multi-agent setup**, most of it
configuration and skill authoring rather than platform construction.

### Track B — build from scratch

The eleven-phase plan from rev. 1, retained in git history. Justified only if the OS
*is* the product, the hosted dependency is unacceptable, or Paperclip's model proves
wrong in practice. Expect months, not weeks, and expect to rediscover the atomic-checkout
and fail-closed problems the hard way.

### What to build either way

These are the ideas worth carrying regardless of track, now validated against source:

1. **The event log is the product.** Live runs, step log, playback, cost meter, audit
   trail and skill graph are all projections of one append-only log.
2. **Fail closed on the policy gate.** Rubric's daemon refusing to bind without a bundle
   is the correct default.
3. **Redact before egress**, at the daemon, not at the dashboard.
4. **A router that yields one human decision per cycle.**
5. **Telemetry from real rows, with a forecast band.**
6. **Vault zones with explicit ownership** — some files the agent may never write.

---

## 5. Decisions needed

1. **Is the OS the product, or the tooling?** If tooling for the truck app, take Track A
   and stop at A6. If it is the product, Track B needs a real differentiation
   argument against a mature MIT incumbent.
2. **Hosted governance acceptable?** Rubric's control plane is SaaS with an enrollment
   token. If not, take the hook pattern and self-host the policy bundle.
3. **Where does it live?** Recommendation unchanged: its own repository, not alongside
   the routing app.

Default if no answer arrives: Track A, self-hosted policy, own repository.

---

## 6. Local artifacts from this research

Clones under `/home/user/srcstudy/` — `paperclipai_paperclip`, `getrubric_sdk`,
`cth9191_agentic-os-dashboard`, `aporb_agentic-os`, `modimihir07_agentic-os`. Not
committed here; re-clone with `git clone --depth 1`.
