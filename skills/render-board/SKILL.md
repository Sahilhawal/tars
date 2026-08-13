---
name: render-board
description: Render the ticket pipeline as a single self-contained kanban HTML file — columns Ready / In Progress / In Review / Blocked / Done, grouped by PRD. Use whenever the user wants to see the whole board, "what's in flight", or check ticket status at a glance instead of listing issues one by one.
---

# Render Board

Turn the live label state of every ticket into a kanban board — no server, no build step, no external dependency at all beyond system fonts. Shares its visual system with `render-prd` — same tokens, same font stacks — so the board and the PRD doc read as one product.

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

The design is the same **spec sheet** system `render-prd` uses — same exact tokens and system font stacks (no Google Fonts, no Tailwind), espresso ground with a faint drafting grid, amber accent — extended with one more semantic token, `--review` (a blue-grey, borrowed from the same reference page's second actor color), for the In Review column that render-prd's ticket cards don't need.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Board — tars</title>
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
        --review: #7c93a8;
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
          --review: #4c6478;
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
      .page { max-width: 84rem; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
      .titleblock { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 2.5rem; }
      .kicker {
        font-family: var(--font-mono); font-size: 0.75rem;
        letter-spacing: 0.09em; text-transform: uppercase; color: var(--accent);
      }
      h1 {
        font-family: var(--font-mono); font-weight: 700; font-size: clamp(1.8rem, 4vw, 2.35rem);
        letter-spacing: -0.01em; margin: 0; text-wrap: balance;
      }
      .board { display: flex; gap: 1.25rem; align-items: flex-start; overflow-x: auto; padding-bottom: 1rem; }
      .column { flex: 0 0 270px; }
      .column-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.85rem; }
      .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--ink-dim); }
      .dot-in-progress { background: var(--accent); }
      .dot-in-review { background: var(--review); }
      .dot-blocked { background: var(--warn); }
      .dot-done { background: var(--ok); }
      .column-title {
        font-family: var(--font-mono); font-size: 0.75rem;
        letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-dim);
      }
      .column-count {
        margin-left: auto; font-family: var(--font-mono); font-size: 0.7rem;
        color: var(--ink-dim); background: var(--surface-2); border-radius: 999px;
        padding: 0.05rem 0.5rem;
      }
      .cards { display: flex; flex-direction: column; gap: 0.65rem; }
      .empty { font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-dim); }
      .card {
        background: var(--surface); border: 1px solid var(--line); border-left: 3px solid var(--line);
        border-radius: 8px; padding: 0.75rem 0.9rem;
      }
      .card.state-in-progress { border-left-color: var(--accent); }
      .card.state-in-review { border-left-color: var(--review); }
      .card.state-blocked { border-left-color: var(--warn); }
      .card.state-done { border-left-color: var(--ok); }
      .card-prd { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-dim); margin: 0 0 0.3rem; }
      .card-title {
        font-family: var(--font-serif); font-weight: 500; font-size: 0.92rem;
        color: var(--ink); text-decoration: none;
      }
      .card-title:hover { color: var(--accent); }
      .card-blocked { margin: 0.4rem 0 0; font-family: var(--font-mono); font-size: 0.72rem; color: var(--warn); }
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
            <span class="dot"></span>
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

**Card** — one per ticket, `state-{{in-progress|in-review|blocked|done}}` matching its column (Ready needs no modifier — the base neutral border already reads as untouched):

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
