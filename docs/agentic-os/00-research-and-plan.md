# Agentic Dashboard / Agent OS — Research, Comparison, and Build Plan

Date: 2026-09-03
Status: research complete, plan ready to execute

---

## 0. Research constraints (read this first)

This session runs behind an egress proxy that blocks direct page fetches. Every one of
the six links supplied resolved to `EGRESS_BLOCKED` on both `WebFetch` and `curl`.
Only the search index was reachable.

What that means for confidence:

| Source | Reached? | How | Confidence |
|---|---|---|---|
| `getrubric.app` | Indirect | Search index summaries of the live page | High on features, low on internals |
| `x.com/ridark_eth/status/2095246413404020854` | Indirect | Search index over the account's posts | Medium — the exact post ID was not resolvable |
| `youtube.com/watch?v=MAuLQzcMrS0` | No | Video IDs are not indexed as text | None |
| `youtu.be/r3-hJfif2FE` | No | Same | None |
| `youtu.be/ad6eOfVRHWY` | No | Same | None |
| `files.skool.com/...` (signed URL) | No | Private, signed, expiring; blocked and unfetchable | None |

The three videos and the Skool file are gaps. Everything below about those slots is
inferred from the surrounding ecosystem, not from the artifacts themselves. To close
the gaps: paste the video titles/channels or a transcript, and re-host or paste the
Skool document contents.

Also flagged: prior-chat examples referenced in the request are not in this session's
context, and this repository contains no agentic setup to compare against — it is a
Next.js truck-routing app. Both comparisons below are made against what is actually
on disk plus the public ecosystem.

---

## 1. What each system actually is

### 1.1 Rubric — `getrubric.app` (the command centre)

The closest thing to a finished product in this space.

- **Premise.** Agents already live in files. The dashboard is a *view over those files*,
  not a separate database. It works with "Claude Code, OpenClaw, Antigravity, or any
  agent that lives in files."
- **Compiles.** Ten prebuilt panels: flows, skills, crons, generations, docs, sprints,
  team, plus others. Everything is structured so that agents can read it back.
- **Signature UI.** A workflow visualiser with *pipeline playback* — replay every step
  an agent took. A *force-directed skill graph* that scans the setup and maps
  capabilities. A markdown knowledge base agents read in place. A crons calendar. A
  generations log for image/video output. A team view of who is active.
- **Install.** `npm install -g @rubric-app/claude-code && rubric init`.
- **The key idea worth stealing.** Bidirectionality. The dashboard is not a reporting
  surface bolted on top; it is the same substrate the agent reads. One artifact serves
  the human eye and the agent's context window.

### 1.2 Rubric — `rubric-app.com` (a *different* product, same name)

Worth separating because search conflates them. This one is runtime governance:
cryptographic identity per agent, a policy bundle evaluated on every tool call, and a
tamper-evident audit log. Attach a trace context and the SDK uploads the full
transcript so any decision can be opened up. Its posture is default-allow — let the
agent run, block only the catastrophic: `rm -rf /`, force-push to main, secret reads,
`curl | sh`. MIT-licensed SDK.

### 1.3 Ridark (`@ridark_eth`) — the org-chart trading desk

Not a dashboard product. An *organisational pattern* that happens to need a dashboard.

- Eight agents on a trading desk, roughly $200/month in total, replacing what the
  account frames as ~$500K/year of analyst headcount.
- Roles, not prompts: SEARCH (real-time signal scraping), RISK (contract auditing),
  SNIPER (order placement), WHALE (smart-money wallet tracking), RUG (dev-wallet
  monitoring), EXIT (trailing stops), SHILL (social momentum).
- A **HEAD OF DESK** agent that never trades. It routes data, verifies handoffs
  between agents, and escalates exactly one decision to the human.
- Onboarding by demonstration: run the workflow once on screen while the agents watch,
  then wire Telegram and wallet webhooks. No VPS, no code.
- Coordination runs through Paperclip. Each agent gets its own virtual browser,
  terminal, and local memory in the cloud.
- **The idea worth stealing.** An org chart beats a to-do list. A router agent that
  produces a single human decision per cycle is the difference between an autonomous
  system and a notification firehose.

### 1.4 Paperclip — the control plane underneath that pattern

Open source (`paperclipai/paperclip`), Node server plus React dashboard.

- Models **companies, not pipelines**: org charts, reporting lines, ticketing,
  delegation, budgets, audit trails.
- Bring-your-own agents across providers, all managed from one dashboard.
- Agents run on **scheduled heartbeats plus event triggers** — task assignment and
  `@`-mentions — rather than waiting to be invoked.
