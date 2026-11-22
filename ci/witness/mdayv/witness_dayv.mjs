#!/usr/bin/env node
// ============================================================================
// ci/witness/mdayv/witness_dayv.mjs — UNIT mdayv · THE FINAL READ'S CLAUSES (spec ci/mdayv/MDAYV_SPEC.md @ 2640694 §4;
//   rulings forks rows 1195 / 1196 (2) / 1229 — where the spec and the ruling differ, THE RULING WINS)
// ----------------------------------------------------------------------------
// USAGE
//   node ci/witness/mdayv/witness_dayv.mjs plants [--org <dir>] [--at <ISO instant>]   every plant on this tree (suite member)
//   EXPORT plantsFor(org, { T, floor, only }) → { <clause id>: [{ name, ok, got }] }  (the unit witness ci/mdayv/ calls it)
// THE CLAUSES (each planted so the base, main 7bf008b, reads RED and the build GREEN)
//   V1 FINAL-AT-START   yesterday D settled (closed sitting, post_match/D.md, a provisional row with clause 3 RED written at
//                       15:48 IST of D, the note block planted at 22:00 IST of D); `day.mjs start` → exactly ONE row of D with
//                       read "final", its clause 3 GREEN; the start prints exactly ONE line ending `· read FINAL`.
//   V2 MORNING CARRIER  the org's own MORNING (imported in a child): the step right after dayclose-prev runs
//                       scripts/daily_green.mjs final, with no needs.
//   V3 READ-ONLY        V1's plant with D's sitting still OPEN; `daily_green.mjs final` alone → every planted file but the meter
//                       ledger byte-equal (the open sitting stays open), a row of D written and none of today; static: the meter
//                       body spawns nothing but git (execFileSync), no spawn/exec/fork, no claude, no fetch(.
//   V4 ONCE             after V1: `final` again, then `--date D` → nothing appended by either; `--date D` prints `read FINAL`;
//                       the final row stays D's last row.
//   V5 PROVISIONAL      a plain run on today → its row read "provisional", the line ends `· read provisional` and keeps its head.
//   V6 SKIPPED DAYS     provisional rows for D-2 and D-1, the newest final row D-3, no start between; one start → final rows
//                       appended for D-2 then D-1 (oldest first), nothing appended for D-3, and the 13 Nov day untouched
//                       (done.mjs oldDayRed, its owner's reader, byte-equal answer before/after; its rows byte-equal).
//   V7 NOT OVER         `final --through <today>` → exit 1, REFUSED, the ledger byte-equal.
//   V8 CLOUD            CLAUDE_CODE_REMOTE=1, V1's plant, `final` → the ledger byte-equal, one line naming the cloud.
//   V9 SETTLE (C4)      D unsettled (no post_match/D.md): after ONE start D's latest row reads provisional (no final row);
//                       after the SECOND start (the same instant) it reads final — planted both ways, its mutant the settle
//                       check removed (final at the first start, RED here).
//   V10 FLOOR (C5)      a provisional row for floor−1 and for the floor day; one start → the floor day final, NO row appended
//                       for floor−1; the floor is the IST day of the org's ONE recorded stamp and later than 2026-11-13.
// CONTRACT
//   · ONE INSTANT (C1, row 1229): the planter reads the clock ONCE (`--at`, or now). Its planted instant T keeps that time of
//     day and is moved forward by WHOLE days only when its IST day is earlier than floor+4 (so D-3 is never below the floor);
//     every planted day is derived from T, and every stamp from T or from D's own IST hours. T is HANDED to every child through
//     the mclk door (ci/witness/mmeter/plant_day.mjs): a Date preload in the temp root appended to the child's NODE_OPTIONS
//     as --import=<file URL> — never a fresh new Date() per plant. The planting runs of the meter at 15:48 IST get their own
//     preload of that instant, the same door.
//   · Every plant runs on a COPY of <org> under os.tmpdir() (prefix mdayv-wit-; never .git, never ci/, never his state;
//     node_modules rides as a link) with its OWN dressing-room/state, planted by this node script. Nothing of his state is
//     read but the TRACKED registry.json (re-planted with a note_blocks lane), and nothing of it is printed.
//   · THE PORT CLASS (row 1053): no fixed port is bound and no live service named: the sitting door's port is an OS-picked
//     free port with nothing on it (the daemon DOWN) handed through ARSENAL_SITTING_PORT; ARSENAL_SITTING_STATE_DIR,
//     ARSENAL_NIGHT_STATE_DIR, ARSENAL_CALL_STATE_DIR, ARSENAL_CAMPAIGN_ROOT, ARSENAL_ARCHIVE, HOME and USERPROFILE point under
//     the temp root; a fake `claude` sits first on PATH (a planted model, never a live call). Nothing POSTed, nothing restarted;
//     every child is spawnSync, so every wait ends with its child. No timeout, budget or size is typed.
//   · CRLF-proof: every line is split on \r?\n and every hash folds CRLF to LF. No git repo is planted. Windows: no POSIX shell.
//   · plants mode prints `CLAUSE <id> GREEN|RED · k/n plant(s)` per clause and ends `PLANTS mdayv · k of n plant(s) as expected`.
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, readdirSync, cpSync, symlinkSync, chmodSync } from "node:fs";
import { join, resolve, dirname, relative, sep, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const TMP_PREFIX = "mdayv-wit-";
export const CLAUSE_IDS = ["V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10"];
const OLD_DAY = "2026-11-13";
const lines = (t) => String(t || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const slash = (p) => p.split(sep).join("/");
const istDay = (ms) => new Date(ms + 330 * 60000).toISOString().slice(0, 10);
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const at = (day, hhmm) => Date.parse(`${day}T${hhmm}:00+05:30`);
const iso = (ms) => new Date(ms).toISOString();
const sha = (p) => createHash("sha256").update(readFileSync(p).toString("utf8").replace(/\r\n/g, "\n")).digest("hex");
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });

