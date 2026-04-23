# Architecture

This page is a short map. The actual runnable structure lives in the repo root:

- `AGENTS.md`
- `_system/docs/`
- `_system/life-os/`
- `.codex/`, `.claude/`, `.gemini/`
- `slices/`, `entities/`, `stories/`

Life OS is built around a small memory model and a strict conversational rule:

```text
conversation first, storage second
```

The user should not feel like they are operating a filing system. They should be able to talk naturally. The agent decides when memory is useful, when context should be retrieved, and when durable material should be captured.

## Model

```text
conversation -> slices -> entities -> stories/views -> retrieval -> conversation
```

## Slices

A slice is the base unit of source memory.

```text
A slice = one subject in one context.
```

Examples:

- a project follow-up
- a weekly planning thread
- a decision about a product direction
- a concern that became clearer during conversation
- an event recap

The boundary rule is:

```text
same context + same subject -> update the same slice
new subject -> new slice
same subject in a new context -> new slice
```

This keeps memory small enough to retrieve and human-readable enough to edit.

## Entities

Entities create continuity across slices.

An entity can be a person, project, company, event, concept, or recurring concern. The practical test is:

```text
Can this appear again as the same thing?
```

If yes, it can be an entity.

Slices link entities inline:

```md
I talked with [[person-sam|Sam]] about [[life-os|Life OS]] and [[agent-memory|agent memory]].
```

The registry maps aliases to canonical ids:

```yaml
life-os:
  label: Life OS
  aliases: [Life OS, second brain, memory system]
```

The goal is not taxonomy. The goal is identity resolution.

## Stories And Views

Stories gather slices. They are not source memory.

A story can be:

- a project surface
- a weekly operating view
- an identity excerpt
- a relationship thread
- a shareable synthesis
- a temporary dashboard

The same slice can appear in multiple stories. That keeps source memory stable while allowing different views for different moments.

## Runtime Rails

The runtime does not replace the agent. It gives the agent deterministic tools.

Current helper tools:

```text
briefing -> load startup context
search   -> find relevant slices/entities
session  -> track current session slice candidates
lint     -> validate frontmatter, links, and registry consistency
```

These tools are intentionally boring. The interesting part is the agent behavior they support.

## Agent Contract

The agent should:

1. listen to the live turn
2. decide what kind of turn it is
3. retrieve memory only when the answer needs it
4. respond naturally
5. decide whether anything durable was produced
6. capture or update memory when appropriate
7. validate writes when practical

The memory layer should not interrupt the conversation unless the storage choice itself matters.

## Privacy Model

The private repo can contain real slices. A shareable repo should not.

The shareable version should include:

- architecture docs
- runtime shape
- sanitized examples
- small registry examples
- redacted views

The shareable version should exclude:

- sensitive personal relationships
- raw private reflections
- private career or legal details
- third-party information that was not meant to be public
- full email/calendar contents

The goal is to show how the system behaves without exposing the life it is meant to protect.
