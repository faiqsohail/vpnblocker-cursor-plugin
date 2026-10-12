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

An API key is required for every lookup. [Create a free account](https://dashboard.vpnblocker.net/signup) to get a free key (10,000 lookups a month), then set the `VPNBLOCKER_API_KEY` environment variable to it before launching Cursor. Keys look like `vpb_` followed by 32 letters and numbers. The server sends the key as the `X-API-KEY` header, and without one the tool returns an error and sends no request. Never commit keys.

Paid plans (Basic, Professional, Business, Enterprise) raise the monthly limit. Professional and above also return `hostname` and geolocation fields. See [Monthly limits](https://vpnblocker.net/docs/#monthly-limits).

## Response fields

| Field | Meaning |
| --- | --- |
| `host-ip` | `true` if the IP belongs to a VPN, proxy, or hosting organization |
| `org` | Organization that owns the IP |
| `ipaddress` | The IP that was checked |
| `package` | `Free`, `Basic`, `Professional`, `Business`, or `Enterprise` |
| `remaining_requests` | Monthly lookups left for this key (all plans) |
| `hostname`, `country`, `subdivision`, `city`, `postal`, `location` | Professional, Business, and Enterprise only |

The tool also reports the `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-VPNBlocker-Plan`, and (on 429) `Retry-After` headers as a `rate limit:` line.

## Test locally

```sh
VPNBLOCKER_API_KEY=vpb_... node scripts/smoke.mjs 8.8.8.8
```

To try it in Cursor, copy this folder to `~/.cursor/plugins/local/vpnblocker` and run **Developer: Reload Window**.

## License

MIT
