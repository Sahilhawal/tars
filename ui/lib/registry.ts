import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export interface Project {
  path: string;
  name: string;
}

const REGISTRY_PATH = join(homedir(), ".config", "tars", "projects.json");

/** Reads the project registry written by `/setup-tars`. Never throws — a missing or malformed file just yields no projects. */
export async function readRegistry(): Promise<Project[]> {
  try {
    const raw = await readFile(REGISTRY_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data.projects) ? data.projects : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("tars-ui: failed to read registry", err);
    }
    return [];
  }
}

/** URL-safe, reversible id for a project — its absolute path, base64url-encoded. */
export function encodeProjectId(path: string): string {
  return Buffer.from(path, "utf-8").toString("base64url");
}

export function decodeProjectId(id: string): string {
  return Buffer.from(id, "base64url").toString("utf-8");
}

export async function findProjectById(id: string): Promise<Project | undefined> {
  const path = decodeProjectId(id);
  const projects = await readRegistry();
  return projects.find((p) => p.path === path);
}
