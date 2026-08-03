import Link from "next/link";
import { encodeProjectId, readRegistry } from "@/lib/registry";

export default async function ProjectsPage() {
  const projects = await readRegistry();

  return (
    <div>
      <h1>Projects</h1>
      {projects.length === 0 ? (
        <p className="muted">
          No projects registered yet. Run <code>/setup-tars</code> in a project to add it here.
        </p>
      ) : (
        <ul className="plain">
          {projects.map((p) => (
            <li key={p.path} className="card">
              <h2>
                <Link href={`/projects/${encodeProjectId(p.path)}`}>{p.name}</Link>
              </h2>
              <p className="muted">{p.path}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
