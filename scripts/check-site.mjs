import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const failures = [];
const counts = { html: 0, javascript: 0, stylesheets: 0, localReferences: 0 };

function fail(message) { failures.push(message); }

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === ".git" || entry.name === "node_modules") return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function relative(file) { return path.relative(root, file).split(path.sep).join("/"); }

function resolveReference(fromFile, raw) {
  const value = raw.trim();
  if (!value || value.startsWith("#") || value.startsWith("//") ||
      /^(https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(value)) return null;

  let pathname = value.split(/[?#]/, 1)[0];
  try { pathname = decodeURIComponent(pathname); } catch {}
  if (!pathname) return null;

  let target = pathname.startsWith("/")
    ? path.resolve(root, "." + pathname)
    : path.resolve(path.dirname(fromFile), pathname);

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, "index.html");
  } else if (!path.extname(target) && !fs.existsSync(target) && fs.existsSync(path.join(target, "index.html"))) {
    target = path.join(target, "index.html");
  }
  return target;
}

function checkHtml(file) {
  const source = fs.readFileSync(file, "utf8");
  counts.html++;

  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(source)) fail(relative(file) + ": missing html language");
  if (!/<title>[^<]+<\/title>/i.test(source)) fail(relative(file) + ": missing page title");
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(source)) fail(relative(file) + ": missing viewport metadata");
  if (!/<meta\b[^>]*property=["']og:image["']/i.test(source)) fail(relative(file) + ": missing Open Graph preview image");
  if (!/<meta\b[^>]*name=["']twitter:card["']/i.test(source)) fail(relative(file) + ": missing Twitter card metadata");

  const markup = source.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");
  const seen = new Set();
  for (const match of markup.matchAll(/\bid=["']([^"']+)["']/gi)) {
    const id = match[1];
    if (seen.has(id)) fail(relative(file) + ': duplicate id="' + id + '"');
    seen.add(id);
  }

  const attributePattern = /<(?:a|link|script|img|source|video|audio)\b[^>]*?\b(?:href|src|poster)=["']([^"']+)["']/gi;
  for (const match of markup.matchAll(attributePattern)) {
    const target = resolveReference(file, match[1]);
    if (!target) continue;
    counts.localReferences++;
    if (!fs.existsSync(target)) fail(relative(file) + ": missing local asset " + match[1]);
  }

  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of source.matchAll(scriptPattern)) {
    const attrs = match[1];
    const body = match[2].trim();
    if (/\bsrc\s*=/.test(attrs) || !body) continue;
    if (/application\/ld\+json/i.test(attrs)) {
      try { JSON.parse(body); }
      catch (error) { fail(relative(file) + ": invalid JSON-LD (" + error.message + ")"); }
    } else {
      try { new vm.Script(body, { filename: relative(file) + " inline script" }); }
      catch (error) { fail(relative(file) + ": inline JavaScript syntax (" + error.message + ")"); }
    }
  }
}

const files = walk(root);
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".html") checkHtml(file);
  if (ext === ".js" && path.basename(file) !== "cors-proxy-worker.js") {
    counts.javascript++;
    try {
      new vm.Script(fs.readFileSync(file, "utf8"), { filename: relative(file) });
    } catch (error) {
      fail(relative(file) + ": JavaScript syntax (" + error.message + ")");
    }
  }
  if (ext === ".css") {
    counts.stylesheets++;
    const css = fs.readFileSync(file, "utf8");
    let depth = 0, minDepth = 0;
    for (const char of css) {
      if (char === "{") depth++;
      if (char === "}") depth--;
      minDepth = Math.min(minDepth, depth);
    }
    if (depth !== 0 || minDepth < 0) fail(relative(file) + ": unbalanced CSS blocks");
  }
}

const cname = path.join(root, "CNAME");
if (!fs.existsSync(cname) || fs.readFileSync(cname, "utf8").trim() !== "media.jmbhost.qzz.io") {
  fail("CNAME: expected media.jmbhost.qzz.io");
}
const shareImage = path.join(root, "assets/branding/jmb-tv-share.jpg");
if (!fs.existsSync(shareImage) || fs.statSync(shareImage).size < 30000) {
  fail("Missing or unexpectedly small JMB TV share-preview JPEG");
}

console.log("Checked " + counts.html + " HTML pages, " + counts.javascript +
  " JavaScript files, " + counts.stylesheets + " stylesheets and " +
  counts.localReferences + " local references.");
if (failures.length) {
  console.error("Found " + failures.length + " issue(s):");
  failures.forEach(message => console.error(" - " + message));
  process.exitCode = 1;
} else {
  console.log("JMB TV site quality checks passed.");
}
