---
name: vpnblocker-ip-check
description: Check whether an IP address belongs to a VPN, proxy, or hosting/datacenter organization using the VPN Blocker (vpnblocker.net) MCP tool. Use when the user asks if an IP is a VPN, proxy, datacenter, or hosting IP, wants to screen signups, logins, payments, or game/chat connections for anonymized traffic, or needs the owning organization (ASN/org) of an IP.
---

# VPN Blocker IP check

## When to use

- "Is 203.0.113.7 a VPN / proxy / datacenter IP?"
- Screening an IP from a signup, login, checkout, comment, or server log before allowing or flagging it.
- Finding which organization owns an IP.

Do not use it for domain names, hostnames, or CIDR ranges: the tool accepts exactly one IPv4 or IPv6 address per call. Resolve hostnames first if needed.

## Tool

`vpnblocker_check_ip({ ip })` returns the VPN Blocker JSON response as-is.

It needs the `VPNBLOCKER_API_KEY` environment variable (free keys: https://dashboard.vpnblocker.net/signup). Without it the tool returns an error and sends no request.

Fields returned on every plan:

- `status`: `"success"` on a successful lookup.
- `package`: `"Free"`, `"Basic"`, `"Professional"`, `"Business"`, or `"Enterprise"`.
- `remaining_requests`: monthly lookups left for this key.
- `ipaddress`: the IP that was checked.
- `host-ip`: `true` when the IP belongs to a VPN, proxy, or hosting organization; `false` otherwise.
- `org`: the organization that owns the IP.

Professional, Business, and Enterprise keys also return `hostname`, `country` (`name`, `code`), `subdivision` (`name`, `code`), `city`, `postal`, and `location` (`lat`, `long`; both `0` when unknown). Any of these can be `null`. Only report them when they are present.

A `rate limit:` line follows the JSON with the key's monthly `limit`, `remaining`, `reset` time, and `plan`.

## How to report results

- Lead with the verdict: `host-ip: true` means VPN, proxy, or hosting. The API does not say which of the three, so don't claim one.
- Name the `org`.
- Treat `host-ip: true` as a signal, not proof of abuse: public DNS resolvers, CDNs, and cloud servers are all hosting IPs.
- Mention `remaining_requests` when it is low. Every key has a monthly cap. Don't spend lookups on bulk scans unless the user asks for one.

## Errors

- Invalid IP: the tool refuses before calling the API.
- No key: the tool refuses before calling the API and links to the free signup.
- HTTP 401: the key is invalid, revoked, not paid for yet, overdue, or suspended. The API's `msg` says which.
- HTTP 406: the API rejected the IP as invalid.
- HTTP 429: the key's monthly limit has been reached. Relay `retry_after_seconds` / `reset` from the rate limit line.

Relay the error. Don't guess a verdict.
