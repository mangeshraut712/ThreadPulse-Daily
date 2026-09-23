import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const root = process.cwd();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function resolvePath(urlPath) {
  let decoded = "/";
  try {
    decoded = decodeURIComponent(String(urlPath || "/").split("?")[0]);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  const withoutWeb = decoded.startsWith("/web/") ? `/${decoded.slice(5)}` : decoded;
  const relative = withoutWeb.replace(/^\/+/, "");
  const rootResolved = resolve(root);
  let target = resolve(rootResolved, relative === "" ? "index.html" : relative);
  if (target !== rootResolved && !target.startsWith(rootResolved + sep)) return null;

  if (existsSync(target) && statSync(target).isDirectory()) {
    const indexed = join(target, "index.html");
    if (indexed !== rootResolved && !indexed.startsWith(rootResolved + sep)) return null;
    target = indexed;
  } else if (!existsSync(target) && !extname(target)) {
    const htmlCandidate = `${target}.html`;
    if (
      (htmlCandidate === rootResolved || htmlCandidate.startsWith(rootResolved + sep)) &&
      existsSync(htmlCandidate)
    ) {
      target = htmlCandidate;
    }
  }

  if (target !== rootResolved && !target.startsWith(rootResolved + sep)) return null;
  return target;
}

const server = createServer((req, res) => {
  const target = resolvePath(req.url || "/");
  const rootResolved = resolve(root);
  if (
    !target ||
    (target !== rootResolved && !target.startsWith(rootResolved + sep)) ||
    !existsSync(target)
  ) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const ext = extname(target);
  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
  createReadStream(target).pipe(res);
});

server.on("error", (err) => {
  if (err && err.code === "EPERM") {
    console.error("Unable to bind local port in this sandbox environment.");
    process.exitCode = 1;
    return;
  }
  throw err;
});

server.listen(port, host, () => {
  console.log(`ThreadPulse web demo available at http://${host}:${port}/`);
});
