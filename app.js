import { createServer } from "http";
import { lstat, readdir, readFile } from "fs";
import { join, extname } from "path";

const port = 3000;
const currentPath = new URL("./source", import.meta.url).pathname;
const server = createServer(requestHandler);
const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

async function requestHandler(request, response) {
  const requestPath = join(currentPath, request.url);
  const mimeType = mimeTypes[extname(requestPath)];
  if(mimeType) response.writeHead(200, { "Content-type": mimeType });
  const pathItem = await loadPath(requestPath);
  response.end(pathItem);	
}

async function loadPath(path) {
  return new Promise((resolve) => {
    lstat(path, async (error, stats) => {
      if(error) return resolve(error.toString());
      if(stats.isDirectory()) {
        const directory = await directoryRead(path);
        resolve(directory);
      }else {
        const file = await fileRead(path);
        resolve(file);
      }
    });
  });
} 

function fileRead(path) {
  return new Promise((resolve) => {
    readFile(path, "utf-8", (error, data) => {
      if(error) return resolve(error.toString());
      resolve(data);
    });
  });
}

function directoryRead(path) {
  return new Promise((resolve) => {
    readdir(path, (error, items) => {
      if(error) return resolve(error.toString());
      resolve(items.join("\n"));
    });
  });
}

server.listen(port, () => console.log(`Server running on http://localhost:${port}`));