- Per-agent monthly spend caps.

### 1.5 Hermes Agent OS (Nous Research, popularised by Julian Goldie)

The harness pattern, and the cleanest layering in the whole landscape.

- **Layers, each separable:** profiles, persona, memory, skills, tools, scheduling,
  interfaces.
- **One agent, many faces.** CLI, TUI, desktop app, web dashboard, and messaging
  gateways (Telegram, Discord, Slack, WhatsApp, Signal, Email) are all views onto the
  *same* settings, memory, and sessions.
- Ships cron, webhooks, Honcho memory, six terminal backends, 200+ models via
  OpenRouter.
- Mission control runs locally in the browser: live runs panel with a real-time step
  feed, a step-and-tool log recording each call with inputs and outputs, a task board,
  chat, and routines. Briefed in plain English, like staff.
- **The idea worth stealing.** Interface/state separation. Never let a front-end own
  state. Telegram and the dashboard must be equal citizens over one kernel.

### 1.6 The local-cockpit builds (`cth9191`, `aporb`, `modimihir07`)

The self-hosted end of the market, and the most directly copyable.

- **`cth9191/agentic-os-dashboard`** — reads `~/.claude/` and an Obsidian vault, ships
  nothing to cloud. Three tabs. A *TokenBurn 5-hour HUD*: live usage percentage,
  projection band, scan-line, comet trail, fed by real `tokens_5h` rows that a
  `/metrics-pull` skill writes to `system/metrics/metrics.csv`. An MCP strip with
  server health dots. Parallel skill runs through a background queue. A 30-day agent
  runs chart, 7-day bars, forecast, vault pulse. Companion repo `agentic-os-runner`
  holds the daemon, the activity-logging hook, and metric-pull templates.
- **`aporb/agentic-os`** — a minimal template for turning any agent CLI into a
  persistent OS. Skills are markdown dropped into `<vault>/skills/<pack>/<name>.md`.
  Packs carry functional labels in the UI (CEO, Revenue, Marketing, Product,
  Engineering, AI Ops, Finance) over stable internal directory names. The vault has
  four zones with distinct ownership and access rules. Runs on Hermes.
- **`modimihir07/agentic-os`** — routes between three specialists: opencode for
  code/DevOps, Hermes for memory/scheduling, agy for research. 15 skills, cron
  scheduler, cost analytics per provider/model/agent with free-tier alerts, persistent
  memory, backup/restore, a drag-and-drop task board, and a real mobile layout with a
  bottom nav and 44px touch targets.

---

## 2. The five layers, and who does each well

Every system above is a different subset of the same five layers.

| Layer | Best-in-class | What they do |
|---|---|---|
| **State** | Rubric (getrubric), aporb | Plain files on disk that both human and agent read. Markdown vault + structured panels. |
| **Runtime** | Hermes, Paperclip | Scheduler, heartbeats, event triggers, webhooks, model routing, isolated compute per agent. |
| **Organisation** | Paperclip, Ridark | Org chart, job descriptions, reporting lines, delegation, a router that escalates one decision. |
| **Observability** | cth9191, modimihir07 | Token HUD with forecast, per-agent cost, run history charts, MCP health, step-and-tool log. |
| **Governance** | rubric-app.com | Per-agent identity, policy evaluated per tool call, tamper-evident audit, default-allow with a short deny list. |

**Nobody ships all five well.** Rubric has state and observability but no org model.
Paperclip has organisation and budgets but a thin memory story. Hermes has runtime and
interfaces but leaves governance to you. The local cockpits have gorgeous
observability over a single agent. That gap is the product opportunity.

---

## 3. What we actually have today

Ground truth from `/home/user/truck-gps`, 75 files, one commit (`e54ce2d`, "Phase 1A"):

- `truck_gps/nextjs_space/` — Next.js 14 App Router, TypeScript, Tailwind.
- A full shadcn/ui + Radix component set, ~50 components already installed.
- Prisma schema present; Postgres planned but not yet wired.
- One API route: `app/api/route-truck/route.ts`, backed by HERE Maps.
- Leaflet map, React Hook Form + Zod, a truck routing form and results view.

There is **no agentic setup in this repository**. No `CLAUDE.md`, no `.claude/`
directory, no skills, no hooks, no agent definitions, no metrics. The only agent
infrastructure on the machine is the session harness itself.

That is not a bad starting position. It is a better one than most:

