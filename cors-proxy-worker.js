// JMB MEDIA — retired media proxy.
// This worker intentionally does not fetch, relay, rewrite or stream third-party media.
// Deploy this file to the existing Cloudflare Worker to retire the former proxy endpoint.
const ALLOWED_ORIGIN = "https://media.jmbhost.qzz.io";
function response(body, status, origin) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  if (origin === ALLOWED_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return new Response(JSON.stringify(body), { status, headers });
}
export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    if (origin && origin !== ALLOWED_ORIGIN) {
      return response({ error: "Origin not allowed." }, 403, "");
    }
    if (request.method === "OPTIONS") {
      if (origin !== ALLOWED_ORIGIN) return response({ error: "Origin not allowed." }, 403, "");
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }
    const url = new URL(request.url);
    if (url.searchParams.get("ping") === "1") {
      return response({ status: "disabled", code: "JMB_MEDIA_PROXY_RETIRED" }, 200, origin);
    }
    return response({
      error: "Media proxy retired.",
      message: "JMB TV now links to broadcaster websites and does not relay third-party broadcasts."
    }, 410, origin);
  }
};
