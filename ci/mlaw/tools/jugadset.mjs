import { tree } from "./tree.mjs"; import { rmSync } from "node:fs"; import { join } from "node:path"; import { pathToFileURL } from "node:url";
for (const sha of process.argv.slice(2)) {
  const d = tree(sha); process.chdir(d);
  const L = await import(pathToFileURL(join(d, "scripts/lawpack.mjs")).href + "?t=" + sha);
  const j = L.judgeJugad(L.scan().matches);
  console.log(JSON.stringify({ sha: sha.slice(0,7), n: j.findings.length, f: j.findings.map((x) => `${x.file}:${x.line} ${x.name}[${x.items}]`) }));
  rmSync(d, { recursive: true, force: true });
}
