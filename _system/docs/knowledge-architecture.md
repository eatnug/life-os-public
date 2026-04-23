---
at: present
open: true
---

# Knowledge Architecture

## One Sentence

Life OS captures each conversation session into `slices`, links the `entities` that appear inside them, and gathers slices into `stories` only when a larger surface is useful.

## Core Objects

The core model has three objects.

```text
slice
entity
story
```

Everything else is support structure.

## Slice

A `slice` is the base stored unit.

```text
A slice captures one subject in one context.
```

`subject` means what the slice is about.

Examples:

- `Life OS slicing strategy`
- `Entity linking strategy`
- `Sentience Sam call`
- `RealWorld interview reflection`
- `Noah dinner`
- `Routine reset`

`context` means the current conversation/session/time window where the subject is being discussed.

### Session-Based Slicing

Each agent session keeps a local list of slice candidates.

Example:

```text
current session slices:
- life-os-slicing-strategy
- entity-linking-strategy
- sentience-followup
```

For each user turn:

```text
same subject in this session -> update existing session slice
new subject in this session -> create new session slice
new session -> start a fresh slice list
```

Within one session, the user may move back and forth between subjects. The agent should attach each turn/span to the matching session slice.

Example:

```text
U: Life OS slice 기준은...
-> slice A: life-os-slicing-strategy

U: 근데 entity는 어떻게 만들지?
-> slice B: entity-linking-strategy

U: 아까 slice 얘기에서 context가...
-> update slice A
```

Across sessions, create new slices by default, even for a related subject. Related slices can be gathered later by entity/story/search. Do not keep appending forever to an old slice.

### Slice Boundary

Use this boundary rule:

```text
Same context + same subject -> same slice.
New subject -> new slice.
New context -> new slice.
```

Do not split within the same subject just because the user mentions:

- facts
- feelings
- causes
- examples
- lessons
- decisions
- next thoughts

Split only when the user starts talking about a different subject.

When unsure inside one live session, avoid over-splitting.

### Slice File

Slices should have minimal frontmatter.

```md
---
at: 2026-04-21
open: true
subject: life-os-slicing-strategy
---

# Life OS Slicing Strategy

...
```

No `tags` field is required.

## Entity

An `entity` is anything that appears in my life and can be referred to again.

It does not need to be physical.
It does not need to be a proper noun.

Examples:

- people: `Sam`, `Noah`, `Migyeong`
- organizations: `Sentience`, `RealWorld`, `Team Attention`
- projects: `Tide`, `Life OS`, `Minder`
- events: `RealWorld interview`, `Sentience Sam call`
- plans: `Noah dinner`, `Team Attention dinner`
- concepts / concerns: `technical proof`, `routine reset`, `moving at others' tempo`, `memory and retrieval`

The practical test:

```text
Can this appear again as the same thing?
```

If yes, it can be an entity.

### Inline Entity Links

Entities live inline in slice content, not as detached frontmatter lists.

Example:

```md
I talked with [[sam-kececi|Sam]] at [[sentience-company|Sentience]] about [[life-os|Life OS]] and [[tide|Tide]].
```

Different surface words can point to the same entity.

Example:

```md
[[life-os|Life OS]]
[[life-os|second brain]]
[[life-os|memory system]]
```

The slice preserves natural wording. The registry resolves identity.

### Entity Linking Strategy

The agent should not read every slice to decide whether a string is an existing entity.

Use this pipeline:

```text
current slice
-> extract entity candidates
-> search registry/index
-> shortlist possible matches
-> resolve link/create/leave plain
-> write inline links
```

Candidate extraction only looks at the current slice.

Registry/index lookup handles memory search:

```text
exact alias match
normalized alias match
fuzzy alias match
semantic/profile match when available
```

The LLM should only resolve a small shortlist, not the whole memory.

Possible decisions:

```text
link        -> existing entity is clear
create      -> new stable entity is central or likely to recur
leave plain -> ambiguous, minor, or not stable enough
ask         -> important but ambiguous
```

Default to `leave plain` when uncertain.

## Story

A `story` is an intentional surface that gathers slices when useful.

```text
A story gathers slices.
```

A story is not source of truth. Slices are.

Do not predefine story types.

A story may be a project surface, schedule overview, long-running question, temporary collection, dashboard, synthesis, or anything else that usefully gathers slices. These are examples, not schema categories.

Stories are usually created intentionally:

- the user asks for one
- the user starts one explicitly
- the agent suggests one and the user accepts

Example:

```md
# Life OS Slicing Strategy

## Source Slices

- [[slice-2026-04-21-life-os-slicing-strategy]]
- [[slice-2026-04-22-life-os-slicing-strategy]]

## Current Understanding

...
```

### Archive

`archive` holds older material that should not be treated as active source memory in the new structure.

Archived files are preserved material from the previous system. Archive does not mean invalid; valid slice-shaped material can live in `slices/`.

