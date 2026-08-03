import { NextResponse } from "next/server";
import { getPrdDetail } from "@/lib/gh";
import { findProjectById } from "@/lib/registry";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; number: string }> },
) {
  const { id, number } = await params;
  const project = await findProjectById(id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const prd = await getPrdDetail(project.path, Number(number));
    return NextResponse.json(prd);
  } catch (err) {
    return NextResponse.json({ error: "failed to read PRD", detail: String(err) }, { status: 502 });
  }
}
