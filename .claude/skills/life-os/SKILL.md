---
name: life-os
description: Use when working in this Life OS repo to retrieve context, capture or update slices, maintain entities/stories, follow view workflows, run internal briefing/search/lint, or perform Life OS system maintenance.
---

# Life OS Skill

Use this skill for Life OS memory work in this repo.

The user should not need to invoke commands. The normal interface is conversation. Use the internal Life OS dispatcher yourself when it helps with retrieval, validation, or session scratch.

`AGENTS.md` remains the canonical always-loaded instruction. `_system/life-os/config.json` defines repo paths and command mappings. `_system/life-os/view-workflows.json` defines per-view lifecycle behavior.

## Internal Dispatcher

Use the shared Life OS dispatcher:

```bash
node _system/life-os/scripts/life-os.mjs briefing
node _system/life-os/scripts/life-os.mjs search <query>
node _system/life-os/scripts/life-os.mjs search --entity <entity-id-or-alias>
node _system/life-os/scripts/life-os.mjs lint
node _system/life-os/scripts/life-os.mjs session list
node _system/life-os/scripts/life-os.mjs check
```

These are agent-internal commands. Do not ask the user to run them.

## Workflow

At session start, run briefing or reconstruct the same context from config.

Before personal, reflective, planning, decision-heavy, or continuity-dependent answers, search relevant slices/entities/views before broad manual reading.

When capturing durable material:

1. Decide whether the turn continues an existing subject, starts a new subject, or should stay uncaptured.
2. Ask before writing sensitive durable material, venting, stable self-model changes, or inferred material beyond what the user grounded.
3. Store source memory as slices.
4. Link clear entities through `entities/registry.yaml`; leave uncertain mentions plain.
5. Consider `_system/life-os/view-workflows.json` lifecycle rules for relevant views.
6. Run lint after writes.

Stories are flexible views, not fixed feature types. Do not treat `this-week`, `identity`, or any other story as mandatory.

This skill does not create a deterministic runtime loop. It gives Claude the Life OS workflow and internal commands to use while keeping the user experience natural.
