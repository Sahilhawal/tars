import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getPrdDetail } from "@/lib/gh";
import { findProjectById } from "@/lib/registry";

export default async function PrdPage({
  params,
}: {
  params: Promise<{ id: string; number: string }>;
}) {
  const { id, number } = await params;
  const project = await findProjectById(id);
  if (!project) notFound();

  let prd;
  try {
    prd = await getPrdDetail(project.path, Number(number));
  } catch (err) {
    return (
      <div>
        <p className="muted">
          <Link href={`/projects/${id}`}>← {project.name}</Link>
        </p>
        <p>
          Couldn&apos;t load PRD #{number}: {String(err)}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="muted">
        <Link href={`/projects/${id}`}>← {project.name}</Link>
      </p>
      <h1>
        #{prd.number} — {prd.title}
      </h1>
      <p>
        <span className="badge">{prd.state}</span>{" "}
        <a href={prd.url} target="_blank" rel="noreferrer">
          View on GitHub ↗
        </a>
      </p>

      <div className="card">
        <ReactMarkdown>{prd.body}</ReactMarkdown>
      </div>

      <h2>Tickets</h2>
      {prd.tickets.length === 0 ? (
        <p className="muted">
          No tickets yet — run <code>/to-tickets</code> on this PRD.
        </p>
      ) : (
        <ul className="plain">
          {prd.tickets.map((t) => (
            <li key={t.number} className="card">
              <h3>
                <a href={t.url} target="_blank" rel="noreferrer">
                  #{t.number} — {t.title}
                </a>
              </h3>
              <p>
                {t.labels.map((l) => (
                  <span key={l} className="badge">
                    {l}
                  </span>
                ))}
              </p>
              {t.blockedBy && <p className="muted">Blocked by: {t.blockedBy}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
