---
at: present
open: true
---

# Agent Operating Loop

This document describes how a Life OS agent should run inside this repo. `AGENTS.md` is the short canonical contract; this file is the detailed operating model.

The goal is not to make the thinking partner deterministic. The goal is to make the rails around it deterministic: what context gets loaded, how search candidates are found, what gets written, and how writes are checked.

The user should experience this as normal conversation. Commands and scripts in this document are for the agent or a future runner, not chores for the user.

## System Shape

For now, the agent runtime and the user's life memory live in the same repo. This is intentionally coupled. A future system can separate the runner from the memory repository, but the current priority is to make the loop concrete.

Core source model:

```text
slices   -> source memory
entities -> identity and alias handles
stories  -> intentional views or syntheses over slices
```

Support structure:

```text
_system/docs/   -> operating docs
_system/tools/  -> older/non-core utilities such as dashboard and Google Workspace MCP
_system/runtime -> ignored runtime scratch
_system/life-os -> shared Life OS runtime, config, and view workflows
.codex/skills/life-os -> Codex Life OS adapter
.claude/skills/life-os -> Claude Code Life OS adapter
.gemini/extensions/life-os -> Gemini CLI Life OS adapter
```

Runtime scratch is not a memory layer. It is temporary agent state.

Agent-specific Life OS adapters:

```text
Codex       -> .codex/skills/life-os/
Claude Code -> .claude/skills/life-os/
Gemini CLI  -> .gemini/extensions/life-os/
```

The adapters make the same Life OS workflow discoverable to each agent. The shared dispatcher lives under `_system/life-os/scripts/` so behavior does not fork across agents.

## Session Start

At the beginning of a new agent session:

1. Load `AGENTS.md`.
2. Run or mentally reconstruct the startup briefing.
3. Read only the directly relevant source files.
4. Initialize an empty current-session slice candidate list.

Preferred agent-internal command:

```bash
node _system/life-os/scripts/life-os.mjs briefing
```

The briefing should stay small. It should orient the agent to current pressure, active slices, recent captures, and available tools. It should not become a full personality summary.

## Turn Loop

For each user turn:

1. Listen to the live user first.
2. Identify the turn shape.
3. Retrieve only what is needed.
4. Respond or act.
5. Update session slice candidates.
6. Capture durable material when appropriate.
7. Validate after writes.

## Turn Shapes

Use light intent detection. Do not turn this into a rigid classification ritual.

Direct question:

- answer the question
- retrieve memory only if the answer depends on continuity or personal context

Reflective conversation:

- stay in the conversation
- ask a question only if it helps clarify the real issue
- avoid turning every feeling into a note
- capture only clarified durable insight, recurring pattern, decision, or open loop

Explicit storage or organization command:

- do the requested write or organization
- preserve the user's wording where useful
- validate after writes

Planning or scheduling:

- check relevant startup/active stories and relevant slices
- capture concrete commitments, dates, deadlines, and open loops
- update a planning/story view only when it exists and its purpose calls for that update

Repo or system work:

- read local files first
- keep edits scoped
- update system docs or tools when the change is accepted or implemented
- validate with scripts where possible

## Retrieval

Retrieval exists to support the answer. It is not a separate ceremony.

Preferred agent-internal command:

```bash
node _system/life-os/scripts/life-os.mjs search <query>
```

Entity search:

```bash
node _system/life-os/scripts/life-os.mjs search --entity life-os
```

Recent slices:

```bash
node _system/life-os/scripts/life-os.mjs search --recent 10
```

Manual reading is still fine after search narrows the candidate set.

## Session Slice Candidates

Maintain a small live list of subjects in the current conversation.

Each candidate should have:

```text
subject
status: candidate | written | pending-permission | uncaptured
file, if written
short note, if useful
```

If tool support is useful:

```bash
node _system/life-os/scripts/life-os.mjs session init
node _system/life-os/scripts/life-os.mjs session add life-os-thinking-partner-agent-system --status written --file slices/2026/04/slice-2026-04-22-life-os-thinking-partner-agent-system.md
node _system/life-os/scripts/life-os.mjs session list
```

Do not put sensitive body text in runtime scratch unless the user explicitly asks for it.

## Capture

Capture when the conversation produces durable material:

- event
- plan, schedule, deadline, or commitment
- accepted decision
- clarified thought
- recurring concern or pattern
- meaningful person, project, company, concept, or problem space
- explicit save/capture/remember command

Do not capture:

- every exchange
- generic encouragement
- unaccepted assistant synthesis
- temporary confusion that does not become durable

Sensitive durable material should become `pending-permission` first. Ask before writing.

## Validation

After writing markdown memory files, run:

```bash
node _system/life-os/scripts/life-os.mjs lint
```

The linter should catch structural issues without turning old transitional material into noisy failures. Warnings are acceptable during migration; errors should be fixed before considering the write complete.

## Tool Roles

`briefing.mjs`:

- small session-start snapshot
- view workflows with `session_start` lifecycle actions
- startup system docs declared by config
- recent slices
- counts and command hints

`search.mjs`:

- deterministic lexical search over slices, stories, docs, and registry aliases
- entity-aware search through `entities/registry.yaml`

`lint-life-os.mjs`:

- frontmatter checks
- filename checks
- wikilink target checks
- entity alias duplicate checks

`session.mjs`:

- optional ignored runtime scratch
- current session slice candidates

`_system/life-os/scripts/life-os.mjs`:

- shared Life OS dispatcher
- reads `_system/life-os/config.json`
- forwards to the configured runtime scripts

Hooks can be added later, but the skill scripts and dispatcher are the current base layer.

## Future Separation

Eventually, the agent runner and the life-memory repo may split:

```text
runner/system repo -> tools, hooks, prompts, app runtime
memory repo        -> slices, entities, stories
```

Do not optimize for that separation yet. Keep the current system simple and useful even if it is coupled.
