# JMB MEDIA

A mobile-first media hub with JMB TV, newspapers, radio and world-news directories.

## JMB TV — worldwide channel guide

The TV page reads the public IPTV-org collection:
- Channel playlist: https://iptv-org.github.io/iptv/index.m3u
- Channel metadata: https://iptv-org.github.io/api/ (channels, feeds, logos, countries, languages, categories and blocklist)

Channel data is loaded when the visitor opens the TV guide. The large total on the page is calculated from the distinct channel cards actually loaded after duplicate feed entries and excluded entries are processed; it is not a hand-written or permanently fixed number. Country totals are calculated from the mapped channel country metadata.

Each channel has one card with its logo when available, name, country, language/category information and feed format when provided. The same channel is shown once even if the playlist supplies more than one feed URL. Available alternative URLs are kept as player fallbacks. Favourites are saved locally in the visitor's browser.

Selecting a card opens the built-in JMB TV player. The browser connects directly to the listed stream host using HLS.js or native browser playback when supported. No “Official website” card button is shown.

### Playback limitations

- The directory is a broad public collection, not a guarantee that literally every broadcaster in the world is listed.
- Some listed streams are offline, region-limited, time-limited, or not compatible with browser playback. Multiple listed feed URLs can be tried when the playlist provides them, but no player can guarantee every third-party source will work.
- JMB does not upload, host, record, cache or retransmit programmes, and does not route video through a CORS proxy.
- JMB does not bypass DRM, authentication, subscriptions, paywalls, access controls or geographic restrictions.
- Quality labels come from upstream feed metadata; they are not measurements of the viewer's actual connection or playback quality.
- Entries marked NSFW or blocklisted by upstream channel metadata are excluded.

IPTV-org documents its collection as publicly available stream links submitted by contributors, not video files. This description is not a guarantee that every stream is authorised for every viewer or territory. Read the JMB copyright and privacy policy at https://media.jmbhost.qzz.io/legal/ and the IPTV-org project notes at https://github.com/iptv-org/iptv.

## Other JMB MEDIA sections

- Newspapers: publisher names, regions, languages and publisher links.
- Radio: station directory information.
- World News: news publisher and official source links.

## Retired proxy

The previous CORS/media proxy is retired. The current TV player connects directly from the visitor's browser to the public stream host. The cors-proxy-worker.js repository file is a disabled retirement stub only. An already deployed old Cloudflare Worker must be disabled or replaced in Cloudflare separately; a GitHub commit does not change an existing Cloudflare deployment.

## Quality checks

GitHub Actions runs scripts/check-site.mjs on updates. It checks HTML, JavaScript syntax, local references, required policy content, direct-player configuration and that no media-proxy fallback is present.