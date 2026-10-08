#!/usr/bin/env node
// Zero-dependency MCP stdio server for the VPN Blocker API (https://vpnblocker.net/docs/).
// Transport: newline-delimited JSON-RPC 2.0 over stdin/stdout. Logs go to stderr only.
import { isIP } from "node:net";
import { createInterface } from "node:readline";

const BASE_URL = "https://api.vpnblocker.net/v2";
const SERVER_INFO = { name: "vpnblocker", version: "0.1.0" };
const TIMEOUT_MS = 15000;

// Optional. Free tier needs no key. A Basic/Professional key is sent as X-API-KEY.
// An unexpanded placeholder like "${VPNBLOCKER_API_KEY}" is treated as absent.
function apiKey() {
  const k = (process.env.VPNBLOCKER_API_KEY || "").trim();
  return k && !/^\$\{.*\}$/.test(k) ? k : "";
}

const TOOLS = [
  {
    name: "vpnblocker_check_ip",
    description:
      "Look up one IPv4 or IPv6 address in VPN Blocker. Returns the API's JSON verbatim: " +
      "status, package, ipaddress, host-ip (true = belongs to a VPN, proxy, or hosting/datacenter organization), " +
      "org, and on the Free package remaining_requests (monthly quota left). " +
      "Professional keys additionally return hostname, country, subdivison, city, postal, location.",
    inputSchema: {
      type: "object",
      properties: {
        ip: { type: "string", description: "A single IPv4 or IPv6 address, e.g. 8.8.8.8 or 2001:4860:4860::8888." },
      },
      required: ["ip"],
      additionalProperties: false,
    },
  },
];

const ERRORS_BY_STATUS = {
  401: "Invalid or expired API key (VPNBLOCKER_API_KEY). Remove it to use the Free package, or fix it.",
  406: "VPN Blocker rejected the IP address as invalid.",
  429: "Free package monthly request limit reached. Wait for the monthly reset or set VPNBLOCKER_API_KEY to a Basic/Professional key.",
};

function toolError(text) {
  return { content: [{ type: "text", text }], isError: true };
}

async function checkIp(args) {
  const ip = typeof args?.ip === "string" ? args.ip.trim() : "";
  if (!ip) return toolError("Missing required argument: ip");
  if (!isIP(ip)) return toolError(`Not a valid IPv4/IPv6 address: ${JSON.stringify(ip)} (no request sent).`);

  const headers = { Accept: "application/json" };
  const key = apiKey();
  if (key) headers["X-API-KEY"] = key;

  let res, body;
  try {
    res = await fetch(`${BASE_URL}/json/${encodeURIComponent(ip)}`, {
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    body = await res.text();
  } catch (e) {
    return toolError(`Request to VPN Blocker failed: ${e?.name === "TimeoutError" ? "timed out" : e?.message || e}`);
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return toolError(`VPN Blocker returned HTTP ${res.status} with a non-JSON body: ${body.slice(0, 300)}`);
  }

  if (!res.ok || data?.status !== "success") {
    const hint = ERRORS_BY_STATUS[res.status] || "VPN Blocker request failed.";
    return toolError(`HTTP ${res.status}: ${data?.msg ?? "unknown error"}. ${hint}\n${JSON.stringify(data)}`);
  }
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
}

async function handle(msg) {
  const { id, method, params } = msg;
  switch (method) {
    case "initialize":
      return {
        protocolVersion: params?.protocolVersion || "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools: TOOLS };
    case "tools/call": {
      if (params?.name === "vpnblocker_check_ip") return checkIp(params.arguments || {});
      throw { code: -32602, message: `Unknown tool: ${params?.name}` };
    }
    default:
      throw { code: -32601, message: `Method not found: ${method}` };
  }
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", async (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
  }
  const isRequest = msg.id !== undefined && msg.id !== null;
  try {
    const result = await handle(msg);
    if (isRequest) send({ jsonrpc: "2.0", id: msg.id, result });
  } catch (err) {
    if (!isRequest) return; // notifications (e.g. notifications/initialized) get no response
    const error = err && typeof err.code === "number" ? err : { code: -32603, message: String(err?.message || err) };
    send({ jsonrpc: "2.0", id: msg.id, error });
  }
});
rl.on("close", () => process.exit(0));
process.stderr.write(`[vpnblocker-mcp] ready (api key: ${apiKey() ? "set" : "none, Free package"})\n`);
