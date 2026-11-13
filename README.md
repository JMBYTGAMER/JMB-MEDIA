# JMB MEDIA

A mobile-first media hub with JMB TV, newspapers, radio and world-news directories.

## JMB TV — worldwide channel catalogue and in-page player

The TV page uses the public IPTV-org collection:
- Playlist: https://iptv-org.github.io/iptv/index.m3u
- Metadata API: channel, feed, logo, country, language, category and blocklist JSON files from https://iptv-org.github.io/api/

The catalogue updates from the upstream source when visitors load or refresh the TV page. It is a broad public directory, not literally every TV broadcaster in existence. The page filters entries identified as NSFW, closed, replaced or blocklisted by the upstream metadata.

Every channel card shows the channel logo (when available), name, country, language/category details and feed quality when provided. Selecting a card opens the JMB TV in-page player. The browser connects directly to the listed stream host using HLS.js or native browser playback where supported. No Official website action is shown on channel cards.

### Playback limitations

- JMB does not upload, host, record, cache or retransmit the programmes.
- JMB does not deploy a CORS proxy or route stream traffic through a JMB server.
- A stream may be offline, region-limited, require provider-specific playback settings, or reject cross-origin browser requests. Such streams will not play in every browser.
- JMB does not bypass DRM, authentication, subscriptions, paywalls, access controls or regional restrictions.
- Quality labels come from upstream feed metadata; they are not measurements of the viewer's actual connection or playback quality.

IPTV-org describes its collection as publicly available channel stream links submitted by contributors, not video files. That is the upstream project's description, not a warranty that every stream is licensed for every purpose or territory. Read the JMB copyright and privacy policy at https://media.jmbhost.qzz.io/legal/ and the IPTV-org project notes at https://github.com/iptv-org/iptv.

## Other JMB MEDIA sections

- Newspapers: publisher names, regions, languages and publisher links.
- Radio: station directory information.
- World News: news publisher and official source links.

These pages remain separate from the JMB TV live player.

## Retired proxy

The previous CORS/media proxy is retired. The current TV player connects directly from the visitor's browser to the public stream host. The cors-proxy-worker.js repository file is a disabled retirement stub only. An already deployed old Cloudflare Worker must be disabled or replaced in Cloudflare separately; a GitHub commit does not change an existing Cloudflare deployment.

## Quality checks

GitHub Actions runs scripts/check-site.mjs on updates. It checks HTML, JavaScript syntax, local references, required policy content, direct-player configuration and that no media-proxy fallback is present.