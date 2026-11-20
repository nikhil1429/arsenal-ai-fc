// unit mfix — THE READ-SET PROBE (a preload: NODE_OPTIONS="--import file:///…/readprobe.mjs").
// It records WHICH KEYS of each state file a member dereferences, never a value: every JSON.parse whose text came
// from a read under $READPROBE_STATE returns a deep Proxy that journals the folded key path of each get, with the leaf's
// typeof. Keys that look like ids / dates / free text fold to "*", array indices fold to "[]" — so the journal is the
// SHAPE a synthetic fixture needs, and no byte of the file. Children inherit NODE_OPTIONS, so a member's own spawns are
// journalled too. Output: one JSON row per process to $READPROBE_OUT {pid, argv1, files:{name:{read:n, paths:[…]}}}.
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { basename, resolve, sep } from "node:path";

const STATE = process.env.READPROBE_STATE ? resolve(process.env.READPROBE_STATE) + sep : null;
const OUT = process.env.READPROBE_OUT;
if (STATE && OUT) {
  const texts = new Map();                     // text (or one jsonl line) → file basename
  const seen = new Map();                      // basename → { read, paths:Set }
  const note = (f) => { if (!seen.has(f)) seen.set(f, { read: 0, paths: new Set() }); return seen.get(f); };
  const isState = (p) => { try { const a = resolve(String(p)); return a.startsWith(STATE) && /\.jsonl?$/.test(a); } catch { return false; } };
  const remember = (p, out) => {
    const f = basename(String(p)); note(f).read++;
    const s = typeof out === "string" ? out : Buffer.isBuffer(out) ? out.toString("utf8") : null;
    if (s == null) return;
    if (texts.size < 200000) { texts.set(s, f); texts.set(s.trim(), f); for (const l of s.split(/\r?\n/)) if (l.trim()) texts.set(l, f), texts.set(l.trim(), f); }
  };
  const fold = (k) => (/^\d+$/.test(k) ? "[]" : /^[A-Za-z_][A-Za-z0-9_]{0,40}$/.test(k) && !/\d{3,}/.test(k) ? k : "*");
  const wrap = (v, f, path) => {
    if (v === null || typeof v !== "object") return v;
    return new Proxy(v, {
      get(t, k, r) {
        const out = Reflect.get(t, k, r);
        if (typeof k !== "string" || (Array.isArray(t) && (k === "length" || typeof Array.prototype[k] === "function"))) return out;
        if (!Object.prototype.hasOwnProperty.call(t, k)) return out;
        const p = path + (Array.isArray(t) ? "[]" : "." + fold(k));
        note(f).paths.add(p + ":" + (out === null ? "null" : Array.isArray(out) ? "array" : typeof out));
        return wrap(out, f, p);
      },
    });
  };
  const rfs = fs.readFileSync;
  fs.readFileSync = function (p, ...a) { const out = rfs.call(this, p, ...a); if (isState(p)) remember(p, out); return out; };
  const rp = fs.promises.readFile;
  fs.promises.readFile = async function (p, ...a) { const out = await rp.call(this, p, ...a); if (isState(p)) remember(p, out); return out; };
  syncBuiltinESMExports();
  const parse = JSON.parse;
  JSON.parse = function (text, rev) {
    const v = parse.call(this, text, rev);
    const f = typeof text === "string" ? texts.get(text) : null;
    return f ? wrap(v, f, "$") : v;
  };
  process.on("exit", () => {
    if (!seen.size) return;
    const files = {}; for (const [f, s] of seen) files[f] = { read: s.read, paths: [...s.paths].sort() };
    try { fs.appendFileSync(OUT, JSON.stringify({ pid: process.pid, argv1: basename(process.argv[1] || ""), files }) + "\n"); } catch {}
  });
}
