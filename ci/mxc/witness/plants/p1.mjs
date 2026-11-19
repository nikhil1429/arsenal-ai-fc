// unit mxc plant P1 (gap 1): an empty-string arm reaching a sink, and a join of ROOT with a RELATIVE join.
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = [join("docs", "p1_doc.md")];
export function hook(p) { const tx = p && typeof p.t === "string" ? p.t.trim() : ""; if (tx && existsSync(tx)) return readFileSync(tx, "utf8"); return null; }
export function docs() { for (const d of DOCS) { if (!existsSync(join(ROOT, d))) return false; } return true; }
