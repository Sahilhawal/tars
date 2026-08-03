import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface Worktree {
  path: string;
  branch: string | null;
  /** Parsed from the `task/<N>-<slug>` branch naming convention, if it matches. */
  ticketNumber: number | null;
}

const TICKET_BRANCH_RE = /^task\/(\d+)-/;

/** Static facts only — no attempt to infer whether a worktree is "active". */
export async function listWorktrees(projectPath: string): Promise<Worktree[]> {
  const { stdout } = await execFileAsync("git", ["worktree", "list", "--porcelain"], {
    cwd: projectPath,
  });

  return stdout
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const path =
        lines.find((l) => l.startsWith("worktree "))?.slice("worktree ".length) ?? "";
      const branchLine = lines.find((l) => l.startsWith("branch "));
      const branch = branchLine
        ? branchLine.slice("branch ".length).replace(/^refs\/heads\//, "")
        : null;
      const match = branch ? branch.match(TICKET_BRANCH_RE) : null;
      return {
        path,
        branch,
        ticketNumber: match ? Number(match[1]) : null,
      };
    })
    .filter((wt) => wt.path);
}
