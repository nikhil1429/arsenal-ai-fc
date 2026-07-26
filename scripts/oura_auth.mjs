// ============================================================================
// oura_auth.mjs  ·  one-time Oura OAuth2 helper (Authorization-Code flow)
// ----------------------------------------------------------------------------
// PATs were deprecated Dec 2025 -> OAuth2 required. Run ONCE:
//     node oura_auth.mjs
// It will: ask for your Client ID + Secret (from your Oura app), open your
// browser to the Oura consent screen, catch the localhost:8080 redirect,
// exchange the code for tokens, and save:
//     oura_secrets.json   (client_id + client_secret — gitignored)
//     oura_tokens.json    (access + refresh + expires_at — gitignored)
// The coach then refreshes automatically and PERSISTS the rotated refresh_token
// (Oura rotates it on every refresh — must be saved or the chain breaks).
// ============================================================================
import http from "node:http";
import { createInterface } from "node:readline";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SECRETS = join(__dirname, "oura_secrets.json");
const TOKENS  = join(__dirname, "oura_tokens.json");
const REDIRECT = "http://localhost:8080/callback";
// [E2E audit 25 Jul 2026 — finding 3e0e9ffd] loopback ONLY. The old bare
// listen(8080) bound 0.0.0.0, publishing the callback (and the auth code riding
// on it) to the whole LAN for the length of the consent window. Both families
// are bound because "localhost" resolves to ::1 first on Windows 11.
const LOOPBACK_HOSTS = ["127.0.0.1", "::1"];
const AUTH_URL  = "https://cloud.ouraring.com/oauth/authorize";
const TOKEN_URL = "https://api.ouraring.com/oauth/token";
const SCOPES = "email personal daily heartrate workout tag session spo2";

const ask = (q) => new Promise((res) => { const rl = createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, (a) => { rl.close(); res(a.trim()); }); });

async function main() {
  console.log("\n=== Oura OAuth2 setup (one-time) ===\n");
  let s;
  if (existsSync(SECRETS)) { s = JSON.parse(readFileSync(SECRETS, "utf8")); console.log("Using saved client_id from oura_secrets.json.\n"); }
  else {
    const client_id = await ask("Paste your Oura Client ID: ");
    const client_secret = await ask("Paste your Oura Client Secret: ");
    s = { client_id, client_secret };
    writeFileSync(SECRETS, JSON.stringify(s, null, 2));
    console.log("\nSaved oura_secrets.json (this file is gitignored).\n");
  }

  const state = Math.random().toString(36).slice(2);
  const authUrl = `${AUTH_URL}?response_type=code&client_id=${encodeURIComponent(s.client_id)}`
    + `&redirect_uri=${encodeURIComponent(REDIRECT)}&scope=${encodeURIComponent(SCOPES)}&state=${state}`;

  const servers = [];
  let closed = false;
  const closeAll = () => { if (closed) return; closed = true; for (const sv of servers) { try { sv.close(); } catch { /* already down */ } } };
  const handler = makeCallbackHandler({ state, secrets: s, closeServer: closeAll });

  // [E2E audit 25 Jul 2026 — finding 3e0e9ffd, part 2] `server.listen(8080)` with
  // no host binds 0.0.0.0 — for the whole consent window the callback endpoint
  // (and the authorization code that lands on it) was reachable from every other
  // device on the LAN. Loopback-only is the fix. But the registered redirect_uri
  // is http://localhost:8080/callback and on Windows 11 "localhost" resolves to
  // ::1 first, so binding ONLY 127.0.0.1 would gamble this one-time auth on the
  // browser retrying the other family. So: bind BOTH loopback addresses with the
  // same handler — zero LAN exposure, no IPv6 gamble. Whichever family the
  // browser picks catches the redirect; losing the second one is a warning, and
  // only "neither listened" is fatal.
  let listening = 0, pending = LOOPBACK_HOSTS.length;
  for (const host of LOOPBACK_HOSTS) {
    const sv = http.createServer(handler);
    servers.push(sv);
    // was: no 'error' handler at all, so a leftover listener from a first attempt
    // crashed the script with a raw EADDRINUSE stack and no idea what to do.
    sv.on("error", (err) => {
      pending--;
      if (err && err.code === "EADDRINUSE") console.error(`⚠️  port 8080 is already in use on ${host} — another oura_auth.mjs (or some other app) still holds it.`);
      else console.error(`⚠️  callback listener on ${host} failed: ${err && err.message}`);
      if (pending === 0 && listening === 0) {
        console.error("\n❌ No loopback listener could start, so the Oura redirect has nowhere to land.");
        console.error("   Find the holder:  netstat -ano | findstr :8080     then kill it and re-run.\n");
        process.exit(1);
      }
    });
    sv.listen(8080, host, () => {
      pending--;
      if (++listening > 1) return;   // banner prints once, on the first family up
      console.log("\n" + "=".repeat(70));
      console.log(">>> STEP 1: In your browser, LOG IN to  cloud.ouraring.com");
      console.log(">>>         as the Google account that owns your ring.");
      console.log(">>> STEP 2: Paste this URL into THAT SAME browser and press Enter:");
      console.log("=".repeat(70) + "\n");
      console.log(authUrl + "\n");
      console.log("(Then click Allow. Do NOT rely on any auto-opened tab — on Windows the");
      console.log(" auto-open can mangle the URL. Manual paste into the logged-in browser is the fix.)\n");
      // Only auto-open on non-Windows (Windows `start` breaks on the URL's & chars).
      if (process.platform !== "win32") {
        const cmd = process.platform === "darwin" ? "open" : "xdg-open";
        try { spawn(cmd, [authUrl], { detached: true, stdio: "ignore" }).unref(); } catch { /* manual */ }
      }
    });
  }
}

