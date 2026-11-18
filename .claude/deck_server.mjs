// .claude/deck_server.mjs — serves his revision decks from C:\Users\nikhi\Downloads\AI on 127.0.0.1 only.
// WHY (his word, 15 Nov 2026): a deck opened in the Claude desktop Browser pane gets the pane's annotation tools
// (pointer · pen · box · text), which the Artifact viewer does not have; and a localhost address shows no repo name
// on his video calls. A file:// path outside the project renders as a static snapshot (no scripts), so the decks are
// served over http instead. READ-ONLY: it serves files and folder listings, and writes nothing.
// Start it through the preview tools: preview_start { name: "revision-decks" } (see .claude/launch.json).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.env.DECK_ROOT || "C:/Users/nikhi/Downloads/AI");
const PORT = Number(process.env.PORT || 4791);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".pdf": "application/pdf",
};
const HEAD = '<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function listing(dir, urlPath) {
  const base = urlPath.endsWith("/") ? urlPath : urlPath + "/";
  const items = fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() || /\.html?$/i.test(d.name))
    .sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));
  const rows = items.map((d) => {
    const href = base + encodeURIComponent(d.name) + (d.isDirectory() ? "/" : "");
    return `<li class="${d.isDirectory() ? "dir" : "file"}"><a href="${esc(href)}">${esc(d.name)}</a></li>`;
  }).join("\n");
  const up = urlPath === "/" ? "" : `<p><a href="${esc(path.posix.dirname(base.slice(0, -1)) + "/")}">← upar</a></p>`;
  return HEAD + `<title>Revision decks</title>
<style>
:root{--bg:#f4f6f8;--card:#fff;--ink:#14181d;--muted:#58626f;--line:#d9dee5;--ui:#3540c0}
@media (prefers-color-scheme: dark){:root{--bg:#0f1217;--card:#181c23;--ink:#eceef2;--muted:#9ca5b3;--line:#2a303a;--ui:#9ea8ff;color-scheme:dark}}
body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px 16px}
main{max-width:34em;margin:0 auto}
h1{font-size:20px;font-weight:500}
ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px}
li a{display:block;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;color:var(--ink);text-decoration:none}
li.dir a{border-color:var(--ui);color:var(--ui);font-weight:500}
p a{color:var(--ui)}
</style>
<main><h1>Revision decks · ${esc(decodeURIComponent(urlPath))}</h1>${up}<ul>
${rows || "<li>Abhi koi deck nahi.</li>"}
</ul></main>`;
}

http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname); }
  catch { res.writeHead(400, { "content-type": "text/plain; charset=utf-8" }); res.end("bad path"); return; }
  const full = path.resolve(ROOT, "." + rel);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" }); res.end("outside the decks folder"); return;
  }
  fs.stat(full, (err, st) => {
    if (err) { res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); res.end("not found"); return; }
    if (st.isDirectory()) {
      res.writeHead(200, { "content-type": TYPES[".html"], "cache-control": "no-store" }); res.end(listing(full, rel)); return;
    }
    const ext = path.extname(full).toLowerCase();
    const type = TYPES[ext] || "application/octet-stream";
    if (ext === ".html" || ext === ".htm") {
      fs.readFile(full, "utf8", (e2, text) => {
        if (e2) { res.writeHead(500); res.end("read failed"); return; }
        const body = /^\s*<!doctype/i.test(text) ? text : HEAD + text;
        res.writeHead(200, { "content-type": type, "cache-control": "no-store" }); res.end(body);
      });
      return;
    }
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    fs.createReadStream(full).pipe(res);
  });
}).listen(PORT, "127.0.0.1", () => console.log(`deck_server: http://127.0.0.1:${PORT}/ serving ${ROOT}`));
