---
name: brainstorm
description: Take a rough feature idea and develop it into a sharper, better-scoped version — grounded in the actual codebase, with concrete suggestions and options. The step before grill-me.
---

# Brainstorm

The user brings a feature idea in brief — sometimes a single sentence. Your job is to grow it into a **better version of itself**: sharper, better-scoped, and grounded in what the project already is. You bring suggestions; the user keeps ownership of the idea.

This is **not** an interview — that's `grill-me`'s job. Brainstorm expands, grill-me stress-tests. The natural pipeline: `brainstorm` → `grill-me` → `to-spec`.

## Process

### 1. Ground yourself in the project

Before saying anything about the idea, load the context that makes your suggestions concrete instead of generic:

- `CONTEXT.md` — the domain glossary; use its vocabulary
- `CLAUDE.md` and `docs/adr/` — conventions and decisions the idea must respect
- `docs/specs/` and open PRD issues — what's already planned, so you don't propose a duplicate
- A quick look at the codebase areas the idea touches — what already exists to build on

### 2. Reflect the idea back, bigger

Present the enriched version:

- **The idea, sharpened** — restate it as a clear problem + outcome, in the project's domain vocabulary. If the user's framing was solution-first ("add a queue"), surface the problem underneath it.
- **What already helps** — existing modules, patterns, or half-built things in the codebase this idea can stand on. An idea that reuses is a better idea.
- **Suggestions** — concrete improvements the user didn't ask for: edge cases worth covering, a simpler cut, a generalization that costs little, a pitfall to design around. Each with a one-line why.
- **Options** — 2–3 genuinely different directions (e.g. minimal version vs. full version, build vs. configure), with a **recommendation** and the reason. Don't survey the universe — curate.
- **Scope sketch** — what's the smallest demoable version, and what's explicitly the "later" list.

### 3. Iterate with the user

Ask which suggestions land and which direction they want. Keep it a conversation, not a checklist — a couple of rounds is normal. When the user is happy, summarize the agreed version in a short paragraph: the idea as it now stands.

### 4. Hand off

End with: "This is ready to be stress-tested — run `/grill-me` and I'll interrogate it." The enriched idea stays in the conversation, so grill-me picks it up directly. Do **not** write a spec — that's `/to-spec`, after grilling.

## Hard rules

- Suggest, don't decide. The idea belongs to the user; every change to it needs their nod.
- Every suggestion must cite something real — a file, an existing feature, an ADR, a spec. Generic advice ("consider scalability") is banned.
- Don't interrogate. Ambiguities you can't resolve become open questions in the summary — grill-me will mine them.
- Don't write tickets or specs. Expansion only.
