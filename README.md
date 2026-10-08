# VPN Blocker for Cursor

Detect VPN, proxy, and hosting/datacenter IP addresses from inside Cursor using the [VPN Blocker API](https://vpnblocker.net/docs/).

Ask the agent things like "is 203.0.113.7 a VPN?" or "who owns this IP from my signup logs?" and it calls VPN Blocker directly.

## What's included

- **MCP server** (`server/index.mjs`): one tool, `vpnblocker_check_ip({ ip })`, which calls `GET https://api.vpnblocker.net/v2/json/{ip}` and returns the JSON response as-is. Invalid addresses are rejected locally, so they don't use quota.
- **Skill** (`skills/vpnblocker-ip-check`): tells the agent when to use the tool and how to report results.

Ships as both an [Agent Plugin](https://agent-plugins.org) (root `plugin.json` + `mcp.json`) and a Cursor Plugin (`.cursor-plugin/plugin.json`).

## Requirements

- Node.js 18 or newer on your `PATH` (uses the built-in `fetch`; no npm dependencies).

## Configuration

No API key is needed: the Free package allows 500 lookups per month, and each response includes `remaining_requests`.

For higher limits or the extra location fields (`hostname`, `country`, `city`, etc.), set the `VPNBLOCKER_API_KEY` environment variable to a Basic or Professional key from [vpnblocker.net](https://vpnblocker.net) before launching Cursor. The server sends it as the `X-API-KEY` header. Never commit keys.

## Response fields

| Field | Meaning |
| --- | --- |
| `host-ip` | `true` if the IP belongs to a VPN, proxy, or hosting organization |
| `org` | Organization that owns the IP |
| `ipaddress` | The IP that was checked |
| `package` | `Free`, `Basic`, or `Professional` |
| `remaining_requests` | Monthly lookups left (Free package) |

## Test locally

```sh
node scripts/smoke.mjs 8.8.8.8
```

To try it in Cursor, copy this folder to `~/.cursor/plugins/local/vpnblocker` and run **Developer: Reload Window**.

## License

MIT
