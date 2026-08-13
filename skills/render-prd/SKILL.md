---
name: render-prd
description: Render a PRD as a single self-contained HTML file with prose, mermaid flow diagrams, and illustrative call stacks. Two modes — a published PRD issue plus its nested tickets (manual, ask before opening), or a local draft spec file (auto-invoked by /to-spec after every write, opens without asking). Use whenever the user wants to view, render, or open a PRD in the browser.
---

# Render PRD

Turn a PRD into a readable, self-contained HTML file — no server, no build step, no dependency beyond what the CDN scripts the file loads at view time.

**Argument:** a PRD issue number (**GitHub mode**), or a local spec file path like `docs/specs/<slug>.md` (**Local mode**).

## GitHub mode

Run only when the user asks for it (`/render-prd <n>`) — nothing else calls this on its own.

1. **Gather the data.**
   - PRD: `gh issue view <n> --json number,title,url,state,body`
   - Owner/repo: `gh repo view --json nameWithOwner -q .nameWithOwner`
   - Ticket numbers: `gh api repos/<owner>/<repo>/issues/<n>/sub_issues --jq '[.[].number]'` — empty or erroring means no tickets yet (older GitHub Enterprise, or none published); treat as zero tickets, don't fail the render.
   - Per ticket: `gh issue view <ticket-n> --json number,title,url,state,labels,body`. Take `labels` for badges. Parse the body's `## Blocked by` section (everything until the next `##` heading or end of body) for the blocked-by line — trim it, and if empty treat as none. Nothing else from the ticket body: no comment trail, no full description.

2. **Write the HTML** (see Scaffold below) to `<tmpdir>/tars-prd-<n>.html`, where `<tmpdir>` is `$TMPDIR` (falling back to `/tmp`, or `%TEMP%` on Windows) — never inside the project repo. Always this exact filename for a given PRD number, so re-rendering (e.g. after more tickets land) overwrites the same file instead of leaving stale copies behind.

3. **Report the path, then ask the user whether to open it.** Only on yes: `xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows.

## Local mode

Argument: a local spec file path. Invoked automatically by `/to-spec` — once right after it writes or edits the draft, and once more right after publish. Can also be run manually (`/render-prd docs/specs/<slug>.md`) at any time.

Renders straight off disk — no `gh` calls except one optional lookup for a GitHub link. **Opens immediately, without asking.** This is a disposable, local-only preview meant to let the user catch problems by eye before the PRD goes any further, not a decision that needs gating.

1. **Read the spec file directly** with the Read tool.
   - Title: the text after `# ` on the first heading line; fall back to the file's basename (slug, title-cased) if no heading is found.
   - Status: the `**Status:** <word>` line.
   - GitHub link (optional): if a `**Issue:** #<N>` line is present, try `gh issue view <n> --json url -q .url` for the link. If that fails, or there's no `gh`/no remote, just omit the link — never fail the render over it.
   - Body: everything else, treated as markdown exactly like GitHub mode (same escaping rules apply).

2. **Write the HTML** (see Scaffold below) to `<tmpdir>/tars-spec-<slug>.html`, where `<slug>` is the file's basename without extension and `<tmpdir>` follows the same rule as GitHub mode. Always this exact filename for a given slug, so re-rendering after an edit overwrites the same file instead of leaving stale copies.

   No tickets section — tickets don't exist until `/to-tickets` runs against the published PRD. Replace the Tickets section with a single `<p class="ticket-empty">`: `Tickets are created once this PRD is published and /to-tickets runs against it.`

3. **Open it immediately**: `xdg-open <path>` / `open <path>` / `start <path>` per platform. Don't ask first.

## Scaffold

The design is a **spec sheet**, not a blog post: an amber eyebrow, a mono headline, prose in a warm literary serif, all on an espresso-toned ground with a faint drafting grid behind the text. These are the exact tokens and system font stacks from a hand-built reference page — copy them exactly, don't approximate or reintroduce Tailwind/Google Fonts. Mono carries every piece of structural data (eyebrow, ticket numbers, code, table headers); serif carries the prose. Amber is the one accent — links, the eyebrow, the active state; ok/warn are status-only, never decoration. `marked` and `mermaid` load from CDN for parsing; everything visual is hand-authored CSS.

**The PRD/spec body is markdown and may contain backticks, quotes, or `</script>`-like text — never splice it into a JS string literal.** Put it, HTML-escaped (`&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;`), inside a `<template>` element instead, and read `.content.textContent` from it at render time. That sidesteps every escaping hazard at once.

