# JMB MEDIA proxy deployment

JMB TV uses the same JMB Cloudflare Worker endpoint as the JB TV project:

`https://jb-proxy.johanbiju15.workers.dev/?url=`

The JMB MEDIA player tries a public stream directly first. If browser CORS prevents a compatible public HLS playlist from loading, it retries through this Worker. The Worker does not grant access to paid, logged-in, DRM-protected or region-restricted services.

## One-time Cloudflare update

The Worker file inside the uploaded JB TV ZIP only allows the old origin `https://tv.jbhub.ryzn.pro`. Do not deploy that older copy for JMB MEDIA.

1. Open Cloudflare Dashboard → **Workers & Pages**.
2. Open the existing Worker that serves `jb-proxy.johanbiju15.workers.dev`.
3. Choose **Edit code**.
4. Replace its code with the current repository file: [`cors-proxy-worker.js`](../cors-proxy-worker.js).
5. Confirm the `ALLOWED` array includes both `https://media.jmbhost.qzz.io` and `https://tv.jbhub.ryzn.pro`.
6. Select **Deploy**.

## Verify

Open JMB TV → Playback options → **Test JMB proxy**. A successful test reports that the Worker health check and public HLS playlist rewrite both passed.

If the Worker test passes but a particular channel still fails, the source may be offline or may not permit third-party browser playback. Use the broadcaster's official service or another public listing.
