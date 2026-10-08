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

Fields returned on the Free package (no API key):

- `status`: `"success"` on a successful lookup.
- `package`: `"Free"`, `"Basic"`, or `"Professional"`.
- `remaining_requests`: monthly lookups left (Free package only).
- `ipaddress`: the IP that was checked.
- `host-ip`: `true` when the IP belongs to a VPN, proxy, or hosting organization; `false` otherwise.
- `org`: the organization that owns the IP.

Professional keys also return `hostname`, `country`, `subdivison` (spelled that way by the API), `city`, `postal`, and `location`. Only report these when they are present in the response.

## How to report results

- Lead with the verdict: `host-ip: true` means VPN, proxy, or hosting. The API does not say which of the three, so don't claim one.
- Name the `org`.
- Treat `host-ip: true` as a signal, not proof of abuse: public DNS resolvers, CDNs, and cloud servers are all hosting IPs.
- On the Free package, mention `remaining_requests` when it is low. The Free package has a monthly cap. Don't spend lookups on bulk scans unless the user asks for one.

## Errors

- Invalid IP: the tool refuses before calling the API.
- HTTP 401: the `VPNBLOCKER_API_KEY` is invalid or expired.
- HTTP 429: the Free monthly limit has been reached.

Relay the error. Don't guess a verdict.
