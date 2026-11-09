# JMB MEDIA

A mobile-first media discovery hub built as a static GitHub Pages website.

## Sections

- **JMB TV** — search and filter publicly listed TV channel metadata and public stream links. Streams are provided by third parties; JMB MEDIA does not host them.
- **Newspapers** — browse Malayalam, Indian and international newspaper sources and read their latest RSS headlines.
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
│   └── app.js
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
