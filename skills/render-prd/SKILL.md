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

   No tickets section — tickets don't exist until `/to-tickets` runs against the published PRD. Replace the Tickets section with a single muted line: `Tickets are created once this PRD is published and /to-tickets runs against it.`

3. **Open it immediately**: `xdg-open <path>` / `open <path>` / `start <path>` per platform. Don't ask first.

## Scaffold

Tailwind, `marked`, and `mermaid` load from CDN; nothing else. **The PRD/spec body is markdown and may contain backticks, quotes, or `</script>`-like text — never splice it into a JS string literal.** Put it, HTML-escaped (`&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;`), inside a `<template>` element instead, and read `.content.textContent` from it at render time. That sidesteps every escaping hazard at once.

The body may contain fenced ` ```mermaid ` blocks (e.g. the "Feature Flows" section `/to-spec` writes) — `marked` renders these as `<pre><code class="language-mermaid">…</code></pre>`; the init script below rewrites them into `<pre class="mermaid">` blocks and hands them to Mermaid.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{{title}} — tars</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <header>
        <p class="text-xs uppercase tracking-wider text-slate-500">
          <!-- GitHub mode: "PRD #{{number}} · {{state}}" — Local mode: "Draft spec · {{status}}" -->
        </p>
        <h1 class="text-3xl font-serif mt-1">{{title}}</h1>
        <!-- only if a URL is known (GitHub mode, or local mode with a resolved Issue link) -->
        <a href="{{url}}" target="_blank" class="text-sm text-indigo-600">View on GitHub ↗</a>
      </header>

      <template id="prd-body-source">{{HTML-escaped body}}</template>
      <article id="prd-body" class="prose max-w-none"></article>

      <section>
        <h2 class="text-xl font-serif mb-4">Tickets</h2>
        <div class="space-y-4">
          <!-- GitHub mode: one card per ticket, or the empty state — see below -->
          <!-- Local mode: the single muted line noted above -->
        </div>
      </section>
    </main>
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
      mermaid.initialize({ startOnLoad: true, theme: "neutral" });
    </script>
  </body>
</html>
```

**Ticket card** (GitHub mode only) — one `<div class="border border-slate-200 rounded-lg p-4">` per ticket:

```html
<div class="border border-slate-200 rounded-lg p-4">
  <h3><a href="{{ticket url}}" target="_blank" class="font-medium">#{{number}} — {{title}}</a></h3>
  <p class="mt-1">
    <!-- one span per label -->
    <span class="text-xs px-2 py-0.5 rounded-full bg-slate-200 mr-1">{{label}}</span>
  </p>
  <!-- only if a Blocked by line was found -->
  <p class="text-sm text-slate-500 mt-1">Blocked by: {{text}}</p>
</div>
```

No tickets yet (GitHub mode, PRD published but `/to-tickets` hasn't run) → a single muted line instead of the card list: `No tickets yet — run /to-tickets on this PRD.`

## Hard rules

- Author the HTML directly with the Write tool — no build step, no npm, no script this skill has to locate on disk.
- Never write inside the project repo — this is a disposable view, not a durable artifact. The durable record is the GitHub issue (GitHub mode) or the committed spec file (local mode).
- **GitHub mode:** never open the file without asking first.
- **Local mode:** always open immediately, no asking — the auto-open is the entire point of wiring this into `/to-spec`.
