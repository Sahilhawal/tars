---
name: render-prd
description: Render a PRD issue and its nested tickets as a single self-contained HTML file, then ask whether to open it. Use after publishing or updating a PRD (to-spec, to-tickets), or whenever the user wants to view a PRD in the browser.
---

# Render PRD

Turn a PRD issue into a readable, self-contained HTML file — no server, no build step, no dependency beyond what the file loads from a CDN at view time.

**Argument:** a PRD issue number. If invoked right after `/to-spec` publishes one or `/to-tickets` attaches tickets to one, use that number without asking.

## Process

1. **Gather the data.**
   - PRD: `gh issue view <n> --json number,title,url,state,body`
   - Owner/repo: `gh repo view --json nameWithOwner -q .nameWithOwner`
   - Ticket numbers: `gh api repos/<owner>/<repo>/issues/<n>/sub_issues --jq '[.[].number]'` — empty or erroring means no tickets yet (older GitHub Enterprise, or none published); treat as zero tickets, don't fail the render.
   - Per ticket: `gh issue view <ticket-n> --json number,title,url,state,labels,body`. Take `labels` for badges. Parse the body's `## Blocked by` section (everything until the next `##` heading or end of body) for the blocked-by line — trim it, and if empty treat as none. Nothing else from the ticket body: no comment trail, no full description.

2. **Write the HTML** to `<tmpdir>/tars-prd-<n>.html`, where `<tmpdir>` is `$TMPDIR` (falling back to `/tmp`, or `%TEMP%` on Windows) — never inside the project repo. Always this exact filename for a given PRD number, so re-rendering (e.g. after more tickets land) overwrites the same file instead of leaving stale copies behind. Follow the scaffold below exactly — this should look the same every time, not be redesigned per run.

3. **Report the path**, then ask the user whether to open it. Only on yes: `xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows. Don't open it unprompted.

## Scaffold

Tailwind and `marked` load from CDN; nothing else. **The PRD body is markdown and may contain backticks, quotes, or `</script>`-like text — never splice it into a JS string literal.** Put it, HTML-escaped (`&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;`), inside a `<template>` element instead, and read `.content.textContent` from it at render time. That sidesteps every escaping hazard at once.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{{PRD title}} — tars</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <header>
        <p class="text-xs uppercase tracking-wider text-slate-500">
          PRD #{{number}} · {{state}}
        </p>
        <h1 class="text-3xl font-serif mt-1">{{title}}</h1>
        <a href="{{url}}" target="_blank" class="text-sm text-indigo-600">View on GitHub ↗</a>
      </header>

      <template id="prd-body-source">{{HTML-escaped PRD body}}</template>
      <article id="prd-body" class="prose max-w-none"></article>

      <section>
        <h2 class="text-xl font-serif mb-4">Tickets</h2>
        <div class="space-y-4">
          <!-- one card per ticket, or the empty state — see below -->
        </div>
      </section>
    </main>
    <script>
      const raw = document.getElementById("prd-body-source").content.textContent;
      document.getElementById("prd-body").innerHTML = marked.parse(raw);
    </script>
  </body>
</html>
```

**Ticket card** — one `<div class="border border-slate-200 rounded-lg p-4">` per ticket:

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

No tickets yet → a single muted line in the section instead of the card list: `No tickets yet — run /to-tickets on this PRD.`

## Hard rules

- Author the HTML directly with the Write tool — no build step, no npm, no script this skill has to locate on disk.
- Never write inside the project repo — this is a disposable view, not a durable artifact. The durable record is the GitHub issue.
- Never open the file without asking first.