- The UI substrate for the dashboard is already installed and consistent.
- Next.js App Router gives route handlers for the daemon API and streaming for live panels.
- Prisma is present if any panel outgrows flat files.
- Zod is present, which is what the state schemas should be written in.

The honest read: we are at layer zero of five, holding a good chassis and no engine.

---

## 4. The design thesis for the best version

Five decisions, each taken from whoever got it right, plus one nobody has taken.

1. **One state kernel on disk, git-tracked, human- and agent-readable.**
   From Rubric and aporb. Plain markdown and YAML. Agents mutate it with ordinary file
   tools — no API, no SDK, no client library on the agent side. This is the single most
   important decision and everything else follows from it.

2. **The org chart is the config.** From Paperclip and Ridark. Agents are defined by
   role, job description, model, budget, tool grants, and reports-to. A router agent
   escalates one decision per cycle. Not a prompt library.

3. **Interfaces are views, never owners.** From Hermes. The dashboard, the CLI, and a
   Telegram gateway all read and write the same kernel. Dropping any one of them
   changes nothing about system state.

4. **Observability is a first-class panel, sourced from real rows.** From cth9191.
   The token HUD reads actual usage rows written by a metrics job, with a forecast
   band. Not an estimate, not a mock.

5. **Default-allow, hard-deny, human-approve.** From rubric-app.com. A pre-tool-use
   hook evaluates each call against a short policy. Almost everything passes. A tiny
   deny list is fatal-only. A middle tier — money, production, outbound
   communication — goes to an approvals inbox instead of blocking.

6. **The one nobody has taken: the event log is the product.**
   Every run appends JSONL to `os/runs/<run-id>/events.jsonl`. Live runs, the step-and-tool
   log, pipeline playback, the cost HUD, the audit trail, and the skill graph are all
   *projections of that one log*. Build the log correctly once and six panels become
   read-only views instead of six independent features. This is why the phasing below
   puts the schema before anything visual.

---

## 5. Target architecture

```
os/                          # the state kernel — git-tracked, plain text
  agents/<name>.md           # YAML front-matter: role, model, budget,
                             #   tools, reports_to; body = job description
  skills/<pack>/<name>/SKILL.md   # Claude Code skill format, natively loadable
  flows/<name>.yaml          # DAG of skill invocations, typed inputs/outputs
  crons/<name>.yaml          # schedule + flow ref + owning agent
  memory/                    # markdown vault: daily notes + entity notes
  policy/policy.yaml         # allow / deny / approve rules
  runs/<run-id>/events.jsonl # append-only event log — the source of truth
  metrics/metrics.csv        # token + cost rows, written by a metrics job
  approvals/                 # pending human decisions, one file each

os/runner/                   # the daemon — TypeScript/Node
  scheduler.ts               # cron + heartbeats
  bus.ts                     # file watcher + webhook receiver + SSE publisher
  executor.ts                # spawns agent CLI processes with skill + context
  policy.ts                  # pre-tool-use gate
  metrics.ts                 # usage collection
  budget.ts                  # per-agent spend caps, hard stop

apps/console/                # Next.js app on localhost, reuses existing shadcn set
  panels/                    # each panel is a projection of events.jsonl
```

**Panel inventory** (each maps to a section above):

Live Runs · Step & Tool Log · Flow Playback · Org Chart · Skill Graph · Crons
Calendar · Token & Cost HUD · Memory Browser · Task Board · Integration Health ·
Audit Log · Approvals Inbox

**Hook integration.** Claude Code's `PreToolUse` and `PostToolUse` hooks give the
policy gate and the step log without wrapping the model or proxying the API. Register
two scripts, and every tool call in every session lands in the event log for free.
This is far cheaper than the SDK-instrumentation route and works across any agent CLI
that exposes hooks.

**Transport.** Server-Sent Events from daemon to console. No polling anywhere. The
file watcher is the trigger; SSE is the delivery.

---

## 6. Build plan

Ten phases. Each has a definition of done that is checkable without opinion.

### Phase 0 — Schemas and scaffold  *(blocking; do not parallelise)*
Write Zod schemas for agent, skill, flow, cron, policy, and — most importantly — the
event envelope. Scaffold the `os/` tree. Commit one worked example of each file type.
**Done when:** every schema parses its example, and `npm run validate:os` exits 0.

### Phase 1 — Event log and hooks  *(blocking)*
`PreToolUse` / `PostToolUse` hook scripts appending to `os/runs/<run-id>/events.jsonl`.
Run-id allocation, session correlation, redaction of secrets before write.
**Done when:** a real Claude Code session produces a well-formed, schema-valid log.

