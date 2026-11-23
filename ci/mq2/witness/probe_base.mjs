#!/usr/bin/env node
// ci/mq2/witness/probe_base.mjs — unit mq2 SPEC probe (a measurement, not a build).
// Plants a SYNTHETIC thalamus_config.json under os.tmpdir() (never his file), drives the two CLI writers
// a plant can reach, and reads the code graph of the repo it is pointed at. No port, no service, no
// daemon, no model call, no wait. Prints one line per probe; the last line is the verdict.
//   node ci/mq2/witness/probe_base.mjs --repo <repo root>
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ai = process.argv.indexOf("--repo");
const repo = ai > 0 ? process.argv[ai + 1] : process.cwd();
const out = [];
const rt = (t) => { const o = JSON.parse(t); return JSON.stringify(o, null, 1) === t ? "indent1" : JSON.stringify(o, null, 2) === t ? "indent2" : "other"; };

// P1 · gate_tune apply on an indent-1 file, then the 818 setter on the SAME file
const d = mkdtempSync(join(tmpdir(), "mq2-p1-"));
try {
  const cfgPath = join(d, "thalamus_config.json");
  writeFileSync(cfgPath, JSON.stringify({ tiers: { tau0: 0.25, tau1_base: 0.4, epsilon: 0.1, budget_k: 0.35 }, adjudicator: { role: "thalamus_adjudicator", enabled: false }, deep: { est_tokens_per_wake: 1 } }, null, 1));
  mkdirSync(join(d, "brain_out", "nightshift"), { recursive: true });
  const pf = join(d, "brain_out", "nightshift", "wind_tunnel_plant.json");
  writeFileSync(pf, JSON.stringify({ id: "wt-plant", target: "thalamus_config.json → tiers", diff: { old: { tau1_base: 0.4 }, new: { tau1_base: 0.36 } }, evidence: ["plant"], predicted_effect: "plant", metric: { name: "wakes_per_day_band", min_events: 200, window_days: 14, band: [1, 8] }, review_after_days: 14, revert_diff: { new: { tau1_base: 0.4 } } }));
  const g = spawnSync(process.execPath, [join(repo, "scripts/gate_tune.mjs"), "apply", pf], { env: { ...process.env, ARSENAL_GATETUNE_STATE_DIR: d }, encoding: "utf8" });
  const fmt = rt(readFileSync(cfgPath, "utf8"));
  const s = spawnSync(process.execPath, [join(repo, "scripts/thalamus.mjs"), "config", "adjudicator-role", "thalamus_adjudicator", "--why", "plant", "--config", cfgPath], { encoding: "utf8" });
  out.push(`P1 gate_tune apply exit ${g.status} · file after apply ${fmt} · 818 setter exit ${s.status}`);
  out.push(`P1 ${fmt === "indent1" && s.status === 0 ? "GREEN" : "RED"} — the setter must still work after an apply`);
} finally { rmSync(d, { recursive: true, force: true }); }

// P2 · the code graph: writers of the file, Q2/Q5, and the declared sole writers naming it
const x = await import(pathToFileURL(join(repo, "scripts/xray.mjs")).href);
const ir = x.build(); const q = x.queries(ir);
const f = ir.files.find((r) => r.path === "dressing-room/state/thalamus_config.json") || { readers: [], writers: [] };
const q2 = q.Q2.filter((r) => r.path === f.path).length;
const decl = ir.declared_sole_writers.filter((r) => r.file === "thalamus_config.json").map((r) => r.organ);
out.push(`P2 writers ${f.writers.join(",") || "none"} · readers ${f.readers.join(",") || "none"} · Q2 rows for it ${q2} · Q5 ${q.Q5.length} · declared sole ${decl.join(",") || "none"} · allowlisted ${x.MULTI_WRITER_ALLOWLIST.includes(f.path)}`);
out.push(`P2 ${q2 === 0 && q.Q5.length === 0 && !x.MULTI_WRITER_ALLOWLIST.includes(f.path) && decl.length === 1 ? "GREEN" : "RED"} — one declared writer, no Q2 row, no allowlist entry`);

// P3 · watchman's refit writer (watchman.mjs probeWakeEconomy) — is it in the graph, and can a plant reach it?
const w = ir.organs["watchman.mjs"];
const wSees = [...(w.reads || []), ...(w.writes || [])].some((r) => /thalamus_config/.test(r.path));
const wSrc = readFileSync(join(repo, "scripts/watchman.mjs"), "utf8");
const door = /const STATE_DIR\s*=\s*process\.env\./.test(wSrc);
out.push(`P3 watchman edge in IR ${wSees} · watchman STATE_DIR env door ${door}`);
out.push(`P3 ${door ? "GREEN" : "RED"} — a plant can reach watchman's refit writer`);

const reds = out.filter((l) => / RED /.test(l)).length;
for (const l of out) console.log(l);
console.log(`mq2 probe: ${reds} RED of 3`);
