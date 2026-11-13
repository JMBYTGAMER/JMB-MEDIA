# JMB TV — directory mode

JMB TV is now a **broadcaster discovery directory**, not a streaming player.

The current page reads channel names, country/category labels, the provider's blocklist and HTTPS website addresses. A visitor who chooses a channel is sent to its listed broadcaster website. JMB does not play, host, record, proxy, rewrite, cache or retransmit TV streams.

## The old Cloudflare proxy must be retired

Earlier JMB TV versions used a Cloudflare Worker to relay third-party media. That implementation has been retired. The current `cors-proxy-worker.js` does not fetch any URL; it reports that the proxy is disabled and returns HTTP 410 for media-proxy requests.

**Important:** editing this file in GitHub does not change the Worker already deployed in Cloudflare. Replace the deployed Worker code manually:

1. Open Cloudflare Dashboard → **Workers & Pages**.
2. Select the old Worker `jb-proxy` (`jb-proxy.johanbiju15.workers.dev`).
3. Select **Edit code**.
4. Replace all code with the current `cors-proxy-worker.js` from this repository.
5. Select **Deploy**.
6. Open the Worker URL with `?ping=1`. It should return a JSON response with `"status":"disabled"`.
7. A normal request to the old `?url=` route should return HTTP 410.

Until that replacement is deployed, the old Cloudflare copy may still be operating. Do not use it to relay streams.

## Current TV directory data

- Channel metadata: `https://iptv-org.github.io/api/channels.json`
- Block/removal list: `https://iptv-org.github.io/api/blocklist.json`
- Country names: `https://iptv-org.github.io/api/countries.json`
- Categories: `https://iptv-org.github.io/api/categories.json`

JMB filters closed, replaced, adult and blocklisted entries and only displays HTTPS website links supplied in the channel database. It does not load the IPTV stream list. The metadata provider may change entries or website addresses; report corrections to the provider and use its current records.

## Why playback was removed

A public stream URL or an entry in a community playlist is not proof that JMB has a licence to rebroadcast that station. Broadcaster rights, subscriptions, region restrictions and source website terms still apply. Use the broadcaster's own website or app.

For JMB's broader policy, see [Copyright, Content & Privacy](../legal/).
