# JMB TV stream setup

JMB TV is a dedicated TV-only channel guide. Channel cards open in the in-page player and do not redirect to broadcaster websites.

## Cloudflare Worker (needed for some HLS streams)

Some HLS providers allow playback only when playlist and media requests have the expected CORS headers. JMB TV is configured to try its own media proxy after a direct request fails.

1. Open Cloudflare Dashboard → **Workers & Pages**.
2. Open the Worker used for `jb-proxy.johanbiju15.workers.dev`.
3. Replace its code with the latest `cors-proxy-worker.js` from this repository and deploy it.
4. Confirm the Worker keeps the `workers.dev` address configured in `tv/index.html` under `const PROXY`.
5. Reload `https://media.jmbhost.qzz.io/tv/` and use the in-page Proxy / Test controls in the About or player settings to check it.

The Worker source now allows the exact site origin `https://media.jmbhost.qzz.io`. Updating this file in GitHub alone does not publish changes to Cloudflare; the Worker must be deployed in Cloudflare.

## Playback limitations

- A channel must have a public stream URL in the data provider's playlist.
- Some streams may be offline, blocked in your region, or incompatible with the browser.
- HD quality depends on the stream provider; JMB TV cannot increase a low-quality source.
- The proxy handles media delivery and CORS only. It does not bypass subscriptions, DRM, logins or regional restrictions.

## Current stream configuration

- Channel playlist: `https://iptv-org.github.io/iptv/index.m3u`
- Language playlist: `https://iptv-org.github.io/iptv/index.language.m3u`
- Worker URL: `https://jb-proxy.johanbiju15.workers.dev/?url=`
- Allowed site origin: `https://media.jmbhost.qzz.io`
