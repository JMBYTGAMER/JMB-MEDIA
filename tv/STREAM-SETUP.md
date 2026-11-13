# JMB TV stream setup

JMB TV is a dedicated TV-only channel guide. Channel cards open in the in-page player and do not redirect to broadcaster websites.

## Cloudflare Worker (needed for some HLS streams)

Some HLS providers allow playback only when playlist and media requests have the expected CORS headers. JMB TV is configured to try its own media proxy after a direct request fails.

1. Open Cloudflare Dashboard → **Workers & Pages**.
2. Open the Worker used for `jb-proxy.johanbiju15.workers.dev`.
3. Replace its code with the latest `cors-proxy-worker.js` from this repository and deploy it.
4. Confirm the Worker keeps the `workers.dev` address configured in `tv/index.html` under `const PROXY`.
5. Reload `https://media.jmbhost.qzz.io/tv/`, open **More tools**, and use **Test proxy** to check it.

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


## Supplemental public broadcaster directory

JMB TV also reads the optional playlist at https://raw.githubusercontent.com/freecasthub/public-iptv/main/playlist.m3u. The app accepts only HTTPS HLS (.m3u8) entries from this source, and skips YouTube-only entries, GeoIP-marked entries, and VOD groups. Duplicate channel names are checked against the existing directory before insertion. This is a public directory, not a guarantee that every upstream stream is online or available in every region.


## Diagnosing a stream error

If JMB TV shows a playback error, open **More tools → Test proxy**. The test checks both the Worker health endpoint and a public HLS test playlist. A green result means the proxy is reachable; it does not guarantee that a particular broadcaster stream is online or permits third-party playback.

If the Worker test fails, deploy the current `cors-proxy-worker.js` in Cloudflare. This is a separate deployment from GitHub Pages. If the Worker test passes but one channel still fails, the provider may be offline, region-limited, or blocking third-party playback; try another listing from the same broadcaster.


## New automatic playback diagnostics

When a channel fails, JMB TV now checks the configured Worker, then requests that channel's HLS playlist and first media segment through the Worker. The message in the player identifies the failing stage. This is a diagnostic only; it does not make an offline, geo-restricted, subscription-only, DRM-protected or browser-incompatible stream playable.

The HLS.js player routes both XHR-based and Fetch-based playlist/segment requests through the configured Worker. If the diagnostic says the Worker cannot be reached or rejects the site origin, deploy the current `cors-proxy-worker.js` in Cloudflare Workers and confirm that `https://media.jmbhost.qzz.io` is in its `ALLOWED` origin list. GitHub Pages deployment does not publish Cloudflare Worker code.
