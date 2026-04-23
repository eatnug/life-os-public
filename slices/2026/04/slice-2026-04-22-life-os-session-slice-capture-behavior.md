---
at: 2026-04-22
open: true
subject: life-os-session-slice-capture-behavior
---

# Life OS Session Slice Capture Behavior

During a conversation about a personal reflection, I asked why the insight had not already been captured. The issue revealed a mismatch in agent behavior: the agent was acting as a thinking partner, but treated capture as a separate later file-write decision instead of maintaining a live in-progress slice topic list throughout the conversation.

Desired behavior for [[life-os|Life OS]]:

- the agent should work as a thinking partner first
- at the same time, it should maintain the current session's slice candidates internally
- when the user moves between subjects, the agent should update the relevant current slice candidate or create a new one
- sensitive material may still require permission before writing, but it should not disappear from the session slice list while waiting
- root-level instructions should make this explicit, not only deeper architecture documents

This became a concrete design requirement: memory capture should be part of the live conversational loop, not a cleanup task the agent remembers only at the end.
