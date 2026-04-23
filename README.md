# Life OS

Life OS is an early prototype for a personal thinking partner.

It started as a small toy project for keeping life context around. Once I tried to think about it seriously, it turned into a broader question:

```text
What would it take for an agent to understand a person's life over time?
```

The current answer is still rough. Life OS stores moments, decisions, projects, people, worries, and open loops as small pieces of source memory. The agent should then use that memory to become a better thinking partner in later conversations.

This repo is a public, sanitized version of the real structure. It includes sample memory plus the same kind of agent instructions, adapters, config, and runtime scripts used by the private Life OS repo.

## Core Loop

```text
conversation
-> capture durable memory
-> link recurring entities
-> gather slices into views
-> retrieve context later
-> improve the next conversation
```

## Runnable Shape

The repo is meant to be inspected as a working shape, not just read as a write-up.

```text
AGENTS.md                         canonical agent contract
CLAUDE.md                         Claude import shim
GEMINI.md                         Gemini import shim
.codex/skills/life-os/             Codex adapter
.claude/skills/life-os/            Claude Code adapter
.gemini/extensions/life-os/        Gemini CLI adapter
_system/docs/                      detailed system docs
_system/life-os/config.json        paths and command config
_system/life-os/view-workflows.json per-view lifecycle rules
_system/life-os/scripts/           briefing/search/lint/session runtime
slices/                            source memory
entities/registry.yaml             entity aliases
stories/                           views over memory
```

You can run the same internal helper commands an agent would use:

```bash
node _system/life-os/scripts/life-os.mjs briefing
node _system/life-os/scripts/life-os.mjs search life-os
node _system/life-os/scripts/life-os.mjs search --entity life-os
node _system/life-os/scripts/life-os.mjs lint
```

## Try It

```bash
git clone https://github.com/eatnug/life-os-public.git
cd life-os-public

node _system/life-os/scripts/life-os.mjs briefing
node _system/life-os/scripts/life-os.mjs search --entity life-os
node _system/life-os/scripts/life-os.mjs lint
```

No install step is required. The helper scripts use only Node built-ins.

## Use It As Your Own

This repo is a runnable skeleton, not a packaged app yet.

To make your own Life OS:

1. Fork or clone this repo privately.
2. Replace the sample `slices/`, `stories/`, and `entities/registry.yaml`.
3. Update `_system/life-os/config.json` for your timezone and paths if needed.
4. Open it with Codex, Claude Code, or Gemini CLI.
5. Let the agent use `AGENTS.md` and the Life OS adapter for memory retrieval/capture.

The current deterministic pieces are the helper scripts and repo conventions. A fully deterministic agent runner or hook system is still future work.

## Core Objects

The model is intentionally small.

| Object | Role |
| --- | --- |
| `slice` | A small unit of source memory: one subject in one context. |
| `entity` | A recurring person, project, company, concept, or concern. |
| `story` | A flexible view over slices, created when a larger surface is useful. |

Everything else is support structure: agent instructions, search, linting, startup briefing, and runtime scratch.

## What I Want To Figure Out

The interesting parts are still open:

- How can the agent loop behave more deterministically?
- What is the right data model for personal memory?
- How should stories work as views over source memory?
- How should external context like email, calendar, files, and web data enter the system?
- How can private memory stay private while the architecture stays shareable?

## This Sanitized Pack

This folder is a shareable version of the idea. It does not include private source memory.

It includes:

- architecture notes
- a roadmap of open problems
- runnable agent/runtime structure
- small sanitized source memory under `slices/`, `entities/`, and `stories/`

The examples are derived from actual Life OS notes and edited for privacy, clarity, and shareability. They are not complete source records.

## Files

- `AGENTS.md`: canonical operating contract
- `_system/docs/agent-operating-loop.md`: detailed agent loop
- `_system/docs/knowledge-architecture.md`: detailed memory model
- `_system/life-os/scripts/`: runnable helper scripts
- `docs/roadmap.md`: the problems this system still needs to solve
- `slices/`, `entities/`, `stories/`: non-private examples derived from real source memory

## Status

Prototype. The current system is a repo-backed memory layer with agent instructions and small deterministic helper scripts. The next step is to make the agent behavior more reliable and test whether this actually improves long-running conversation.
