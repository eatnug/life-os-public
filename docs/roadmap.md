# Roadmap

Life OS started as a small personal project. The roadmap is now less about adding features and more about answering a few hard design questions.

## Deterministic Agent Behavior

The agent should feel conversational, but its memory behavior should not be random.

Open questions:

- When should the agent retrieve context?
- When should it capture a new memory?
- When should it update an existing slice?
- When should it ask before storing?
- How can the same loop work across different agents?

Next steps:

- Keep a canonical operating contract.
- Add deterministic helper scripts for startup, search, session state, and linting.
- Build small replay tests for memory-heavy conversations.

## Data Structure

The memory model needs to be simple enough to edit and structured enough to retrieve.

Current model:

- `slices`: source memory
- `entities`: identity and alias layer
- `stories`: views over slices

Open questions:

- How atomic should slices be?
- When should something become an entity?
- How much structure belongs in frontmatter vs body text?
- How should links, aliases, and source references evolve over time?

Next steps:

- Keep the source format plain markdown.
- Use inline entity links instead of heavy schemas.
- Test whether small slices retrieve better than larger notes.

## Stories As Views

Stories are not source memory. They are surfaces over memory.

Examples:

- current week
- identity
- project thread
- relationship thread
- shareable synthesis

Open questions:

- Which views should update automatically?
- Which views should require confirmation?
- How do views stay useful without becoming stale summaries?
- Can the same slice support multiple views without duplicating source memory?

Next steps:

- Keep per-view lifecycle rules in config.
- Treat stories as disposable/rebuildable views.
- Preserve source memory in slices.

## External Context Collection

Useful context often comes from outside chat: email, calendar, documents, GitHub, Slack, web pages, and files.

Open questions:

- When should external data be read?
- What should become memory?
- What should stay as temporary context?
- How should private or third-party information be handled?

Next steps:

- Treat external integrations as read-only by default.
- Capture only durable conclusions, decisions, or open loops.
- Keep source boundaries clear.

## Privacy, Consent, And Agency

A useful thinking partner may need access to very private context. That creates risks beyond ordinary data security.

Open questions:

- What should the system be allowed to know?
- What should it remember by default, and what should require explicit consent?
- How should a user inspect, edit, delete, or scope memory?
- How should the system handle information about other people?
- If an agent speaks or acts on behalf of a person, how do we prevent it from saying things the person would not endorse?
- What should require confirmation before the agent uses the user's voice, identity, commitments, or relationships?
- Which parts should run locally or on-device, and which parts can safely use hosted models?
- What guardrails should exist around retrieval, impersonation, outbound messages, and action-taking?

Next steps:

- Treat external integrations as read-only by default.
- Require confirmation for outbound communication or identity-sensitive actions.
- Make memory inspectable and editable.
- Keep source boundaries and provenance visible.
- Explore local/on-device models or private execution paths for sensitive memory.
- Build redaction and consent rules into the memory layer, not only the UI.
