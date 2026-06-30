import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT ?? 8080);
const root = join(fileURLToPath(new URL(".", import.meta.url)), "dist");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function assetPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return join(root, normalized);
}

createServer((request, response) => {
  const requestedPath = assetPath(request.url ?? "/");
  const filePath = existsSync(requestedPath) && statSync(requestedPath).isFile()
    ? requestedPath
    : join(root, "index.html");
  const extension = extname(filePath);

  response.setHeader("Content-Type", contentTypes[extension] ?? "application/octet-stream");
  if (filePath.includes(`${join(root, "assets")}`)) {
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }

  createReadStream(filePath)
    .on("error", () => {
      response.writeHead(500);
      response.end("Internal Server Error");
    })
    .pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`CivicConnect frontend listening on port ${port}`);
});
