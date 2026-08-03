---
name: grill-choices
description: Grill the technical choices already baked into this codebase — stack, architecture, key libraries, data layer — one at a time, playing devil's advocate until each is defended or flagged. Use when the user wants to audit, pressure-test, or "grill" existing technical decisions rather than a forthcoming plan (that's grilling).
---

# Grill My Choices

`grilling` stress-tests a decision before it's made. This skill stress-tests decisions already made — the technical choices sitting in the codebase, unexamined since the day they landed.

## Process

1. **Surface the choices.** Scan the codebase for its load-bearing technical decisions: language/framework, data layer, architecture pattern, auth approach, key third-party libraries, testing strategy, deployment model. Check `docs/adr/` — an existing ADR already carries its rationale, so skip it unless the user names it for re-litigation. The undocumented choices are the targets; list them before asking anything.

2. **Interrogate one at a time**, exactly as `grilling` does: name the choice, state the strongest real alternative and what it would have bought, then ask the user to defend what's actually there. Wait for their answer before moving to the next — several choices at once is bewildering.

3. **Judge the defense.** A choice survives when the answer engages the counter-argument; restating the choice isn't a defense. Say so either way — this is where debt gets found, not smoothed over.

4. **Record the outcome.** A choice that survives with a rationale not yet in `docs/adr/` gets offered as one. A choice that doesn't survive gets a named follow-up — an ADR flagging the tradeoff, or a ticket to revisit it — never left as spoken words with nothing written down.

## Rules

- Anything discoverable in the code, look up yourself — don't make the user restate what you can read.
- Build the strongest case against each choice; you're pressure-testing it, not scoring points against the person who made it.
- Don't fix anything mid-interrogation. Findings become ADRs or tickets afterward, not silent edits.
