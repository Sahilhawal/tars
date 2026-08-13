---
name: diagram-page
description: Turn the concept just discussed (or a named topic) into a standalone, polished HTML explainer page — a designed diagram with real prose — saved to disk as a keepable file. Combines artifact-design for the visual system with artifact-diagramming for the inline-SVG mechanics. Use when the user wants a "beautiful" or "polished" page, wants a diagram exported or saved as an HTML file, or asks for a keepable explainer page rather than a quick in-chat sketch (that's show-me).
---

# Diagram Page

One self-contained HTML file: a designed page built around a single diagram of the mechanism just discussed, with real prose around it. Heavier than `show-me`'s inline sketches — this is a deliverable meant to be kept, reopened, or handed to someone else, not a passing visual aid inside a chat reply.

**Argument:** an optional topic (defaults to whatever was just reasoned through in the conversation) and an optional destination path. Run only when the user asks for something standalone, saved, or polished — a quick "show me X" inside the reply stays with `show-me`.

## Steps

1. **Pin the subject.** Default to the mechanism just reasoned through in the conversation, not a restatement of the chat. If the user names a different topic, use that instead. Every claim on the page must trace back to something actually established in the conversation or supplied by the user — never invented reasoning, never lorem.

2. **Load `artifact-design`** for the visual system — palette (named hex tokens), typeface pairing, layout concept, light/dark theming, and its "avoid the generic AI-design look" constraints. Run its own read-the-request calibration: a page meant to be kept or shown to someone else usually reads as editorial, but let the actual request decide.

3. **Load `artifact-diagramming`** for the diagram itself — inline SVG mechanics, sized and colored from the tokens step 2 produced (`currentColor` / CSS custom properties, not hex hardcoded inside the SVG), arrowheads via markers, labeled edges, depicting the real mechanism rather than a generic box-and-arrow stand-in.

4. **Write the copy yourself.** Header, a few short "why it's shaped this way" notes, legend labels — pulled directly from what was established in the conversation, in your own words. Follow `artifact-design`'s copy rules: plain, active voice, no filler, specific over clever. Neither loaded skill writes this for you.

5. **Compose one self-contained file** — inline `<style>` carrying the step-2 tokens, inline `<svg>` from step 3, copy from step 4. No build step, no framework. This opens as a normal file in a real browser, not through the Artifact tool's CSP, so a CDN font link is fine — but keep everything else self-contained.

6. **Ask where to save it** if the user hasn't already said (a folder, "Downloads", a repo path). Don't guess a permanent destination silently. Write with the Write tool, then open it: `xdg-open <path>` (Linux) / `open <path>` (macOS) / `start <path>` (Windows).

## When not to use this

- A quick visual aid inside the chat reply, nothing saved → `show-me`.
- The result should be a shareable link rather than a file on disk → publish with the `Artifact` tool instead. Load `artifact-design` and `artifact-diagramming` the same way, but follow the Artifact tool's rules instead of this skill's (self-contained data URIs, no external font CDN, favicon required).

## Hard rules

- Never fabricate content to fill the page — if a claim isn't in the conversation and the user hasn't supplied it, ask rather than invent it.
- Keep the token list from step 2 as the single source of truth for color — the CSS and the SVG must read from the same values, never a hex duplicated in one place and drifted in the other.
- Never write inside the project repo unless the user names a repo path explicitly — default assumption is a personal file, wherever the user pointed.
