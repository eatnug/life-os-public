# Life OS

Life OS is an early prototype for a personal thinking partner.

It started as a small toy project for keeping life context around. Once I tried to think about it more seriously, it opened up into a larger question:

```text
What would it take for an agent to understand a person's life over time?
```

I want an agent that can follow the flow of a life: what happened, who was involved, what I am trying to do, what remains open, what I keep circling back to, and what context should come back later.

This repo is a public, sanitized version of the structure I am using. It includes a small set of non-private example notes, the memory model, and the agent/runtime pieces that make the repo inspectable.

## Core Idea

The basic loop is conversation-first:

```text
conversation
-> capture durable memory
-> link recurring entities
-> gather slices into useful views
-> retrieve the right context later
-> have a better next conversation
```

In practice, that means the agent should:

- listen to the live turn first
- retrieve only the context needed for that turn
- respond naturally
- keep track of current session slice candidates
- capture or update memory when the conversation produces durable material
- validate memory writes

The user should not have to operate the memory system manually. Search, briefing, linting, and session scratch are agent-internal tools.

## Memory Model

The model is intentionally small.

### Slice

A `slice` is source memory.

```text
one subject in one context
```

Examples:

- a project follow-up
- a decision
- a concern that became clearer
- a meeting recap
- a system design correction

Slices are plain markdown files under `slices/`.

### Entity

An `entity` is something that can recur across slices: a person, project, company, concept, event, or concern.

Entities are linked inline:

```md
I talked with [[person-sam|Sam]] about [[life-os|Life OS]].
```

`entities/registry.yaml` resolves aliases, so different phrases can point to the same thing.

### Story

A `story` is a view over slices.

Stories are not source memory. They are surfaces that become useful when the same source material needs to be seen from a larger angle.

Examples:

- this week
- identity
- a project thread
- a relationship thread
- a shareable synthesis

The same slice can appear in multiple stories without duplicating source memory.

## What I Want To Explore

The project is still early. The parts I want to push further are:

- deterministic agent behavior: making memory actions less random without making the conversation rigid
- data structure: deciding how atomic slices should be and how much structure belongs in markdown vs config
- stories as views: letting useful surfaces emerge without turning them into fixed schemas
- external context: deciding how email, calendar, files, GitHub, Slack, web pages, and other sources should enter the system
- privacy, consent, and agency: handling sensitive memory, user control, and the risk of an agent speaking or acting in ways the person would not endorse
- evaluation: testing whether memory actually improves long-running conversation

## Repo Map

```text
AGENTS.md                         canonical agent contract
CLAUDE.md                         Claude import shim
GEMINI.md                         Gemini import shim
.codex/skills/life-os/             Codex adapter
.claude/skills/life-os/            Claude Code adapter
.gemini/extensions/life-os/        Gemini CLI adapter
_system/docs/                      detailed system docs
_system/life-os/                   runtime config and helper scripts
slices/                            source memory
entities/registry.yaml             entity aliases
stories/                           views over memory
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

The deterministic pieces today are the helper scripts and repo conventions. A fully deterministic agent runner or hook system is still future work.
