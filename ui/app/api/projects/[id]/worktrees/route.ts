import { NextResponse } from "next/server";
import { listWorktrees } from "@/lib/git";
import { findProjectById } from "@/lib/registry";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await findProjectById(id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const worktrees = await listWorktrees(project.path);
    return NextResponse.json(worktrees);
  } catch (err) {
    return NextResponse.json({ error: "failed to read worktrees", detail: String(err) }, { status: 502 });
  }
}
