import Link from "next/link";
import { notFound } from "next/navigation";
import { listWorktrees } from "@/lib/git";
import { listPrds } from "@/lib/gh";
import { findProjectById } from "@/lib/registry";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await findProjectById(id);
  if (!project) notFound();

  const [worktrees, prds] = await Promise.allSettled([
    listWorktrees(project.path),
    listPrds(project.path),
  ]);

  return (
    <div>
      <p className="muted">
        <Link href="/">← Projects</Link>
      </p>
      <h1>{project.name}</h1>
      <p className="muted">{project.path}</p>

      <h2>Worktrees</h2>
      {worktrees.status === "rejected" ? (
        <p className="muted">Couldn&apos;t read worktrees: {String(worktrees.reason)}</p>
      ) : worktrees.value.length === 0 ? (
        <p className="muted">No worktrees.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Path</th>
              <th>Branch</th>
              <th>Ticket</th>
            </tr>
          </thead>
          <tbody>
            {worktrees.value.map((w) => (
              <tr key={w.path}>
                <td>{w.path}</td>
                <td>{w.branch ?? <span className="muted">detached</span>}</td>
                <td>{w.ticketNumber ? `#${w.ticketNumber}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>PRDs</h2>
      {prds.status === "rejected" ? (
        <p className="muted">Couldn&apos;t read PRDs — is `gh` authenticated for this repo?</p>
      ) : prds.value.length === 0 ? (
        <p className="muted">No PRDs yet.</p>
      ) : (
        <ul className="plain">
          {prds.value.map((prd) => (
            <li key={prd.number} className="card">
              <h3>
                <Link href={`/projects/${id}/prds/${prd.number}`}>
                  #{prd.number} — {prd.title}
                </Link>
              </h3>
              <span className="badge">{prd.state}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
