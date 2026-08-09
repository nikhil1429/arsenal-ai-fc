#!/usr/bin/env node
// ============================================================================
// setup/build_forge_html.mjs — regenerates THE-FORGE.html (repo root)
// ----------------------------------------------------------------------------
// E6 (9 Aug 2026, launch worklist, HIS WORD: "as of now forge.html mein hi rakho").
// FORGE_SPEC §1 locates the engine at THE-FORGE.html; the 22-Jun shipped copy
// lived OUTSIDE git ("laptop + git, NEVER project files") and was lost — the
// exact out-of-git rot CLAUDE.md's THE_GAFFER.md scar documents. The engine now
// lives IN the repo, and this generator rebuilds it in one command:
//     node setup/build_forge_html.mjs
// Shape = FORGE_SPEC §1 *intended*: live gist fetch per capsule + baked SNAP
// fallback (never-empty). Completeness = FORGE_DESIGN §4 non-negotiable #4:
// EVERY data field renders (explicit sections for the known teaching fields, a
// generic walker for anything new, and a per-capsule verification footer that
// counts rendered vs present — the v2 deep-render scar, structurally closed).
// DATA is read from dressing-room/state/capsules/ (mirror.mjs's read-only copy
// of the gist) and embedded VERBATIM — capsule prose is sacred, never reworded.
// ============================================================================
import { readFileSync, writeFileSync, readdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CAPS_DIR = join(ROOT, "dressing-room", "state", "capsules");
const OUT = join(ROOT, "THE-FORGE.html");
const GIST_RAW = "https://gist.githubusercontent.com/nikhil1429/ce50c28d585c2fcd915a9dbf61871a56/raw";

const snap = readdirSync(CAPS_DIR).filter(f => f.endsWith(".json")).sort()
  .map(f => JSON.parse(readFileSync(join(CAPS_DIR, f), "utf8")));

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>THE FORGE — Arsenal AI FC</title>
<style>
  :root{--bg:#0d1117;--panel:#161b22;--edge:#30363d;--ink:#e6edf3;--dim:#8b949e;
    --red:#EF0107;--gold:#9C824A;--green:#3fb950;--amber:#d29922;--blue:#58a6ff;}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink);font:15px/1.6 "Segoe UI",system-ui,sans-serif;display:flex;min-height:100vh}
  aside{width:230px;min-width:230px;background:var(--panel);border-right:1px solid var(--edge);padding:16px;position:sticky;top:0;height:100vh;overflow-y:auto}
  aside h1{font-size:17px;color:var(--red);letter-spacing:.06em;margin-bottom:2px}
  aside .sub{font-size:11px;color:var(--dim);margin-bottom:14px}
  aside button{display:block;width:100%;text-align:left;background:none;border:1px solid transparent;color:var(--ink);
    padding:8px 10px;border-radius:6px;cursor:pointer;font:inherit;font-size:14px;margin-bottom:4px}
  aside button:hover{background:#1f2630}
  aside button.on{background:#1f2630;border-color:var(--gold)}
  aside .st{font-size:10px;color:var(--dim)}
  #src{font-size:10px;color:var(--dim);margin-top:14px;border-top:1px solid var(--edge);padding-top:8px}
  main{flex:1;padding:26px 34px;max-width:980px}
  h2{font-size:24px;margin-bottom:2px} .meta{color:var(--dim);font-size:12px;margin-bottom:18px}
  section{background:var(--panel);border:1px solid var(--edge);border-radius:8px;padding:14px 18px;margin-bottom:14px}
  section>h3{font-size:12px;letter-spacing:.12em;color:var(--gold);text-transform:uppercase;margin-bottom:8px}
  .axis{border:1px solid var(--edge);border-left:3px solid var(--dim);border-radius:6px;padding:10px 14px;margin-bottom:10px}
  .axis.held{border-left-color:var(--green)} .axis.cracked{border-left-color:var(--red)} .axis.deferred{border-left-color:var(--amber)}
  .axis h4{font-size:14px} .axis .strike{color:var(--blue);margin:4px 0;font-style:italic}
  .axis .weld{margin:4px 0} .axis .stat{font-size:11px;color:var(--dim)}
  details{margin-top:6px} summary{cursor:pointer;color:var(--gold);font-size:12px}
  pre{white-space:pre-wrap;font:13px/1.5 Consolas,monospace;background:#0d1117;border:1px solid var(--edge);border-radius:6px;padding:10px;margin-top:6px}
  ul{padding-left:20px} li{margin-bottom:4px}
  .kv{color:var(--dim);font-size:12px}
  .foot{font-size:11px;color:var(--dim);border-top:1px solid var(--edge);padding-top:8px;margin-top:6px}
  .ok{color:var(--green)} .warn{color:var(--amber)}
  .pill{display:inline-block;border:1px solid var(--edge);border-radius:10px;padding:0 8px;font-size:11px;color:var(--dim);margin-left:6px}
</style></head><body>
<aside>
  <h1>⚪🔴 THE FORGE</h1>
  <div class="sub">capsule engine · Arsenal AI FC</div>
  <nav id="nav"></nav>
  <div id="src">source: <span id="srcmode">baked SNAP</span></div>
</aside>
<main id="main"></main>
<script>
// DATA layer — baked at build time from dressing-room/state/capsules/ (verbatim).
const SNAP = ${JSON.stringify(snap)};
const GIST = ${JSON.stringify(GIST_RAW)};
let CAPS = SNAP.slice(); let current = 0;

// FORGE_DESIGN §4 completeness: fields with a designed section. Anything NOT in
// this list still renders, via the generic walker — a new field can never be
// silently skipped again (the v2 deep-render scar).
const PLACED = ["id","num","title","status","dot","lockedOn","stream","source","hook","why","mechanism",
  "bolo","bolo_by","faultLines","threeWays","traps","bridges","interviewLines","doubts","calibration",
  "buildHook","viz","deep","reJirahDone"];

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pretty = v => typeof v === "string" ? esc(v) : esc(JSON.stringify(v, null, 2));
const sec = (t, body) => body ? \`<section><h3>\${esc(t)}</h3>\${body}</section>\` : "";
const prose = v => v == null ? "" : \`<pre>\${pretty(v)}</pre>\`;

function render(i){
  current = i; const c = CAPS[i];
  document.querySelectorAll("#nav button").forEach((b, j) => b.classList.toggle("on", j === i));
  const fl = (c.faultLines || []).map(a => \`
    <div class="axis \${esc(a.status || "")}">
      <h4>\${esc(a.axis)} — \${esc(a.title)} <span class="pill">\${esc(a.status || "?")}</span></h4>
      <div class="strike">\${esc(a.strike || "")}</div>
      <div class="weld">\${esc(a.weld || "")}</div>
      \${a.deep ? \`<details><summary>deep — poora khol</summary><pre>\${pretty(a.deep)}</pre></details>\` : ""}
      \${Object.keys(a).filter(k => !["axis","title","strike","weld","status","deep"].includes(k)).map(k => \`<div class="kv">\${esc(k)}: \${pretty(a[k])}</div>\`).join("")}
    </div>\`).join("");
  const doubts = (c.doubts || []).map(d => \`<li><pre style="margin:0">\${pretty(d)}</pre></li>\`).join("");
  const extra = Object.keys(c).filter(k => !PLACED.includes(k));
  const el = document.getElementById("main");
  el.innerHTML = \`
    <h2>\${esc(c.num || "")} · \${esc(c.title || c.id)} \${c.dot ? \`<span class="pill">\${esc(c.dot)}</span>\` : ""}</h2>
    <div class="meta">id \${esc(c.id)} · status \${esc(c.status || "?")} · locked \${esc(c.lockedOn || "—")} · stream \${esc(c.stream || "—")} · source \${esc(c.source || "—")}</div>
    \${sec("Hook", prose(c.hook))}
    \${sec("Why", prose(c.why))}
    \${sec("Mechanism", prose(c.mechanism))}
    \${sec("Bolo — the sacred out-loud answer" + (c.bolo_by ? " · by " + esc(c.bolo_by) : ""), prose(c.bolo))}
    \${sec("The 9 fault lines (Re-Jirah axes)", fl)}
    \${sec("Three ways", prose(c.threeWays))}
    \${sec("Traps", prose(c.traps))}
    \${sec("Bridges", prose(c.bridges))}
    \${sec("Interview lines", prose(c.interviewLines))}
    \${sec("Doubts — his real ones, verbatim (" + (c.doubts || []).length + ")", doubts ? \`<ul>\${doubts}</ul>\` : "")}
    \${sec("Calibration", prose(c.calibration))}
    \${sec("Build hook", prose(c.buildHook))}
    \${sec("Viz", prose(c.viz))}
    \${sec("Deep — the god-tier re-learn layer", prose(c.deep))}
    \${sec("Re-Jirah rounds done (due-dates served)", (c.reJirahDone || []).length ? \`<ul>\${c.reJirahDone.map(d => \`<li>\${esc(d)}</li>\`).join("")}</ul>\` : "<div class='kv'>none yet — R1 abhi baaki</div>")}
    \${extra.length ? sec("⚠ Fields with no designed section yet (rendered raw — never skipped)", extra.map(k => \`<div><b>\${esc(k)}</b>\${prose(c[k])}</div>\`).join("")) : ""}
    <div class="foot">completeness: <span class="\${extra.length ? "warn" : "ok"}">\${Object.keys(c).length} data fields · \${Object.keys(c).length - extra.length} designed + \${extra.length} raw — 0 skipped</span></div>\`;
  window.scrollTo(0, 0);
}

function nav(){
  document.getElementById("nav").innerHTML = CAPS.map((c, i) =>
    \`<button onclick="render(\${i})">\${esc(c.num || "")} \${esc(c.title || c.id)}<br><span class="st">\${esc(c.status || "?")} · \${(c.faultLines || []).length} axes · \${(c.doubts || []).length} doubts</span></button>\`).join("");
}

// live gist first (FORGE_SPEC §1 intended), SNAP is the never-empty floor.
(async () => {
  nav(); render(0);
  try {
    const fresh = await Promise.all(SNAP.map(c =>
      fetch(\`\${GIST}/\${c.id}.json\`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null)));
    if (fresh.every(Boolean)) { CAPS = fresh; document.getElementById("srcmode").textContent = "LIVE gist"; nav(); render(current); }
  } catch {}
})();
</script></body></html>
`;

const tmp = `${OUT}.tmp${process.pid}`;
writeFileSync(tmp, html);
renameSync(tmp, OUT);
console.log(`THE-FORGE.html rebuilt — ${snap.length} capsules baked (${(html.length / 1024).toFixed(0)} KB) → ${OUT}`);
