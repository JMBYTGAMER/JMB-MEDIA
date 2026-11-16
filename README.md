# JMB MEDIA

A mobile-first media discovery hub built as a static GitHub Pages website.

## Sections

- **JMB TV** — a dedicated TV-only channel guide with search, category/language/region filters, favourites, recent channels, an in-page player, mini-player, fullscreen and playback controls. Its directory combines IPTV-org with a filtered freecasthub public-broadcaster playlist. Supplemental entries are limited to HTTPS HLS streams; YouTube-only, GeoIP-marked, VOD and non-HLS entries are excluded, and matching channel names/regions are deduplicated. Its standalone responsive interface does not expose the Movies or Radio sections. Streams remain subject to provider availability and rights; the app does not unlock subscriptions, DRM or regional restrictions.
- **Newspapers** — browse Malayalam, Indian and international publishers, read available RSS/Atom-syndicated article content inside JMB, and open the official publisher page for the complete report. Feed loading tries the publisher first, then a CORS relay and a fallback relay; successful editions are cached locally for offline/temporary-outage reading. Full articles are shown only where the publisher includes them in its feed.
- **JMB Radio** — search online radio stations by name, country, language and genre using Radio Browser.
- **JMB Social Media** — a news desk for text headlines, source-linked video channels and audio briefings.

## Rights and availability

JMB MEDIA is a directory and player interface, not a broadcaster. It does not unlock subscriptions, remove regional restrictions, or provide access to paid programming for free. Some public directory entries may be offline or unavailable in a particular country. Use the broadcaster's official website or app for programmes that require a subscription. Only non-mature channel entries are shown in the TV directory.

News cards display short feed summaries and link to the original publisher. The newspaper and news sections are not intended to republish full articles.

## Data providers

- TV channel metadata and community-submitted public stream directory: [iptv-org API](https://github.com/iptv-org/api). Individual broadcasters retain ownership of their content and streams.
- Radio directory: [Radio Browser](https://www.radio-browser.info/) and its [API documentation](https://docs.radio-browser.info/).
- News: publisher RSS feeds and Google News RSS source-search feeds. Open each publisher's own site for the full story.

## Deployment

This project is plain HTML, CSS and JavaScript. Enable **GitHub Pages** for the `main` branch and the repository root in repository settings. No build step or secrets are required.

## Project structure

```
/
├── index.html
├── assets/
│   ├── css/styles.css
│   └── js/common.js
├── tv/
│   ├── index.html
│   ├── jmb-tv-only.css
│   ├── sw.js
│   └── STREAM-SETUP.md
├── newspaper/
│   ├── index.html
│   └── app.js
├── radio/
│   ├── index.html
│   └── app.js
└── social/
    ├── index.html
    └── app.js
```

## JMB TV streaming proxy

The TV page uses the JMB-configured Cloudflare Worker endpoint in `tv/index.html` for compatible public HLS streams that need a media proxy. The Worker source is `cors-proxy-worker.js`; its allowed origin is `https://media.jmbhost.qzz.io`.

After changing the Worker source, deploy it in Cloudflare Workers. The deployed endpoint must match the `PROXY` constant in `tv/index.html` (`https://jb-proxy.johanbiju15.workers.dev/?url=`). A GitHub commit does not deploy Worker code to Cloudflare; the Cloudflare Worker must already be deployed and configured to allow the JMB MEDIA origin. See `tv/STREAM-SETUP.md`.


## TV directory sources

- IPTV-org public worldwide playlist and its category, country and language metadata: https://github.com/iptv-org/iptv
- Free Public IPTV playlist: https://github.com/freecasthub/public-iptv (the project states that its playlist is released under The Unlicense and that streams are free and publicly provided by official broadcasters).
- JMB TV filters the supplemental playlist to secure HTTPS HLS stream URLs, excluding entries marked as GeoIP-blocked or YouTube-only and VOD groups. It does not bypass geographic restrictions, subscriptions or DRM. The visible channel count is calculated from the merged, deduplicated catalogue at runtime.


## Proxy settings

JMB TV attempts a public stream directly first, then uses the configured Cloudflare Worker for compatible HLS streams that need browser CORS support. The player settings use the JMB-configured Worker automatically; visitors do not need to enter a Worker URL. The proxy fallback does not bypass subscriptions, DRM, regional restrictions, or broadcaster access controls. A successful proxy health test confirms only that the Worker responds and rewrites a sample playlist; it does not guarantee that every channel is available.
