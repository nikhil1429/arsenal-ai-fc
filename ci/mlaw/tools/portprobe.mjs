// preload (NODE_OPTIONS=--import): journal every listen() and every outbound connect a selftest makes — port number and
// host only — to MLAW_PORT_LOG. A planted port (an env door's listen-0 value) is marked planted.
import net from "node:net"; import { appendFileSync } from "node:fs";
const LOG = process.env.MLAW_PORT_LOG; const planted = new Set(Object.entries(process.env).filter(([k]) => /^ARSENAL_[A-Z_]*PORT$/.test(k)).map(([, v]) => Number(v)));
const organ = (process.argv[1] || "").split("/").pop();
const j = (row) => { try { appendFileSync(LOG, JSON.stringify({ organ, ...row }) + "\n"); } catch {} };
const L = net.Server.prototype.listen;
net.Server.prototype.listen = function (...a) { const p = typeof a[0] === "object" && a[0] ? a[0].port : a[0]; if (typeof p === "number" || /^\d+$/.test(String(p))) j({ kind: "listen", port: Number(p), planted: planted.has(Number(p)) }); return L.apply(this, a); };
const C = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...a) { const o = typeof a[0] === "object" && a[0] ? a[0] : { port: a[0], host: a[1] }; if (o && o.port) j({ kind: "connect", port: Number(o.port), host: String(o.host || "localhost"), planted: planted.has(Number(o.port)) }); return C.apply(this, a); };
