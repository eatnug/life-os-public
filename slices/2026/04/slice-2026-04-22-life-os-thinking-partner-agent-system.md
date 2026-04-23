---
at: 2026-04-22
open: true
subject: life-os-thinking-partner-agent-system
---

# Life OS Thinking Partner Agent System

I said that [[life-os|Life OS]] needs a more systematic agent design to work well.

What I want from this repo is not only a question-answering assistant, but a thinking partner. When I talk about worries, future schedules, people I meet, work, events I participate in, or new pieces of life context, the agent should listen, continue the conversation, ask questions when useful, and naturally store durable fragments.

The memory should accumulate over time so the agent understands me better and can talk with me based on that accumulated context.

Follow-up concerns:

- The [[agent-operating-loop|agent loop]] needs to start with project/user context loading.
- Retrieval should happen because the answer needs it, not as a separate memory ritual.
- Capture can happen after responding, but the agent should notice durable material while the conversation is happening.
- I want deterministic behavior where possible.
- I do not want to over-label memory layers as working/episodic/etc. The intended model is simpler: store source material as slices, then create stories or generated views only when useful.

Implementation direction:

- Use a canonical instruction file for the Life OS operating contract.
- Keep agent-specific adapters thin for [[codex|Codex]], [[claude|Claude]], and [[gemini|Gemini]].
- Put shared helper scripts in an agent-neutral runtime.
- Keep deterministic helper tools for startup briefing, search, session scratch, and linting.

Open issue:

The helper scripts make individual steps deterministic once called, but they do not create a fully deterministic turn runner by themselves. Without hooks, a wrapper, or a dedicated runner, the loop still depends on the agent following the operating contract.