// ----------------------------------------------------------------------------
// [E2E audit 25 Jul 2026 — finding a9528982] The verify step exists precisely to
// catch wrong-account consent (see its own comment below: an anonymous /
// wrong-account token 200s on personal_info but not on data). The success branch
// was a bare `if (v.ok)`, so a 200 carrying `data: []` — exactly what an Oura
// account with no ring returns — printed "VERIFIED — pulled 0 days ... Token is
// good." and sent the captain on to oura_coach.mjs, which then dies on zero
// nights with no clue why. A 200 with zero days proves nothing; it IS the
// wrong-account symptom. Pure function so the three-way verdict is selftestable
// with no network and without touching oura_tokens.json.
// ----------------------------------------------------------------------------
export function verifyVerdict({ ok, status, dayCount }) {
  const FIX = "   FIX: open cloud.ouraring.com, LOG IN as the Google account that owns your ring,\n        then delete oura_tokens.json + oura_secrets.json and run this again, pasting the URL into THAT browser.";
  if (!ok) return { verified: false, msg: `❌ Token saved but your Oura DATA is NOT accessible: HTTP ${status}.\n   This means consent was granted WITHOUT being logged into your ring's Oura account.\n${FIX}` };
  if (!dayCount) return { verified: false, msg: `⚠️  Token saved, but your Oura account returned ZERO days of readiness.\n   Almost always this means consent was granted on an Oura account that does NOT own your ring\n   (a second Google login) — that account exists, so the call 200s, but it has no ring data.\n   (The benign alternative: the ring genuinely hasn't synced in 7 days.)\n${FIX}` };
  return { verified: true, msg: `✅ VERIFIED — pulled ${dayCount} days of readiness from YOUR Oura account. Token is good.` };
}