The body may contain fenced ` ```mermaid ` blocks (e.g. the "Feature Flows" section `/to-spec` writes) — `marked` renders these as `<pre><code class="language-mermaid">…</code></pre>`; the init script below rewrites them into `<pre class="mermaid">` blocks and hands them to Mermaid, themed to match light/dark.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{title}} — tars</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
      :root {
        --bg: #171410;
        --surface: #1e1a14;
        --surface-2: #241f17;
        --ink: #ede8dc;
        --ink-dim: #a79c88;
        --line: #3a342a;
        --grid-line: rgba(237, 232, 220, 0.045);
        --accent: #d9a441;
        --accent-soft: rgba(217, 164, 65, 0.12);
        --ok: #6fb88a;
        --warn: #d97748;
        --font-mono: ui-monospace, "SFMono-Regular", "Cascadia Code", "JetBrains Mono", Consolas,
          "Liberation Mono", Menlo, monospace;
        --font-serif: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia,
          "Times New Roman", serif;
      }
      @media (prefers-color-scheme: light) {
        :root {
          --bg: #efeae0;
          --surface: #e7e0d2;
          --surface-2: #e1d9c8;
          --ink: #23201a;
          --ink-dim: #6b6252;
          --line: #cfc6b0;
          --grid-line: rgba(35, 32, 26, 0.05);
          --accent: #a6741f;
          --accent-soft: rgba(166, 116, 31, 0.1);
          --ok: #3f8562;
          --warn: #a8502e;
        }
      }
      * { box-sizing: border-box; }
      :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      body {
        margin: 0;
        background-color: var(--bg);
        background-image:
          linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
        background-size: 34px 34px;
        color: var(--ink);
        font-family: var(--font-serif);
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
      }
      .page { max-width: 46rem; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
      .titleblock { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 3rem; }
      .kicker {
        font-family: var(--font-mono); font-size: 0.75rem;
        letter-spacing: 0.09em; text-transform: uppercase; color: var(--accent);
      }
      h1 {
        font-family: var(--font-mono); font-weight: 700; font-size: clamp(1.8rem, 4vw, 2.35rem);
        letter-spacing: -0.01em; margin: 0; text-wrap: balance;
      }
      .meta-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.25rem; }
      .meta-link {
        font-family: var(--font-mono); font-size: 0.8rem;
        color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent;
      }
      .meta-link:hover { border-bottom-color: var(--accent); }
      .status-pill {
        display: inline-flex; align-items: center; gap: 0.5rem; width: fit-content;
        padding: 0.4rem 0.85rem; border: 1px solid var(--line); border-radius: 999px;
        background: var(--surface); font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-dim);
      }
      .status-pill::before { content: ""; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: var(--ink-dim); }
      .status-approved::before, .status-closed::before { background: var(--ok); }
      .status-draft::before, .status-open::before { background: var(--accent); }
      .prose h2 { font-family: var(--font-mono); font-weight: 700; font-size: 1.15rem; margin: 2.5rem 0 1rem; }
      .prose h3 { font-family: var(--font-mono); font-weight: 700; font-size: 0.98rem; margin: 2rem 0 0.75rem; }
      .prose p { margin: 0 0 1rem; }
      .prose ul, .prose ol { margin: 0 0 1rem; padding-left: 1.4rem; }
      .prose li { margin: 0.3rem 0; }
      .prose a { color: var(--accent); }
      .prose strong { font-weight: 600; }
      .prose blockquote {
        margin: 1.25rem 0; padding: 0.25rem 0 0.25rem 1rem;
        border-left: 2px solid var(--accent); color: var(--ink-dim);
      }
      .prose code {
        font-family: var(--font-mono); font-size: 0.85em;
        background: var(--surface-2); padding: 0.1em 0.35em; border-radius: 4px;
      }
      .prose pre {
        background: var(--surface); border: 1px solid var(--line); border-radius: 8px;
        padding: 1rem; overflow-x: auto;
      }
      .prose pre code { background: none; padding: 0; }
      .prose table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.9rem; }
      .prose th, .prose td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--line); }
      .prose th {
        font-family: var(--font-mono); font-size: 0.75rem;
        text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-dim);
      }
      .prose .mermaid {
        background: var(--surface); border: 1px solid var(--line); border-radius: 8px;
        padding: 1.25rem; margin: 1.5rem 0; overflow-x: auto;
      }
      .tickets { margin-top: 3.5rem; }
      .tickets h2 { font-family: var(--font-mono); font-weight: 700; font-size: 1.15rem; margin: 0 0 1rem; }
      .ticket-list { display: flex; flex-direction: column; gap: 0.75rem; }
      .ticket-empty { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-dim); }
      .ticket-card {
        background: var(--surface); border: 1px solid var(--line); border-left: 3px solid var(--line);
        border-radius: 8px; padding: 0.85rem 1rem;
      }
      .ticket-card.ticket-done { border-left-color: var(--ok); }
      .ticket-card.ticket-blocked { border-left-color: var(--warn); }
      .ticket-card.ticket-in-progress { border-left-color: var(--accent); }
      .ticket-head { display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap; }
      .ticket-number { font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-dim); }
      .ticket-title { font-family: var(--font-serif); font-weight: 500; color: var(--ink); text-decoration: none; }
      .ticket-title:hover { color: var(--accent); }
      .ticket-meta { margin-top: 0.4rem; display: flex; flex-wrap: wrap; gap: 0.35rem; }
      .chip {
        font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.02em;
        padding: 0.15rem 0.5rem; border-radius: 999px; background: var(--surface-2); color: var(--ink-dim);
      }
      .ticket-blocked { margin: 0.5rem 0 0; font-family: var(--font-mono); font-size: 0.78rem; color: var(--warn); }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="titleblock">
        <p class="kicker"><!-- GitHub mode: "PRD #{{number}}" — Local mode: "Draft spec" --></p>
        <h1>{{title}}</h1>
        <div class="meta-row">
          <span class="status-pill status-{{state or status, lowercased}}">{{state or status}}</span>
          <!-- only if a URL is known (GitHub mode, or local mode with a resolved Issue link) -->
          <a href="{{url}}" target="_blank" class="meta-link">View on GitHub ↗</a>
        </div>
      </header>

      <template id="prd-body-source">{{HTML-escaped body}}</template>
      <article id="prd-body" class="prose"></article>

      <section class="tickets">
        <h2>Tickets</h2>
        <div class="ticket-list">
          <!-- GitHub mode: one card per ticket, or the empty state — see below -->
          <!-- Local mode: the single muted line noted above, class="ticket-empty" -->
        </div>
      </section>
    </div>
    <script>
      const raw = document.getElementById("prd-body-source").content.textContent;
      document.getElementById("prd-body").innerHTML = marked.parse(raw);
      document.querySelectorAll("#prd-body pre code.language-mermaid").forEach((block) => {
        const pre = block.parentElement;
        const div = document.createElement("pre");
        div.className = "mermaid";
        div.textContent = block.textContent;
        pre.replaceWith(div);
      });
      const light = window.matchMedia("(prefers-color-scheme: light)").matches;
      mermaid.initialize({
        startOnLoad: true,
        theme: "base",
        themeVariables: light
          ? { primaryColor: "#e7e0d2", primaryTextColor: "#23201a", primaryBorderColor: "#cfc6b0", lineColor: "#6b6252", fontFamily: "Georgia, serif" }
          : { primaryColor: "#1e1a14", primaryTextColor: "#ede8dc", primaryBorderColor: "#3a2b1e", lineColor: "#a79c88", fontFamily: "Georgia, serif" },
      });
    </script>
  </body>
</html>
```

