// Drives server/index.mjs over stdio with real JSON-RPC and prints every response.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ips = process.argv.slice(2);
const child = spawn("node", ["./server/index.mjs"], { cwd: root, stdio: ["pipe", "pipe", "inherit"] });

const msgs = [
  { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "0" } } },
  { jsonrpc: "2.0", method: "notifications/initialized" },
  { jsonrpc: "2.0", id: 2, method: "tools/list" },
  ...ips.map((ip, i) => ({ jsonrpc: "2.0", id: 10 + i, method: "tools/call", params: { name: "vpnblocker_check_ip", arguments: { ip } } })),
];
const expected = msgs.filter((m) => m.id !== undefined).length;
let got = 0, buf = "";
child.stdout.on("data", (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    console.log("<<", line);
    if (++got === expected) child.stdin.end();
  }
});
for (const m of msgs) { console.log(">>", JSON.stringify(m)); child.stdin.write(JSON.stringify(m) + "\n"); }
setTimeout(() => { console.error("timeout"); child.kill(); process.exit(1); }, 30000).unref();
