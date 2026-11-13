# JMB TV — worldwide channel catalogue and in-page player

JMB TV uses two separate data paths:

1. **Worldwide channel catalogue:** channel names, IDs, countries, categories, logos and feed-format/language metadata from IPTV-org's public API.
2. **In-page playback:** a manually approved allowlist of official YouTube channel live-player embeds. A channel appearing in the catalogue does not automatically make it playable.

## World catalogue data

The page reads these metadata files:
- `channels.json` — channel names, alternate names, country, categories, owners and current/closed/replaced status.
- `logos.json` — channel logo records, including the `in_use` flag.
- `feeds.json` — feed names, language and listed broadcast format (for example, a format such as 1080i).
- `countries.json`, `categories.json`, `languages.json` — human-readable filter labels.
- `blocklist.json` — channel entries that the data provider has listed for exclusion.

The app does **not** read `streams.json` and does not load raw IPTV, M3U or HLS stream URLs. The catalogue is dynamic and reflects the entries available from the community-maintained data API; it is not a complete census of every television channel in the world. Logo and format metadata may be missing or stale.

API documentation: https://github.com/iptv-org/api

## Current official in-page player allowlist

These official YouTube channel IDs are manually configured in `featured` in `tv/app.js`:

- Asianet News — `UCf8w5m0YsRa8MHQ5bwSGmbw`
- DD News — `UCKwucPzHZ7zCUI7fI-Wo1g`
- DD National — `UCSjPe5kinQtwcyHcFJyyMfw`
- DD Malayalam — `UC4--pPs1CVZvs6OuuhfjdwQ`
- Kerala DD News — `UC-GEJA8oiKOg6l2__7F6BhQ`
- DD Bharati — `UCIAnlTV3O9NYWMI-DwYZaWg`
- DD Bangla News — `UCe4GERYkwpMUJWZpxOiATYA`
- DD Sahyadri News — `UCbcCOCo2JeLRK48puKro1pQ`
- DD Kisan — `UCnDfmcUyhgJp6xC1LmBLfUg`

The Prasar Bharati channel IDs are listed in its [official network YouTube document](https://prasarbharati.gov.in/wp-content/uploads/2024/04/Prasar-Bharati-Network-Youtube.pdf). Asianet's channel ID is associated with its verified YouTube channel. YouTube's original embedded player controls the playback session.

The embed URL uses YouTube's privacy-enhanced host:
`https://www.youtube-nocookie.com/embed/live_stream?channel=CHANNEL_ID`

YouTube or the broadcaster may disable embedding, be offline, or restrict playback. JMB must not bypass those controls. If unavailable, the player reports that the source is not available; it does not try an unrelated stream URL.

## Adding another playable channel

Before adding a channel to the allowlist:

1. Verify that the YouTube channel is the broadcaster's official channel. Prefer a link from the broadcaster's own website or a verified platform account.
2. Confirm that the channel publishes a live broadcast and that embedding is enabled.
3. Record the channel ID, display name, language and authoritative evidence for the source in the change description or project records.
4. Add the channel to `featured` in `tv/app.js`.
5. Test the in-page embed. If it is blocked or unavailable, remove/disable the entry rather than trying a proxy, raw HLS URL or alternate stream host.

Do not add a stream just because it appears in a public playlist or a community-submitted list.

## Retired Cloudflare media proxy

The old third-party media proxy is not used by the current player. The repository's `cors-proxy-worker.js` is a retired Worker that makes no outbound media requests.

GitHub cannot update a Worker already deployed in your Cloudflare account. If the old `jb-proxy` Worker is still deployed, replace its code with the current `cors-proxy-worker.js` through Cloudflare Workers & Pages and deploy it. The `?ping=1` endpoint should return `"status":"disabled"`; old proxy requests should return HTTP 410.

## Limits

- The catalogue is broad, but it cannot promise literally every broadcaster or channel worldwide.
- A channel card's listed format describes catalogue metadata; it is not a live measurement of current stream quality.
- A configured YouTube channel player is not guaranteed to have an active live broadcast at every moment.
- Region, account, platform and embed restrictions are controlled by the original provider.
- The TV section does not display a third-party website button on each channel card. Its player is embedded in-page when available.

For JMB's content rules, see [Copyright, Content & Privacy](../legal/).
