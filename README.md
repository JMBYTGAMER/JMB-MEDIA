# JMB TV / JMB MEDIA

A mobile-first directory hub for discovering television broadcasters, newspaper publishers, radio stations and world-news sources.

## Our content and copyright approach

JMB TV is a **source directory, not a media host, player, broadcaster or publisher**.

- JMB TV lists channel metadata and links to listed HTTPS broadcaster websites. It does not load stream playlists, embed players, host recordings, retransmit broadcasts, proxy media requests or bypass region/subscription restrictions.
- JMB Newspapers lists publisher names, regions, languages and publisher websites. It does not scrape RSS articles, store headlines or article text, show publisher photographs or reproduce articles.
- JMB Radio lists station metadata and directory-listed HTTPS station websites. It does not play, relay, cache or retransmit station audio.
- JMB World News lists publisher websites, official video-channel pages and podcast pages. It does not fetch news stories, copy headlines or summaries, embed videos, display thumbnails or play podcast audio.
- Third-party names and trademarks are used only to identify the website or service being linked. Their owners retain all rights. A directory entry is not an endorsement or a guarantee that the destination is free, available or authorised for every viewer.
- JMB does not bypass paywalls, subscriptions, DRM, authentication, access controls or geographic restrictions.

The site's detailed policy and removal-request process are in [Copyright, Content & Privacy](https://media.jmbhost.qzz.io/legal/).

## Data providers and attribution

- **TV channel metadata:** [IPTV-org API](https://github.com/iptv-org/api). JMB reads the channel database fields and blocklist, and only uses HTTPS website addresses. JMB does not read the stream endpoint list. The API repository publishes an Unlicense; this does not grant rights to broadcaster programmes, brands or linked websites.
- **Radio station metadata:** [Radio Browser](https://www.radio-browser.info/) and its [API documentation](https://api.radio-browser.info/). JMB uses descriptive directory fields only; it does not use station stream addresses.
- **Newspapers and news sources:** the pages contain manually curated publisher/channel names and links to their own sites. JMB does not scrape or republish their editorial content.

Third-party services may receive ordinary network request information when the browser loads directory data or opens a link. See the [privacy section](https://media.jmbhost.qzz.io/legal/#privacy).

## Retired media proxy — important deployment step

The previous JMB TV version used a Cloudflare Worker to proxy third-party TV streams. That approach has been retired. The repository's `cors-proxy-worker.js` now contains a **disabled** Worker which does not fetch, relay, rewrite or stream any URL.

**GitHub cannot update an already-deployed Cloudflare Worker.** To retire the old deployed copy:

1. Open Cloudflare Dashboard → **Workers & Pages**.
2. Open the existing Worker named `jb-proxy` (the old URL was `jb-proxy.johanbiju15.workers.dev`).
3. Choose **Edit code**.
4. Replace the entire Worker code with the current `cors-proxy-worker.js` from this repository.
5. Select **Deploy**.
6. The `?ping=1` endpoint should return JSON with `"status":"disabled"`; other proxy requests should return HTTP 410.

Do not leave the old proxy deployed. JMB's current website does not require it.

## Privacy and local storage

There are no JMB user accounts, payment forms, visitor-posting features, ad trackers or analytics scripts configured. Theme preference and radio favourites may be kept in local browser storage; service workers cache the site's own app shell for offline navigation. JMB does not receive these local preferences as a user profile.

## Quality checks

GitHub Actions runs `scripts/check-site.mjs` on updates. It checks HTML metadata, duplicate IDs, local assets, JavaScript syntax, Cloudflare Worker syntax, PWA manifests, CSS block balance and the custom-domain file.

## Deployment

The site is a static HTML/CSS/JavaScript project hosted with GitHub Pages from the `main` branch and repository root. Cloudflare is used only for DNS/domain routing; no media proxy is required.

## Project structure

    /
    ├── index.html
    ├── assets/
    │   ├── branding/              # Original JMB TV logo and link-preview artwork
    │   ├── css/                   # Shared, theme, premium and legal styles
    │   └── js/common.js           # Navigation, theme and sharing
    ├── favicon/                  # App icons and web manifests
    ├── tv/                       # Channel metadata directory
    ├── newspaper/                # Publisher website directory
    ├── radio/                    # Radio station metadata directory
    ├── social/                   # Publisher, video-channel and podcast links
    ├── legal/                    # Copyright, content and privacy policy
    ├── cors-proxy-worker.js      # Retired worker; redeploy to disable old copy
    ├── sw.js                     # Whole-hub offline app shell
    └── scripts/check-site.mjs    # Static quality checks

## Responsible future changes

Before adding a new stream, article, image, logo, video, music track, audio feed, iframe or downloadable file, obtain and record permission or a licence that explicitly allows the intended use. Do not assume that a URL being public means it can be embedded, copied, cached, retransmitted or monetised. When permission is unclear, link to the original source instead.