Archived stories live under:

```text
archive/stories/
```

These are usually migrated long notes. They are not necessarily the sum of source slices yet.

Archived slices live under:

```text
archive/slices/
```

These are older notes, imported notes, undated notes, or pre-migration material that is not currently treated as active slice capture.

For archived files:

- keep their existing content intact
- do not force them into a slice-derived structure retroactively
- add source slices over time when new slices naturally connect to them
- let useful archived stories gradually become story views rather than rewriting them all at once

The target model is still:

```text
story = a useful surface over slices
```

But migrated material can remain in `archive` until it is naturally superseded or promoted into the active slice/story structure.

### Views

Views are intentionally underbuilt for now.

Stories can act as views when useful. `stories/this-week.md` is currently a todo-style view over slices due or active this week, but it is not a fixed Life OS feature type. It may exist, change, or disappear.

Views should not become source memory. Source memory stays in slices.

### View Workflows

A story can have lifecycle behavior configured outside the story body in `_system/life-os/view-workflows.json`.

Example lifecycle actions:

```text
session_start -> read
after_turn -> consider_update
after_capture -> consider_update
after_turn -> ask_before_update
```

This is workflow policy, not a story type. It can say a view should be read at session start, considered after every turn, updated after certain captures, or protected behind explicit confirmation. `identity` and `this-week` are current configured views, not mandatory surfaces.

### System Documents

`_system/` is for Life OS operating documents, tools, and apps, not life material.

It holds notes and code about how the repo itself should work, such as this architecture document, scripts, MCP servers, and publishing apps.

## Proposed Data Structure

Long-term target:

```text
slices/
  2026/
    04/
      slice-2026-04-21-life-os-slicing-strategy.md

stories/
  identity.md
  this-week.md
  posts/
  life-os.md
  minder.md

archive/
  stories/
    backlog.md
    career.md
  slices/
  lib/

entities/
  registry.yaml

_system/
  docs/
    knowledge-architecture.md
  tools/
  apps/
    blog/
```

During transition, existing files can stay where they are.

Conceptual mapping:

- old `short note` -> usually a `slice`
- old undated note -> usually an archived slice
- old `long note` -> usually an archived story or system note
- old `now/backlog.md` -> `archive/stories/backlog.md`
- current todo pressure -> `stories/this-week.md`
- old `now` / `next` / `past` -> state/view signals, not the primary ontology
- old `lib/entity-registry.yaml` -> `entities/registry.yaml`
- old `lib/identity.md` -> `stories/identity.md`
- old `lib/` contents -> `archive/lib/`
- old `system/` -> `_system/docs/`
- old `scripts/` -> `_system/tools/`
- old `blog/` runtime -> `_system/apps/blog/`
- old `blog/posts/` -> `stories/posts/`

## Proactive Agent Behavior

The agent should act as a thinking partner first and a storage clerk second.

The agent should:

1. Talk with the user first.
2. Maintain a session slice list internally.
3. Capture meaningful subjects as slices.
4. Update the matching session slice when the user returns to that subject.
5. Create a new slice when a new subject appears.
6. Link clear entities inline.
7. Leave ambiguous entity candidates as plain text.
8. Reflect actions/deadlines/open loops in the operational view when needed.

Capture when the conversation produces something real to keep:

- concrete event
- plan, schedule, deadline, or commitment
- decision
- meaningful thought clarified by the user
- recurring concern or pattern becoming clearer
- relevant person, project, company, concept, or problem space
- durable fact or open loop from external context
- explicit request to save/capture/remember/organize

Usually do not capture:

- "what should I do now?"
- short clarifying questions
- assistant proposals the user has not accepted
- transient wording experiments
- generic reassurance
- temporary confusion that does not become durable
- every conversational turn

Ask before capturing when:

- the content is sensitive and durable
- storage may feel intrusive
- a stable self-model file would change
- the agent would need to infer more than the user grounded

Do not store assistant synthesis as the user's belief unless the user accepts, confirms, or builds on it.

## Retrieval Architecture

Retrieval should be built on slices, not folders.

Basic retrieval lanes:

1. Recent slices
2. Entity lookup through inline links and registry
3. Story lookup
4. Date/time lookup
5. Text search
6. Optional semantic search

The index should be derived from markdown and registry data.

The LLM should not need to read all slices. It should retrieve candidates through index/search, then reason over a small relevant set.

## Minimal Rules

1. Store slices.
2. Link entities inline.
3. Keep entity identity in the registry.
4. Gather stories only when useful.
5. Do not predefine story types.
6. Do not force taxonomy.
7. Do not store every turn.
8. Stay a thinking partner first.

## Final Model

```text
source of truth = slices
meaning handles = inline entities + registry
larger surfaces = stories
retrieval layer = generated index/search over slices
```

The essence:

```text
Store slices. Link entities. Gather stories when useful.
```
