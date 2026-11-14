# JMB TV / JMB MEDIA

A mobile-first discovery directory for television channel metadata, newspapers, radio stations and world-news sources.

## Content and copyright design

JMB is designed as a **directory, not a broadcaster, streaming service, newspaper publisher or media host**.

- No embedded third-party TV or radio player.
- No IPTV M3U, stream URL or streams API is loaded by the website.
- No CORS/media proxy, playlist rewriting, user-agent/referrer spoofing or access-control bypass.
- No channel logos or other third-party artwork are loaded into the TV cards.
- No programme recording, downloading, caching or retransmission.
- Newspaper and world-news sections show source directories and links only; they do not republish articles, headlines, photos, thumbnails, video or audio.
- Radio is a station directory; playback remains on the station's own service.

A public URL or third-party directory entry is not proof of permission to rebroadcast copyrighted content. Any future player or media embed must be separately approved in writing by the broadcaster/rightsholder and comply with its platform terms, territorial limits and embedding rules. Do not add streams merely because a link appears in a public playlist.

## JMB TV channel directory

The TV page reads factual channel metadata from the IPTV-org API:

- channels.json — channel name, alternate names, network/owner, country, categories, current/closed/replaced status and a website field.
- feeds.json — descriptive feed metadata such as language. It is not used for stream URLs.
- countries.json, languages.json, categories.json — filter labels.
- blocklist.json — entries excluded by the upstream project, including rights-related and unsuitable entries.

The page does **not** request index.m3u, streams.json, logos.json or video/media files. Each card opens a JMB details dialog. Where the API provides an HTTPS website URL, the dialog gives the visitor a link to that source. Visitors leave JMB when opening it.

The upstream API documentation identifies channel records as sourced from the IPTV-org database. The API and database repositories publish Unlicense/public-domain dedication terms for their repository contents. This does not grant rights to channel brands, broadcaster programmes, logos, music, films or other content owned by third parties.

Sources:
- https://github.com/iptv-org/api
- https://github.com/iptv-org/database
- https://github.com/iptv-org/api/blob/master/LICENSE
- https://github.com/iptv-org/database/blob/master/LICENSE

## Other sections

- Newspapers: publisher directory and links to publisher websites.
- Radio: station directory information and station website links; no audio playback.
- World News: publisher, official video channel and podcast destination links; no embedded content.

## Retired media proxy

cors-proxy-worker.js is a disabled retirement stub. It does not fetch or relay third-party content. GitHub commits do not change a Cloudflare Worker already deployed separately; verify in Cloudflare that any former media proxy has been removed or replaced by the retired stub.

## Quality checks

Run node scripts/check-site.mjs. The checker validates HTML language/title/viewport and sharing metadata, duplicate IDs, local asset references, JavaScript syntax, CSS braces, PWA manifests, the custom domain, the preview image and the media/copyright restrictions. It also ensures the TV page does not reintroduce an embedded player, stream playlist, external logo feed or media proxy.