// Handler split out of main() as a factory so the audit's regression checks can
// drive it with fake req/res and a spy close — no socket, no network, and never
// down the branch that writes oura_tokens.json.
export function makeCallbackHandler({ state, secrets: s, closeServer, fetchImpl = fetch, log = console.log, errLog = console.error }) {
  return async (req, res) => {
    if (!req.url || !req.url.startsWith("/callback")) { res.writeHead(404); res.end(); return; }
    const url = new URL(req.url, "http://localhost:8080");
    const code = url.searchParams.get("code");
    const gotState = url.searchParams.get("state");
    // [E2E audit 25 Jul 2026 — finding 3e0e9ffd, part 1] This branch used to call
    // server.close() — so ANY /callback that wasn't the genuine redirect killed
    // the listener for good: a stale tab from attempt #1 auto-reloading its old
    // (now wrong-state) URL, a link-preloading extension, or — back when this
    // bound 0.0.0.0 — any LAN peer probing the port. The captain then clicks
    // Allow seconds later and the redirect lands on a dead socket, losing the
    // code with a browser error instead of a token. Reject the stray, keep
    // listening for the real one; Ctrl-C is how you abort.
    if (!code || gotState !== state) {
      res.writeHead(400);
      res.end("Ignored: missing code / stale state. Still waiting for the real Oura redirect — leave this alone and finish consent in the other tab.");
      errLog("\n⚠️  ignored a stray /callback (missing code or stale state) — STILL LISTENING for the genuine Oura redirect. Ctrl-C to abort.");
      return;
    }
    try {
      const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, client_id: s.client_id, client_secret: s.client_secret });
      const r = await fetchImpl(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      if (!r.ok) throw new Error(`token exchange HTTP ${r.status}: ${await r.text()}`);
      const tok = await r.json();
      tok.expires_at = Date.now() + (tok.expires_in || 86400) * 1000;
      writeFileSync(TOKENS, JSON.stringify(tok, null, 2));
      // VERIFY against REAL ring data (not just personal_info — an anonymous /
      // wrong-account token returns 200 on personal_info but 401 on data).
      let verifyMsg = "", verified = false;
      try {
        const t2 = new Date().toISOString().slice(0, 10);
        const t1 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
        const v = await fetchImpl(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${t1}&end_date=${t2}`, { headers: { Authorization: `Bearer ${tok.access_token}` } });
        // verdict lives in verifyVerdict() — a 200 with zero days is NOT "good".
        const j = v.ok ? await v.json() : null;
        const vv = verifyVerdict({ ok: v.ok, status: v.status, dayCount: ((j && j.data) || []).length });
        verified = vv.verified; verifyMsg = vv.msg;
      } catch (ve) { verifyMsg = "⚠️  Could not verify token: " + ve.message; }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h2>" + (verified ? "\u2705 Oura connected \u2014 data verified. Close this tab." : "\u26A0\uFE0F Connected, but data not accessible \u2014 check the terminal.") + "</h2>");
      log("\n✅ tokens saved to oura_tokens.json.");
      log(verifyMsg);
      if (verified) log("\nNow run:  node oura_coach.mjs\n");
    } catch (e) { res.writeHead(500); res.end("Token exchange failed: " + e.message); errLog("\n❌ " + e.message + "\n"); }
    // the exchange itself is one-shot: once a code has been redeemed (or failed)
    // the flow is over, so THIS is where the listener legitimately shuts down.
    finally { setTimeout(closeServer, 500); }
  };
}

// ----------------------------------------------------------------------------
// selftest — added by the E2E audit (25 Jul 2026). Dormant-safe: no network, no
// listening socket, no credentials, and it never drives the branch that WRITES
// oura_tokens.json — the captain's live credential files are untouched. Every
// assertion is a regression guard for a specific finding and genuinely fails
// against the pre-audit code.
// ----------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };

  console.log("\nOURA AUTH — selftest (E2E audit regressions)\n");

  // --- finding a9528982: a 200 with zero days is NOT a verified token --------
  // Pre-audit: `if (v.ok) { verified = true; ...pulled 0 days... Token is good. }`
  const zero = verifyVerdict({ ok: true, status: 200, dayCount: 0 });
  assert("a 200 carrying ZERO days of readiness is not 'VERIFIED' — that is the wrong-account symptom",
    zero.verified === false && !zero.msg.includes("Token is good") && zero.msg.includes("LOG IN as the Google account that owns your ring"));
  assert("real ring data still verifies cleanly (no over-suppression)",
    verifyVerdict({ ok: true, status: 200, dayCount: 7 }).verified === true
    && verifyVerdict({ ok: true, status: 200, dayCount: 7 }).msg.includes("pulled 7 days"));
  const dead = verifyVerdict({ ok: false, status: 401, dayCount: 0 });
  assert("a non-200 from the data endpoint still reports the HTTP code and the wrong-account FIX",
    dead.verified === false && dead.msg.includes("HTTP 401") && dead.msg.includes("delete oura_tokens.json"));

  // --- finding 3e0e9ffd part 1: a stray /callback must not kill the listener --
  // Pre-audit this branch called server.close(), so one stale tab reload (or any
  // LAN probe, back when it bound 0.0.0.0) shut the listener down before the
  // genuine redirect arrived. Driven with fake req/res and a spy close; this
  // path returns before any fetch, so nothing leaves the machine.
  let closeCalls = 0, status = 0;
  const res = { writeHead: (c) => { status = c; }, end: () => {} };
  const h = makeCallbackHandler({
    state: "GOODSTATE", secrets: { client_id: "x", client_secret: "y" }, closeServer: () => { closeCalls++; },
    fetchImpl: async () => { throw new Error("selftest must never reach the network"); }, log: () => {}, errLog: () => {},
  });
  await h({ url: "/callback?code=abc&state=STALE" }, res);
  assert("a stale-state /callback is rejected 400 but the listener STAYS UP for the real redirect",
    status === 400 && closeCalls === 0);
  status = 0;
  await h({ url: "/callback?state=GOODSTATE" }, res);
  assert("a /callback with no code at all also leaves the listener up",
    status === 400 && closeCalls === 0);
  status = 0;
  await h({ url: "/favicon.ico" }, res);
  assert("a non-callback request is still a plain 404 and never closes the listener",
    status === 404 && closeCalls === 0);

  // --- finding 3e0e9ffd part 2: the callback endpoint is loopback-only -------
  assert("the callback listener binds loopback only — never 0.0.0.0 / the LAN",
    LOOPBACK_HOSTS.length > 0 && LOOPBACK_HOSTS.every((x) => x === "127.0.0.1" || x === "::1"));

  const passed = checks.every((c) => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : `\nSELFTEST FAILED (${checks.filter((c) => !c[1]).length} of ${checks.length})`);
  return passed;
}

// [E2E audit 25 Jul 2026] main() used to run at import time (`main();`), so the
// module could not be loaded for a selftest without launching the real OAuth
// flow — prompts, a listening socket, the lot. Entry-point guard, same shape as
// oura_coach.mjs. Running the script directly behaves exactly as before.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  main();
}
