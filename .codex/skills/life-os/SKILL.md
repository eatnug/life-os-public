---
name: life-os
description: Use when working in this Life OS repo to retrieve context, capture or update slices, maintain entities/stories, run startup briefing, validate memory files, or perform Life OS system maintenance. The skill reads _system/life-os/config.json and uses the shared Life OS runtime.
---

# Life OS Skill

Use this skill for Life OS memory work in this repo.

`AGENTS.md` remains the canonical always-loaded instruction. This skill is the Codex workflow adapter for Life OS tasks. It reads `_system/life-os/config.json` for paths and command mappings.

## Agent-Internal Commands

The user should not need to invoke these commands. They are implementation details for the agent. Use them yourself when doing Life OS work.

Prefer the skill dispatcher internally:

```bash
node _system/life-os/scripts/life-os.mjs briefing
node _system/life-os/scripts/life-os.mjs search <query>
node _system/life-os/scripts/life-os.mjs search --entity <entity-id-or-alias>
node _system/life-os/scripts/life-os.mjs lint
node _system/life-os/scripts/life-os.mjs session list
node _system/life-os/scripts/life-os.mjs check
```

The dispatcher reads `_system/life-os/config.json`; do not hard-code folder paths in new workflow instructions unless the config is missing or wrong.

## Startup

When starting Life OS work:

1. Run `node _system/life-os/scripts/life-os.mjs briefing`.
2. Read only the files needed for the user's current turn.
3. Keep the current session slice candidates in mind; use `session` only when runtime scratch helps.

## Retrieval

Before personal, reflective, planning, decision-heavy, or continuity-dependent answers:

1. Search first:

   ```bash
   node _system/life-os/scripts/life-os.mjs search <query>
   ```

2. Use entity search when an entity or alias is central:

   ```bash
   node _system/life-os/scripts/life-os.mjs search --entity life-os
   ```

3. Open only the highest-signal results.

## Capture

Capture durable material as slices. Use `slices/YYYY/MM/slice-YYYY-MM-DD-kebab-subject.md`.

Before writing:

1. Decide whether the turn continues an existing session subject, starts a new subject, or should stay uncaptured.
2. Ask before writing sensitive durable material, venting, stable identity changes, or inferred material beyond what the user grounded.
3. Resolve clear entities through `entities/registry.yaml`; leave ambiguous mentions plain.

After writing:

```bash
node _system/life-os/scripts/life-os.mjs lint
```

## View Workflows

Stories are flexible views. Do not treat `this-week`, `identity`, or any other story as a fixed Life OS feature type.

Per-view behavior is configured in `_system/life-os/view-workflows.json`. A view can define lifecycle actions such as:

```text
session_start -> read
after_turn -> consider_update
after_capture -> consider_update
after_turn -> ask_before_update
```

Update a story only according to its own configured purpose and lifecycle rules. Do not use stories as source memory.

## Stories

Create or update stories only when useful as a view or synthesis. Stories should gather slices; they should not replace slices as source memory.

## Maintenance

For unresolved links, alias cleanup, or structural repairs:

1. Run `lint`.
2. Fix registry aliases or wikilinks only when identity is clear.
3. Run `lint` again.

## Boundaries

This skill does not make the turn loop deterministic by itself. It packages the Life OS workflow for Codex. The deterministic parts are the configured commands once called by the agent.