/** The floor an org's meter derives (its ONE recorded stamp), or null when the org carries none (the base). */
export function floorOf(org) {
  let src = ""; try { src = readFileSync(join(org, "scripts", "daily_green.mjs"), "utf8"); } catch { return null; }
  const m = /export const FINAL_FLOOR_STAMP = "([^"]+)"/.exec(src);
  return m && Number.isFinite(Date.parse(m[1])) ? istDay(Date.parse(m[1])) : null;
}
/** THE ONE INSTANT (C1): the planter's single read, moved forward by whole days only when its day is below floor+4. */
export function plantedInstant(read, floor) {
  let T = read;
  if (floor) while (istDay(T) < addDays(floor, 4)) T += 86400000;
  return T;
}

function copyOrg(src, dst) {
  cpSync(src, dst, { recursive: true, filter: (p) => {
    const rel = slash(relative(src, p));
    if (!rel) return true;
    const top = rel.split("/")[0];
    if (top === ".git" || top === "node_modules" || top === "ci") return false;
    return !(rel === "dressing-room/state" || rel.startsWith("dressing-room/state/")) && !/\.log$/.test(rel);
  } });
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(dst, "node_modules"), "junction");
}

/** Every plant of the org, on ONE copy, its state re-planted per plant. */
export async function plantsFor(org, { T, floor, only = null } = {}) {
  const want = (id) => !only || only.includes(id);
  const ROOT = mkdtempSync(join(tmpdir(), TMP_PREFIX));
  const P = Object.fromEntries(CLAUSE_IDS.map((id) => [id, []]));
  const plant = (id, name, ok, got) => P[id].push({ name, ok: !!ok, got: String(got == null ? "" : got).slice(0, 300) });
  try {
    const COPY = join(ROOT, "org"); copyOrg(org, COPY);
    const ST = join(COPY, "dressing-room", "state");
    const FAKE = join(ROOT, "fakebin"); mkdirSync(FAKE, { recursive: true });
    writeFileSync(join(FAKE, "claude"), "#!/bin/sh\nexit 1\n"); chmodSync(join(FAKE, "claude"), 0o755);
    writeFileSync(join(FAKE, "claude.cmd"), "@exit /b 1\r\n");
    const reg = JSON.parse(readFileSync(join(org, "dressing-room", "state", "registry.json"), "utf8"));
    (reg.tables.emit_contract = reg.tables.emit_contract || []).push({ subject: "note_blocks", writes_to: "note_blocks.jsonl" });
    const REG = JSON.stringify(reg);
    const TD = istDay(T), D = addDays(TD, -1);
    let gen = 0, HOME = "", PORT = 0;
    const door = (ms) => {   // THE mclk DOOR: a Date preload pinned at one handed instant
      const f = join(ROOT, `clock-${ms}.mjs`);
      if (!existsSync(f)) writeFileSync(f, `const R = globalThis.Date, T = ${ms};\nfunction D(...a) { if (!new.target) return new R(T).toString(); return a.length ? new R(...a) : new R(T); }\n` +
        `D.prototype = R.prototype; D.now = () => T; D.parse = R.parse; D.UTC = R.UTC;\nglobalThis.Date = D;\n`);
      return `--import=${pathToFileURL(f).href}`;
    };
    const env = (ms, extra = {}) => {
      const e = { ...process.env };
      for (const k of Object.keys(e)) if (/^ARSENAL_|^CLAUDE_CODE_/.test(k) || k === "ANTHROPIC_API_KEY" || k === "NODE_OPTIONS") delete e[k];
      const pk = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
      return { ...e, [pk]: `${FAKE}${delimiter}${e[pk] || ""}`, HOME, USERPROFILE: HOME, ARSENAL_ARCHIVE: join(ROOT, `archive-${gen}`),
        ARSENAL_SITTING_PORT: String(PORT), ARSENAL_SITTING_STATE_DIR: ST, ARSENAL_NIGHT_STATE_DIR: ST, ARSENAL_CALL_STATE_DIR: ST,
        ARSENAL_CAMPAIGN_ROOT: join(ROOT, `campaign-${gen}`), NODE_OPTIONS: door(ms), ...extra };
    };
    const node = (args, { ms = T, extra = {} } = {}) => {
      const r = spawnSync(process.execPath, [join(COPY, args[0]), ...args.slice(1)], { cwd: COPY, encoding: "utf8", windowsHide: true, env: env(ms, extra) });
      return { status: r.status, out: String(r.stdout || ""), err: String(r.stderr || "") };
    };
    const meter = (args, o) => node(["scripts/daily_green.mjs", ...args], o);
    const start = () => node(["scripts/day.mjs", "start", "--session", randomUUID(), "--by", "hand"]);
    const put = (rel, text) => { mkdirSync(dirname(join(ST, rel)), { recursive: true }); writeFileSync(join(ST, rel), text); };
    const LEDGER = join(ST, "daily_green.jsonl");
    const rows = () => { try { return lines(readFileSync(LEDGER, "utf8")).map((l) => JSON.parse(l)); } catch { return []; } };
    const ofDay = (d) => rows().filter((r) => r.date === d);
    const ledgerSha = () => (existsSync(LEDGER) ? sha(LEDGER) : "absent");
    const jl = (rs) => rs.map((r) => JSON.stringify(r)).join("\n") + "\n";
    /** a fresh state: day `d` a study day with everything but its note block, `opts` bending it */
    const fresh = async (d = D, { open = false, postMatch = true } = {}) => {
      rmSync(ST, { recursive: true, force: true }); mkdirSync(ST, { recursive: true });
      gen++; HOME = join(ROOT, `home-${gen}`); mkdirSync(HOME, { recursive: true }); mkdirSync(join(ROOT, `campaign-${gen}`), { recursive: true });
      PORT = await freePort();   // nothing listens on it: the sitting daemon is DOWN
      put("registry.json", REG);
      put("sitting.json", JSON.stringify({ id: `s-${d}`, task: "t", route: "FORGE", opened_at: iso(at(d, "09:00")), ...(open ? {} : { closed_at: iso(at(d, "22:00")) }) }));
      // a closed sitting leaves the sitting organ's close row (the start replaces sitting.json with today's)
      put("sitting_reviews.jsonl", open ? "" : jl([{ kind: "sitting_review", sitting_id: `s-${d}`, opened_at: iso(at(d, "09:00")), closed_at: iso(at(d, "22:00")), reason: "fulltime" }]));
      put("reps_log.jsonl", jl([{ ts: iso(at(d, "10:00")), concept: "planted", correct: true }]));
      put("forge_session.json", JSON.stringify({ concept: "planted", resume_pointer: { text: "q", step: 3, at: iso(at(d, "10:00")) } }));
      put("note_blocks.jsonl", ""); put("compiled_notes.jsonl", "");
      put("gaffer_grade_queue.jsonl", jl([{ v: 2, kind: "settled", of: "x", ts: iso(at(d, "11:00")), day: d }]));
      put("captains_call.json", JSON.stringify({ cards: [] }));
      if (postMatch) put(`post_match/${d}.md`, `POST-MATCH · ${d}\n\nRESULT: HIT.\n\nKAL-LINE → start with axis b\n`);
      else mkdirSync(join(ST, "post_match"), { recursive: true });
    };
    /** the provisional row of `d` at 15:48 IST of d (clause 3 RED: no block yet), then the note block at 22:00 IST of d */
    const provisional = (d) => { meter(["--date", d], { ms: at(d, "15:48") }); };
    // the note lane is whichever file the registry's note_blocks row names (the tracked one, or the planted fallback): both get the block
    const noteAt = (d) => { for (const f of ["note_blocks.jsonl", "compiled_notes.jsonl"]) put(f, readFileSync(join(ST, f), "utf8") + JSON.stringify({ ts: iso(at(d, "22:00")), day: d, axis: "a" }) + "\n"); };
    const finalLines = (out) => lines(out).filter((l) => /^DAILY GREEN \d{4}-\d{2}-\d{2} IST · .* · read FINAL$/.test(l));

    if (want("V1") || want("V4")) {
      await fresh(); provisional(D); noteAt(D);
      const before = ofDay(D);
      const s = start();
      const fin = ofDay(D).filter((r) => r.read === "final");
      if (want("V1")) {
        plant("V1", "the start after D writes exactly ONE final row of D", fin.length === 1, `${fin.length} final row(s) of ${D}; ${ofDay(D).length} row(s), ${before.length} before`);
        plant("V1", "that final row re-read clause 3 (the note block landed after the provisional read): GREEN", fin.length === 1 && fin[0].clauses[2].status === "GREEN", fin[0] ? `${fin[0].clauses[2].status} ${fin[0].clauses[2].why}` : "no final row");
        plant("V1", "the provisional row before it read clause 3 RED (the plant is real)", before.length === 1 && before[0].clauses[2].status === "RED", JSON.stringify(before.map((r) => r.clauses && r.clauses[2])));
        plant("V1", "the start prints exactly ONE line ending `· read FINAL`, of D", finalLines(s.out).length === 1 && finalLines(s.out)[0].startsWith(`DAILY GREEN ${D} IST`), lines(s.out).slice(-3).join(" | "));
      }
      if (want("V4")) {
        const n0 = rows().length, f2 = meter(["final"]), n1 = rows().length, dd = meter(["--date", D]), n2 = rows().length;
        plant("V4", "a second `final` appends nothing and confirms D (`read FINAL`)", fin.length === 1 && n1 === n0 && finalLines(f2.out).length >= 1, `${n0} → ${n1} rows · ${lines(f2.out).at(-1)}`);
        plant("V4", "`--date D` appends nothing and prints the final row's line (`read FINAL`)", fin.length === 1 && n2 === n1 && / · read FINAL$/.test(lines(dd.out).at(-1) || ""), `${n1} → ${n2} rows · ${(lines(dd.out).at(-1) || "").slice(-60)}`);
        plant("V4", "the final row stays D's last row", (ofDay(D).at(-1) || {}).read === "final", JSON.stringify((ofDay(D).at(-1) || {}).read));
      }
    }
    if (want("V2")) {
      const r = spawnSync(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(join(COPY, "scripts", "conductor.mjs")).href)}); console.log(JSON.stringify(m.MORNING.map((s) => ({ id: s.id, args: s.args || null, needs: s.needs || null }))));`],
        { cwd: COPY, encoding: "utf8", windowsHide: true, env: env(T) });
      let M = []; try { M = JSON.parse(lines(r.stdout).at(-1)); } catch { /* unread: RED below */ }
      const i = M.findIndex((s) => s.id === "dayclose-prev"), nx = M[i + 1] || {};
      plant("V2", "the MORNING step right after dayclose-prev runs scripts/daily_green.mjs final", i >= 0 && (nx.args || []).join(" ") === "scripts/daily_green.mjs final", i < 0 ? `MORNING unread (exit ${r.status})` : `next: ${nx.id} ${(nx.args || []).join(" ")}`);
      plant("V2", "…with no needs (a failed close never stops the read)", i >= 0 && (nx.args || []).join(" ") === "scripts/daily_green.mjs final" && !nx.needs, JSON.stringify(nx.needs));
    }
    if (want("V3")) {
      await fresh(D, { open: true }); provisional(D); noteAt(D);
      const walk = (dir) => { const m = new Map(); const w = (p) => { for (const e of readdirSync(p, { withFileTypes: true })) { const q = join(p, e.name); if (e.isDirectory()) w(q); else m.set(slash(relative(dir, q)), sha(q)); } }; w(dir); return m; };
      const b = walk(ST); const n0 = rows().length;
      meter(["final"]);
      const a = walk(ST);
      const moved = [...new Set([...b.keys(), ...a.keys()])].filter((k) => k !== "daily_green.jsonl" && b.get(k) !== a.get(k));
      let sit = null; try { sit = JSON.parse(readFileSync(join(ST, "sitting.json"), "utf8")); } catch { /* moved */ }
      const added = rows().slice(n0);
      plant("V3", "every planted file but the meter ledger is byte-equal (sitting.json, reviews, grade queue, post_match, cards, …)", moved.length === 0, moved.join(", ") || "none moved");
      plant("V3", "the open sitting of D stays open", !!sit && !sit.closed_at, sit ? `closed_at ${sit.closed_at || "none"}` : "unreadable");
      plant("V3", "the run wrote a row of D and none of today (a final read, never a plain one)", added.some((r) => r.date === D) && !added.some((r) => r.date === TD), added.map((r) => `${r.date}/${r.read || "-"}`).join(",") || "nothing");
      let src = ""; try { src = readFileSync(join(COPY, "scripts", "daily_green.mjs"), "utf8"); } catch { /* RED */ }
      const body = src.slice(0, src.indexOf("// ── SELFTEST")).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      plant("V3", "static: the meter body spawns nothing but git — no spawn/exec/fork call, execFileSync only as the git exec, no claude, no fetch(, no sitting door",
        !!body && !/\b(spawn|spawnSync|execSync|fork)\(/.test(body) && (body.match(/\bexec\("([^"]*)"/g) || ["x"]).every((m) => m === 'exec("git"') && (body.match(/execFileSync\b/g) || []).length === 2
          && !/claude -p|claudegen|fetch\(|closeDoor|openDoor|sitting\.mjs|["']autoclose["']/.test(body), "static scan of the meter body");
    }
    if (want("V5")) {
      await fresh(TD);
      const r = meter([]); const row = ofDay(TD).at(-1) || {};
      const l = lines(r.out).at(-1) || "";
      plant("V5", "a plain run's row carries read:\"provisional\"", row.read === "provisional", JSON.stringify(row.read));
      plant("V5", "its line ends `· read provisional` and keeps its head", / · read provisional$/.test(l) && /^DAILY GREEN \d{4}-\d{2}-\d{2} IST · \d+\/11 · /.test(l), l.slice(-60));
    }
    if (want("V6")) {
      // the spec's days, today TD: D-3 = TD-3 (its newest final row), D-2 = TD-2 and D-1 = TD-1 = D (provisional, no start on either)
      const d3 = addDays(TD, -3), d2 = addDays(TD, -2), d1 = D;
      await fresh(d2);
      put(`post_match/${d1}.md`, `POST-MATCH · ${d1}\n\nRESULT: HIT.\n\nKAL-LINE → go\n`);
      for (const d of [d3, d2, d1]) provisional(d);
      const lr = rows(); const f3 = lr.filter((r) => r.date === d3).at(-1);
      // the newest final row is D-3 (planted as the owner would have written it) and the old recorded day reads RED
      const plantRows = [{ ...lr.find((r) => r.date === d3), date: OLD_DAY, green: false }, ...lr, ...(f3 ? [{ ...f3, read: "final", final_at: iso(at(d2, "07:06")) }] : [])];
      writeFileSync(LEDGER, jl(plantRows));
      const oldRows = () => rows().filter((r) => r.date === OLD_DAY).map((r) => JSON.stringify(r)).join("\n");
      const oldRed = () => { const r = spawnSync(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(join(COPY, "scripts", "done.mjs")).href)}); console.log(JSON.stringify(m.oldDayRed(${JSON.stringify(LEDGER)})));`], { cwd: COPY, encoding: "utf8", windowsHide: true, env: env(T) }); return lines(r.stdout).at(-1) || `exit ${r.status}`; };
      const o0 = oldRows(), r0 = oldRed(), n0 = rows().length;
      start();
      const added = rows().slice(n0).filter((r) => r.read === "final").map((r) => r.date);
      plant("V6", "one start appends final rows for D-2 then D-1, oldest first", added.join(",") === [d2, d1].join(","), added.join(",") || "no final row appended");
      plant("V6", "nothing is appended for D-3 (it already has its final row)", rows().slice(n0).every((r) => r.date !== d3) && added.length > 0, rows().slice(n0).map((r) => r.date).join(","));
      plant("V6", `the old recorded day ${OLD_DAY} is untouched: its rows byte-equal, done.mjs oldDayRed byte-equal`, oldRows() === o0 && oldRed() === r0 && added.length > 0, `${r0} → ${oldRed()}`);
    }
    if (want("V7")) {
      await fresh(); provisional(D);
      const b = ledgerSha(); const r = meter(["final", "--through", TD]);
      plant("V7", "`final --through <today>` exits 1, REFUSED", r.status === 1 && /REFUSED/.test(r.out), `exit ${r.status} · ${(lines(r.out).at(-1) || "").slice(0, 80)}`);
      plant("V7", "…and the ledger is byte-equal", ledgerSha() === b, "ledger moved");
    }
    if (want("V8")) {
      await fresh(); provisional(D); noteAt(D);
      const b = ledgerSha(); const r = meter(["final"], { extra: { CLAUDE_CODE_REMOTE: "true" } });
      plant("V8", "with CLAUDE_CODE_REMOTE set, `final` leaves the ledger byte-equal", ledgerSha() === b, "ledger moved");
      plant("V8", "…and prints one line naming the cloud", lines(r.out).length === 1 && /cloud/.test(lines(r.out)[0]) && r.status === 0, `exit ${r.status} · ${lines(r.out).join(" | ").slice(0, 120)}`);
    }
    if (want("V9")) {
      await fresh(D, { postMatch: false }); provisional(D); noteAt(D);
      start();
      const one = ofDay(D).at(-1) || {}, finOne = ofDay(D).filter((r) => r.read === "final").length;
      start();
      const two = ofDay(D).at(-1) || {}, finTwo = ofDay(D).filter((r) => r.read === "final").length;
      plant("V9", "D unsettled (no post_match/D.md): after ONE start its latest row reads provisional, no final row", one.read === "provisional" && finOne === 0 && !!one.unsettled, `${one.read || "-"} · ${finOne} final · unsettled ${one.unsettled || "-"}`);
      plant("V9", "…after the SECOND start it reads final (exactly one final row)", two.read === "final" && finTwo === 1, `${two.read || "-"} · ${finTwo} final`);
    }
    if (want("V10")) {
      const F = floor || addDays(TD, -3);
      await fresh(F);
      provisional(addDays(F, -1)); provisional(F);
      for (let d = addDays(F, 1); d <= D; d = addDays(d, 1)) put(`post_match/${d}.md`, `POST-MATCH · ${d}\n\nRESULT: HIT.\n\nKAL-LINE → go\n`);
      const below = () => ofDay(addDays(F, -1)).map((r) => JSON.stringify(r)).join("\n");
      const b = below(); const n0 = rows().length;
      start();
      const added = rows().slice(n0);
      plant("V10", "one start reads the floor day final", added.some((r) => r.date === F && r.read === "final"), added.map((r) => `${r.date}/${r.read || "-"}`).slice(0, 4).join(",") || "nothing");
      plant("V10", "…and appends NO row for floor−1 (a day before the floor is never re-read)", below() === b && !added.some((r) => r.date < F) && added.length > 0, added.filter((r) => r.date < F).map((r) => r.date).join(",") || (added.length ? "none below" : "nothing appended"));
      plant("V10", `the org's floor is the IST day of its ONE recorded stamp, later than ${OLD_DAY}`, !!floorOf(COPY) && floorOf(COPY) > OLD_DAY, floorOf(COPY) || "no FINAL_FLOOR_STAMP");
    }
  } catch (e) {
    for (const id of CLAUSE_IDS) if (want(id)) plant(id, "the plant ran", false, String(e && e.stack || e).split("\n").slice(0, 2).join(" "));
  } finally { rmSync(ROOT, { recursive: true, force: true }); }
  return P;
}
export const clauseOk = (ps) => ps.length > 0 && ps.every((p) => p.ok);

