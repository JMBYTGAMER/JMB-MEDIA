# JMB TV — channel discovery guide

JMB TV is a directory of channel information and source websites. It is not a TV streaming service.

## Data used

The page requests:
- channels.json — channel names, alternate names, network/owner metadata, country, categories, channel status and the website field.
- feeds.json — descriptive language information only.
- countries.json, languages.json and categories.json — filter labels.
- blocklist.json — upstream entries excluded from the directory.

Documentation: https://github.com/iptv-org/api

The page does not request the IPTV-org M3U playlist, streams API, logo API or video files. Channel cards use JMB-created initials instead of displaying third-party logos. A details popup links to the HTTPS website URL provided by the upstream channel record, when present. That URL may be outdated or incorrect; check the destination before use.

## Copyright and access rules

- Do not add stream URLs, M3U playlists, embedded players or video files.
- Do not add proxying, playlist rewriting, referrer/user-agent spoofing or access-control bypass.
- Do not record, download, cache, retransmit or sell third-party broadcasts.
- Do not add channel logos or programme artwork without permission or a licence covering that use.
- A public stream or a directory listing does not prove that the broadcaster has authorised reuse.
- A future player or embed requires separate written permission from the relevant rights holder and compliance with platform terms and territorial restrictions.

The community channel metadata is sourced from IPTV-org's API/database. The upstream repositories publish Unlicense/public-domain dedication terms for their repository contents. These terms do not grant rights to third-party broadcaster programmes or trademarks.

For site-wide rules, see [Copyright, Content & Privacy](../legal/).