*Phases 0 and 1 fix the contract. Everything after this can run concurrently.*

### Phase 2 — Console shell + Live Runs + Step & Tool Log
Next.js app, SSE subscription, two panels reading the log. Reuse the existing shadcn
components rather than adding a second design system.
**Done when:** starting an agent in a terminal makes rows appear in the browser with no refresh.

### Phase 3 — Token & Cost HUD
Metrics job writing real usage rows. 5-hour burn bar with projection band, 7-day bars,
30-day run chart, per-agent and per-model cost breakdown, free-tier alerting.
**Done when:** HUD figures reconcile against the provider's own reported usage.

### Phase 4 — Scheduler, crons, flows
Daemon with cron scheduling, heartbeats, webhook receiver, and a flow DAG executor
with typed handoffs between steps. Crons calendar panel.
**Done when:** a scheduled multi-step flow completes unattended and is fully replayable from its log.

### Phase 5 — Org chart, delegation, budgets
Agent definitions with reports-to. A router agent that triages and escalates. Task
board with drag-and-drop. Per-agent monthly caps with hard stop at limit.
**Done when:** a task assigned to the router reaches the right specialist and returns without human routing.

### Phase 6 — Policy gate, audit, approvals
Policy evaluation in the pre-tool-use hook. Fatal-only deny list. Approvals inbox for
money, production, and outbound comms. Append-only audit log with hash chaining.
**Done when:** a denied call is blocked and logged, and an approval-tier call pauses until a human clicks.

### Phase 7 — Flow playback and skill graph
Step-through replay scrubber over a run's log. Force-directed graph built by scanning
`os/skills/` and cross-referencing invocation counts from the event log — so edge
weight reflects real usage, not just declaration.
**Done when:** any completed run replays step by step, and the graph highlights unused skills.

### Phase 8 — Memory browser and docs
Markdown vault browser with backlinks, search, and inline editing. Agents read and
write the same files. Four-zone ownership model from the aporb pattern.
**Done when:** an agent writes a note mid-run and it appears in the browser without a restart.

### Phase 9 — Gateways and mobile
Telegram and Slack gateways over the same kernel. Responsive console with bottom nav
and 44px touch targets.
**Done when:** a task started from Telegram is visible in the console and finished from the phone.

### Phase 10 — Packaging
`npx` one-command init. Templates for the agent packs. Backup and restore. Docs.
**Done when:** a clean machine reaches a running console in under ten minutes.

---

## 7. Running it — solo or fanned out

**Solo path.** Strict order, 0 through 10. Phases 0 and 1 are roughly a day. Phases 2
through 4 are the minimum viable console and are where the system starts being useful
to its own construction — from Phase 4 onward, the OS schedules work on itself.

**Fan-out path.** Phases 0 and 1 must be done by one agent, alone, because they fix
every downstream contract. After that the dependency graph opens up:

| Wave | Parallel tracks | Depends on |
|---|---|---|
| 1 | Phase 0 → Phase 1 | nothing (sequential, single agent) |
| 2 | Phase 2 · Phase 3 · Phase 4 | Phase 1 event schema |
| 3 | Phase 5 · Phase 6 | Phase 4 executor |
| 4 | Phase 7 · Phase 8 | Phase 2 console shell |
| 5 | Phase 9 · Phase 10 | Waves 2–4 |

Wave 2 is the widest — three agents, no shared files, each owning a distinct panel
directory and a distinct daemon module. Conflicts are avoided by directory ownership,
not by coordination.

**The sequencing rule that matters.** Do not let any agent start a visual panel before
the event envelope schema is frozen. Six panels are projections of that one schema; a
late change to it invalidates all of them at once. Freeze it, write it down, then fan out.

---

## 8. What to decide before Phase 0

Three choices change the shape of the build and are the user's to make:

1. **Scope.** A personal cockpit for this developer, or a product to ship to others?
   The plan above builds the cockpit first and reaches product at Phase 10. If it is a
   product from day one, Phase 10's packaging concerns move to Phase 0.
2. **Home.** Does this live in `truck-gps` alongside the routing app, or in its own
   repository? Recommendation: its own repository. The state kernel is git-tracked and
   will accumulate run logs fast, which does not belong in an app repo.
3. **Agent runtime.** Claude Code only, or multi-runtime from the start? The hook
   integration in Phase 1 is runtime-specific. Claude-Code-only is materially faster
   and the event schema stays runtime-agnostic either way, so multi-runtime remains
   available later.

Default assumption if no answer arrives: personal cockpit, own repository,
Claude Code only, revisited at Phase 5.