**Ticket card** (GitHub mode only) — one per ticket, `ticket-{{state}}` picked the same way `render-board` buckets columns: closed → `done`, `tars:blocked` → `blocked`, `tars:in-progress` → `in-progress`, everything else → `ready` (no stripe override needed, the base border color already reads as pending):

```html
<div class="ticket-card ticket-{{done|blocked|in-progress|ready}}">
  <div class="ticket-head">
    <span class="ticket-number">#{{number}}</span>
    <a href="{{ticket url}}" target="_blank" class="ticket-title">{{title}}</a>
  </div>
  <div class="ticket-meta">
    <!-- one chip per label -->
    <span class="chip">{{label}}</span>
  </div>
  <!-- only if a Blocked by line was found -->
  <p class="ticket-blocked">Blocked by {{text}}</p>
</div>
```

No tickets yet (GitHub mode, PRD published but `/to-tickets` hasn't run) → a single `<p class="ticket-empty">` instead of the card list: `No tickets yet — run /to-tickets on this PRD.`

## Hard rules

- Author the HTML directly with the Write tool — no build step, no npm, no script this skill has to locate on disk.
- Never write inside the project repo — this is a disposable view, not a durable artifact. The durable record is the GitHub issue (GitHub mode) or the committed spec file (local mode).
- **GitHub mode:** never open the file without asking first.
- **Local mode:** always open immediately, no asking — the auto-open is the entire point of wiring this into `/to-spec`.
