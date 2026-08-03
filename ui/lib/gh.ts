import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface PrdSummary {
  number: number;
  title: string;
  url: string;
  state: string;
}

export interface TicketSummary {
  number: number;
  title: string;
  url: string;
  state: string;
  labels: string[];
  /** Raw text of the ticket's "## Blocked by" section, if present. */
  blockedBy: string | null;
}

export interface PrdDetail extends PrdSummary {
  body: string;
  tickets: TicketSummary[];
}

async function gh(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync("gh", args, {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}

function extractBlockedBy(body: string): string | null {
  const match = body.match(/##\s*Blocked by\s*\n+([\s\S]*?)(?=\n##|\n?$)/i);
  const text = match?.[1]?.trim();
  return text || null;
}

/** All PRDs for the project at `projectPath` (repo is inferred from cwd by `gh`). */
export async function listPrds(projectPath: string): Promise<PrdSummary[]> {
  const out = await gh(
    [
      "issue",
      "list",
      "--label",
      "tars:prd",
      "--state",
      "all",
      "--json",
      "number,title,url,state",
      "--limit",
      "200",
    ],
    projectPath,
  );
  return JSON.parse(out);
}

/** A PRD's body plus its nested sub-issue tickets (title, labels, blocked-by — no comment trail). */
export async function getPrdDetail(projectPath: string, number: number): Promise<PrdDetail> {
  const issue = JSON.parse(
    await gh(["issue", "view", String(number), "--json", "number,title,url,state,body"], projectPath),
  );

  const { nameWithOwner } = JSON.parse(
    await gh(["repo", "view", "--json", "nameWithOwner"], projectPath),
  );

  let ticketNumbers: number[] = [];
  try {
    ticketNumbers = JSON.parse(
      (await gh(
        ["api", `repos/${nameWithOwner}/issues/${number}/sub_issues`, "--jq", "[.[].number]"],
        projectPath,
      )) || "[]",
    );
  } catch {
    // Older GitHub Enterprise without the sub-issues API — treat as no tickets found.
    ticketNumbers = [];
  }

  const tickets: TicketSummary[] = [];
  for (const n of ticketNumbers) {
    try {
      const t = JSON.parse(
        await gh(["issue", "view", String(n), "--json", "number,title,url,state,labels,body"], projectPath),
      );
      tickets.push({
        number: t.number,
        title: t.title,
        url: t.url,
        state: t.state,
        labels: (t.labels ?? []).map((l: { name: string }) => l.name),
        blockedBy: extractBlockedBy(t.body ?? ""),
      });
    } catch {
      // Sub-issue reference is stale (deleted issue) — skip it rather than fail the whole PRD.
    }
  }

  return {
    number: issue.number,
    title: issue.title,
    url: issue.url,
    state: issue.state,
    body: issue.body ?? "",
    tickets,
  };
}
