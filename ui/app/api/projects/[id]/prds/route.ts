import { NextResponse } from "next/server";
import { listPrds } from "@/lib/gh";
import { findProjectById } from "@/lib/registry";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await findProjectById(id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const prds = await listPrds(project.path);
    return NextResponse.json(prds);
  } catch (err) {
    return NextResponse.json(
      { error: "failed to read PRDs — is `gh` authenticated for this repo?", detail: String(err) },
      { status: 502 },
    );
  }
}
