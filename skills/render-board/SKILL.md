---
name: render-board
description: Render the ticket pipeline as a single self-contained kanban HTML file — columns Ready / In Progress / In Review / Blocked / Done, grouped by PRD. Use whenever the user wants to see the whole board, "what's in flight", or check ticket status at a glance instead of listing issues one by one.
---

# Render Board

Turn the live label state of every ticket into a kanban board — no server, no build step, nothing beyond the Google Fonts link the file loads at view time. Shares its visual system with `render-prd` — same tokens, same IBM Plex type family — so the board and the PRD doc read as one product.

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

The design is the same **spec sheet** system `render-prd` uses — title block, IBM Plex Serif/Sans/Mono, cool paper ground with a rust-orange accent — extended with one more semantic token, `--review`, for the In Review column that render-prd's ticket cards don't need. Copy the tokens and fonts exactly so the two pages match.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Board — tars</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --bg: #eef0f2;
        --surface: #ffffff;
        --ink: #1a2233;
        --ink-muted: #5b6472;
        --rule: #d7dbe0;
        --accent: #c2410c;
        --good: #15803d;
        --good-soft: #dcf3e3;
        --warn: #b45309;
        --warn-soft: #faecd8;
        --pending: #64748b;
        --pending-soft: #e7eaee;
        --review: #2563eb;
        --review-soft: #dbe7fc;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #12151b;
          --surface: #1b1f27;
          --ink: #e7e9ed;
          --ink-muted: #9aa3b2;
          --rule: #2a2f3a;
          --accent: #f4834e;
          --good: #4ade80;
          --good-soft: #163524;
          --warn: #fbbf24;
          --warn-soft: #3a2c0f;
          --pending: #94a3b8;
          --pending-soft: #262b35;
          --review: #60a5fa;
          --review-soft: #1e293b;
        }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: "IBM Plex Sans", system-ui, sans-serif;
        line-height: 1.6;
      }
      .page { max-width: 84rem; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
      .titleblock { margin-bottom: 2.5rem; }
      .kicker {
        font-family: "IBM Plex Mono", monospace; font-size: 0.75rem;
        letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-muted);
      }
      h1 {
        font-family: "IBM Plex Serif", serif; font-weight: 600; font-size: 2.25rem;
        line-height: 1.2; text-wrap: balance; margin: 0.75rem 0 0; padding-bottom: 1rem;
        border-bottom: 1px solid var(--rule);
      }
      .board { display: flex; gap: 1.25rem; align-items: flex-start; overflow-x: auto; padding-bottom: 1rem; }
      .column { flex: 0 0 270px; }
      .column-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.85rem; }
      .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
      .dot-ready { background: var(--pending); }
      .dot-in-progress { background: var(--accent); }
      .dot-in-review { background: var(--review); }
      .dot-blocked { background: var(--warn); }
      .dot-done { background: var(--good); }
      .column-title {
        font-family: "IBM Plex Mono", monospace; font-size: 0.75rem;
        letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-muted);
      }
      .column-count {
        margin-left: auto; font-family: "IBM Plex Mono", monospace; font-size: 0.7rem;
        color: var(--ink-muted); background: var(--pending-soft); border-radius: 999px;
        padding: 0.05rem 0.5rem;
      }
      .cards { display: flex; flex-direction: column; gap: 0.65rem; }
      .empty { font-family: "IBM Plex Mono", monospace; font-size: 0.8rem; color: var(--ink-muted); }
      .card {
        background: var(--surface); border: 1px solid var(--rule); border-left: 3px solid var(--pending);
        border-radius: 4px; padding: 0.75rem 0.9rem;
      }
      .card.state-in-progress { border-left-color: var(--accent); }
      .card.state-in-review { border-left-color: var(--review); }
      .card.state-blocked { border-left-color: var(--warn); }
      .card.state-done { border-left-color: var(--good); }
      .card-prd { font-family: "IBM Plex Mono", monospace; font-size: 0.7rem; color: var(--ink-muted); margin: 0 0 0.3rem; }
      .card-title {
        font-family: "IBM Plex Sans", sans-serif; font-weight: 500; font-size: 0.9rem;
        color: var(--ink); text-decoration: none;
      }
      .card-title:hover { color: var(--accent); }
      .card-blocked { margin: 0.4rem 0 0; font-family: "IBM Plex Mono", monospace; font-size: 0.72rem; color: var(--warn); }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="titleblock">
        <span class="kicker">Board</span>
        <h1><!-- Unscoped: "Board" — Scoped: "Board — PRD #{{n}} {{title}}" --></h1>
      </header>
      <div class="board">
        <!-- one column per state, in this order: Ready, In Progress, In Review, Blocked, Done -->
        <div class="column">
          <div class="column-head">
            <span class="dot dot-ready"></span>
            <span class="column-title">Ready</span>
            <span class="column-count">{{count}}</span>
          </div>
          <div class="cards">
            <!-- one card per ticket in this column, or class="empty" text if none -->
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
```

**Card** — one per ticket, `state-{{in-progress|in-review|blocked|done}}` matching its column (Ready needs no modifier — the base border color already reads as pending):

```html
<div class="card state-{{in-progress|in-review|blocked|done}}">
  <!-- Unscoped only: which PRD this ticket belongs to -->
  <p class="card-prd">PRD #{{prd-number}} · {{prd-title}}</p>
  <a href="{{ticket url}}" target="_blank" class="card-title">#{{number}} {{title}}</a>
  <!-- only if a Blocked-by line was found and references a still-open issue -->
  <p class="card-blocked">Blocked by: {{text}}</p>
</div>
```

No tickets at all (a PRD published but `/to-tickets` hasn't run, or truly nothing found) → a single `<p class="empty">` in place of the grid: `No tickets yet.`

## Report

Report the path, then ask the user whether to open it. Only on yes: `xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows.

## Hard rules

- Author the HTML directly with the Write tool — no build step, no npm, no script this skill has to locate on disk.
- Never write inside the project repo — this is a disposable view. The durable record is the GitHub issues and their labels.
- Never open the file without asking first — this pulls live data every time, unlike `render-prd`'s local-mode auto-open.
- This board is a read of GitHub's label state, not a second source of truth. If a card looks wrong, the label is wrong — fix it on the issue, not in the HTML.