export function survivors() {
  let cmds = [];
  if (process.platform === "linux") {
    for (const pid of readdirSync("/proc").filter((x) => /^\d+$/.test(x) && Number(x) !== process.pid)) {
      try { cmds.push(readFileSync(`/proc/${pid}/cmdline`, "utf8").replace(/\0/g, " ")); } catch { /* ended while read */ }
    }
  } else if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne ${process.pid} } | ForEach-Object { $_.CommandLine }`], { encoding: "utf8", windowsHide: true });
    cmds = lines(r.stdout);
  } else {
    cmds = lines(spawnSync("ps", ["-axww", "-o", "pid=,command="], { encoding: "utf8" }).stdout).filter((l) => Number(l.trim().split(/\s+/)[0]) !== process.pid);
  }
  return cmds.filter((c) => c.includes(TMP_PREFIX));
}

async function main() {
  const a = process.argv.slice(2);
  const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  if (a[0] !== "plants") { console.log("witness_dayv.mjs plants [--org <dir>] [--at <ISO>]"); return 2; }
  const org = opt("--org") ? resolve(opt("--org")) : REPO;
  const read = opt("--at") ? Date.parse(opt("--at")) : Date.now();   // THE ONE READ of the clock
  if (!Number.isFinite(read)) { console.log("witness_dayv.mjs: --at needs an ISO instant"); return 2; }
  const floor = floorOf(org), T = plantedInstant(read, floor);
  const P = await plantsFor(org, { T, floor });
  let k = 0, n = 0;
  for (const id of CLAUSE_IDS) {
    for (const p of P[id]) { n++; if (p.ok) k++; console.log(`  ${p.ok ? "ok  " : "FAIL"} ${id} · ${p.name}${p.ok ? "" : `\n         got ${p.got}`}`); }
    console.log(`CLAUSE ${id} ${clauseOk(P[id]) ? "GREEN" : "RED"} · ${P[id].filter((p) => p.ok).length}/${P[id].length} plant(s)`);
  }
  const left = survivors();
  if (left.length) console.log(`LAST RED · ${left.length} process(es) name the temp prefix`);
  console.log(`PLANTS mdayv · ${k} of ${n} plant(s) as expected`);
  return k === n && n > 0 && !left.length ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main();
