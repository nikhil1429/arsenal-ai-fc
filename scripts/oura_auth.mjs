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
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SECRETS = join(__dirname, "oura_secrets.json");
const TOKENS  = join(__dirname, "oura_tokens.json");
const REDIRECT = "http://localhost:8080/callback";
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

  const server = http.createServer(async (req, res) => {
    if (!req.url.startsWith("/callback")) { res.writeHead(404); res.end(); return; }
    const url = new URL(req.url, "http://localhost:8080");
    const code = url.searchParams.get("code");
    const gotState = url.searchParams.get("state");
    if (!code || gotState !== state) { res.writeHead(400); res.end("Auth failed (missing code / bad state). Close and re-run."); server.close(); return; }
    try {
      const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, client_id: s.client_id, client_secret: s.client_secret });
      const r = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
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
        const v = await fetch(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${t1}&end_date=${t2}`, { headers: { Authorization: `Bearer ${tok.access_token}` } });
        if (v.ok) { const j = await v.json(); verified = true; verifyMsg = `✅ VERIFIED — pulled ${(j.data || []).length} days of readiness from YOUR Oura account. Token is good.`; }
        else verifyMsg = `❌ Token saved but your Oura DATA is NOT accessible: HTTP ${v.status}.\n   This means consent was granted WITHOUT being logged into your ring's Oura account.\n   FIX: open cloud.ouraring.com, LOG IN as the account that owns your ring (nikhil.panwar2914@gmail.com),\n        then delete oura_tokens.json + oura_secrets.json and run this again, pasting the URL into THAT browser.`;
      } catch (ve) { verifyMsg = "⚠️  Could not verify token: " + ve.message; }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h2>" + (verified ? "\u2705 Oura connected \u2014 data verified. Close this tab." : "\u26A0\uFE0F Connected, but data not accessible \u2014 check the terminal.") + "</h2>");
      console.log("\n✅ tokens saved to oura_tokens.json.");
      console.log(verifyMsg);
      if (verified) console.log("\nNow run:  node oura_coach.mjs\n");
    } catch (e) { res.writeHead(500); res.end("Token exchange failed: " + e.message); console.error("\n❌ " + e.message + "\n"); }
    finally { setTimeout(() => server.close(), 500); }
  });

  server.listen(8080, () => {
    console.log("\n" + "=".repeat(70));
    console.log(">>> STEP 1: In your browser, LOG IN to  cloud.ouraring.com");
    console.log(">>>         as the account that owns your ring (nikhil.panwar2914@gmail.com).");
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
main();
