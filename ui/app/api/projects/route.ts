import { NextResponse } from "next/server";
import { encodeProjectId, readRegistry } from "@/lib/registry";

export async function GET() {
  const projects = await readRegistry();
  return NextResponse.json(projects.map((p) => ({ id: encodeProjectId(p.path), ...p })));
}
