const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 4173);
const root = __dirname;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

http.createServer((request, response) => {
  const urlPath = decodeURIComponent(request.url.split("?")[0]);
  const requested = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const filePath = path.resolve(root, requested);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      return response.end("Not found");
    }
    response.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
    response.end(data);
  });
}).listen(port, () => {
  console.log(`AffectSync is running at http://localhost:${port}`);
});
