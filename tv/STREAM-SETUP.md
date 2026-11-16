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


## Proxy connection selector

Use the **Proxy** button in the JMB TV toolbar to open the connection manager. It offers four modes:

- **Auto** — try the JMB Worker and, when configured, your Worker in the selected order.
- **JMB proxy** — use only the built-in JMB Worker as the fallback.
- **Your proxy** — use only the HTTPS Cloudflare Worker URL you entered and tested.
- **Off** — use direct stream connections only.

Enter your Worker base URL (for example, `https://your-worker.workers.dev/`) under **Your Cloudflare Worker URL**. The URL must be an HTTPS Worker base URL without a path, query string, fragment or login details. Deploy the repository's `cors-proxy-worker.js` source to a Worker you control, and ensure its `ALLOWED` list includes `https://media.jmbhost.qzz.io`. Save and test the Worker from the JMB TV page. Your selection is stored in this browser on this device.

The **Test selected proxy** action checks the Worker's health endpoint and whether it can fetch and rewrite a public sample HLS playlist. A passing test confirms only those checks; it does not certify every broadcaster stream or promise availability.

Direct playback is still attempted first. The player avoids wrapping playlist segment URLs twice: the Worker rewrites the HLS playlist, and the browser leaves those already-proxied segment URLs unchanged. Use only a Worker you own or are authorised to use. Proxying helps compatible public streams with browser CORS restrictions; it does not bypass subscriptions, DRM, logins, geographic restrictions or broadcaster access controls. If a broadcaster is offline or refuses third-party playback, the channel still cannot play.

Only use an HTTPS Worker you control for the optional backup. Its code must include `https://media.jmbhost.qzz.io` in the `ALLOWED` origin list. Deploying this static website through GitHub does not deploy a Cloudflare Worker; update the Worker separately only when its source changes.
