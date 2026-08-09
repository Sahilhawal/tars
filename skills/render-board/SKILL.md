---
name: render-board
description: Render the ticket pipeline as a single self-contained kanban HTML file — columns Ready / In Progress / In Review / Blocked / Done, grouped by PRD. Use whenever the user wants to see the whole board, "what's in flight", or check ticket status at a glance instead of listing issues one by one.
---

# Render Board

Turn the live label state of every ticket into a kanban board — no server, no build step, nothing beyond what the CDN script the file loads at view time.

**Argument:** an optional PRD issue number. `/render-board` boards every open PRD's tickets; `/render-board 12` scopes to one PRD.

Run only when the user asks for it — nothing else calls this on its own.

## Gather the data

1. Owner/repo: `gh repo view --json nameWithOwner -q .nameWithOwner`
2. **PRDs:**
   - Scoped (`/render-board 12`): `gh issue view 12 --json number,title,url`
   - Unscoped: `gh issue list --label tars:prd --state open --json number,title,url`
3. **Tickets per PRD:** `gh api repos/<owner>/<repo>/issues/<prd-n>/sub_issues --jq '[.[].number]'` — empty or erroring means no tickets yet; skip that PRD's column contribution, don't fail the render.
4. **Per ticket:** `gh issue view <ticket-n> --json number,title,url,state,labels,body`. Parse the body's `## Blocked by` section (everything until the next `##` heading or end of body) — trim it, empty means none.

## Bucket into columns

One column per pipeline state, most-authoritative-wins when a ticket somehow carries more than one state label:

1. **Closed** (any state) → **Done**
2. `tars:blocked` → **Blocked**
3. `tars:in-review` → **In Review**
4. `tars:in-progress` → **In Progress**
5. Everything else (`tars:ready`, or no pipeline label yet) → **Ready**

A ticket in **Ready** whose `## Blocked by` section names a still-open issue is logically blocked even though `/to-tickets` labels every new ticket `tars:ready` on creation — flag it on the card (see below) rather than inventing a sixth column.

## Write the HTML

Write to `<tmpdir>/tars-board.html` (scoped: `<tmpdir>/tars-board-<n>.html`), where `<tmpdir>` is `$TMPDIR` (falling back to `/tmp`, or `%TEMP%` on Windows) — never inside the project repo. Always this exact filename for a given scope, so re-rendering overwrites the same file instead of leaving stale copies behind.

HTML-escape every title (`&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;`) — issue titles are untrusted text.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Board — tars</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-7xl mx-auto px-6 py-12">
      <h1 class="text-2xl font-serif mb-8">
        <!-- Unscoped: "Board" — Scoped: "Board — PRD #{{n}} {{title}}" -->
      </h1>
      <div class="grid grid-cols-5 gap-4 items-start">
        <!-- one column per state, in this order: Ready, In Progress, In Review, Blocked, Done -->
        <div>
          <h2 class="text-xs uppercase tracking-wider text-slate-500 mb-3">Ready <span class="text-slate-400">{{count}}</span></h2>
          <div class="space-y-3">
            <!-- one card per ticket in this column, or nothing if empty -->
          </div>
        </div>
      </div>
    </main>
  </body>
</html>
```

**Card** — one `<div class="border border-slate-200 rounded-lg bg-white p-3">` per ticket:

```html
<div class="border border-slate-200 rounded-lg bg-white p-3">
  <!-- Unscoped only: which PRD this ticket belongs to -->
  <p class="text-xs text-slate-400">PRD #{{prd-number}} · {{prd-title}}</p>
  <a href="{{ticket url}}" target="_blank" class="text-sm font-medium">#{{number}} {{title}}</a>
  <!-- only if a Blocked-by line was found and references a still-open issue -->
  <p class="text-xs text-amber-600 mt-1">Blocked by: {{text}}</p>
</div>
```

No tickets at all (a PRD published but `/to-tickets` hasn't run, or truly nothing found) → a single muted line in place of the grid: `No tickets yet.`

## Report

Report the path, then ask the user whether to open it. Only on yes: `xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows.

## Hard rules

- Author the HTML directly with the Write tool — no build step, no npm, no script this skill has to locate on disk.
- Never write inside the project repo — this is a disposable view. The durable record is the GitHub issues and their labels.
- Never open the file without asking first — this pulls live data every time, unlike `render-prd`'s local-mode auto-open.
- This board is a read of GitHub's label state, not a second source of truth. If a card looks wrong, the label is wrong — fix it on the issue, not in the HTML.
