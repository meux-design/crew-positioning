# Split handoff — how to use

For AI tools with limited context or no memory between sessions.

## Files

```
CONTEXT.md          Stable project context. Never changes.
PROGRESS.md         Running log. The assistant appends to it.
units/01..07.md     One work unit each. Fed one at a time.
```

## Per session

Paste, in this order:

1. `CONTEXT.md`
2. `PROGRESS.md` (skip on the first session)
3. The single unit file you are working on

Then: *"Write the specification for this unit. Do not write implementation code yet."*

Review the spec. When it is right: *"Implement it."*

At the end: *"Append your handover note to PROGRESS.md."*

## Rules

**One unit per session.** Two units in one context is how drift starts.

**Never skip CONTEXT.md.** It carries the design tokens, accessibility bar, and scope fence. Without it the assistant will invent a palette and widen scope.

**Never let PROGRESS.md go unwritten.** It is the only continuity between sessions.

**Unit 02 is load-bearing.** It resolves whether seats.aero exposes arrival times. If it does not, unit 04 needs rethinking and possibly unit 03's core filter too. Do not start unit 03 until this is answered.

## If the tool has a project-instructions or rules feature

Put `CONTEXT.md` there instead of pasting it each time. Cursor `.cursorrules`, Copilot `.github/copilot-instructions.md`, and similar all work. You then only paste `PROGRESS.md` and the unit file.

## First session prompt

> Here is the project context and the first work unit. Read both fully.
>
> Write the specification for unit 01 following the format in §12 of the context document. Do not write implementation code yet. If anything is ambiguous, ask before assuming.
