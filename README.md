# Life OS

Life OS is an early prototype for a personal thinking partner.

It started as a small toy project for keeping life context around. Once I tried to think about it seriously, it turned into a broader question:

```text
What would it take for an agent to understand a person's life over time?
```

The current answer is still rough. Life OS stores moments, decisions, projects, people, worries, and open loops as small pieces of source memory. The agent should then use that memory to become a better thinking partner in later conversations.

## Core Loop

```text
conversation
-> capture durable memory
-> link recurring entities
-> gather slices into views
-> retrieve context later
-> improve the next conversation
```

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
- small sanitized examples of slices, entities, and views

The examples are derived from actual Life OS notes and edited for privacy, clarity, and shareability. They are not complete source records.

## Files

- `docs/architecture.md`: how the memory model works
- `docs/roadmap.md`: the problems this system still needs to solve
- `examples/`: non-private examples derived from real source memory

## Status

Prototype. The current system is a repo-backed memory layer with agent instructions and small deterministic helper scripts. The next step is to make the agent behavior more reliable and test whether this actually improves long-running conversation.
