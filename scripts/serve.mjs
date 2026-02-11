import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

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
  const decoded = decodeURIComponent(urlPath);
  const normalizedInput = decoded.startsWith("/web/") ? decoded.replace("/web/", "/") : decoded;
  const cleanPath = normalize(normalizedInput).replace(/^\.\.+/, "");
  let target = join(root, cleanPath === "/" ? "index.html" : cleanPath.slice(1));

  if (existsSync(target) && statSync(target).isDirectory()) {
    target = join(target, "index.html");
  }

  if (!existsSync(target) && !extname(target)) {
    const htmlCandidate = `${target}.html`;
    if (existsSync(htmlCandidate)) target = htmlCandidate;
  }

  return target;
}

const server = createServer((req, res) => {
  const target = resolvePath(req.url || "/");

  if (!existsSync(target)) {
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
