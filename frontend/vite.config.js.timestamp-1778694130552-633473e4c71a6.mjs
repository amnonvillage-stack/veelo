// vite.config.js
import { defineConfig } from "file:///sessions/optimistic-serene-mayer/mnt/veelo/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/optimistic-serene-mayer/mnt/veelo/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
var __vite_injected_original_import_meta_url = "file:///sessions/optimistic-serene-mayer/mnt/veelo/frontend/vite.config.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
var SHARED_ASSETS_DIR = path.resolve(__dirname, "../assets");
var MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};
function sharedAssets() {
  let outDir = path.resolve(__dirname, "dist");
  return {
    name: "vicky-shared-assets",
    // Capture the resolved output directory so closeBundle can use it.
    configResolved(config) {
      outDir = config.build.outDir ? path.resolve(config.root, config.build.outDir) : path.resolve(__dirname, "dist");
    },
    // Dev server: serve ../assets at /assets/ URL without copying files.
    configureServer(server) {
      server.middlewares.use("/assets", (req, res, next) => {
        try {
          const url = decodeURIComponent((req.url || "").split("?")[0]);
          const requested = path.normalize(path.join(SHARED_ASSETS_DIR, url));
          if (!requested.startsWith(SHARED_ASSETS_DIR + path.sep) && requested !== SHARED_ASSETS_DIR) {
            res.statusCode = 403;
            return res.end("Forbidden");
          }
          fs.stat(requested, (err, stat) => {
            if (err || !stat.isFile()) return next();
            const ext = path.extname(requested).toLowerCase();
            if (MIME[ext]) res.setHeader("Content-Type", MIME[ext]);
            res.setHeader("Cache-Control", "public, max-age=3600");
            fs.createReadStream(requested).pipe(res);
          });
        } catch {
          next();
        }
      });
    },
    // Production build: copy ../assets → <outDir>/assets/ so /assets/* URLs
    // resolve on Netlify (and any static host) exactly as they do in dev.
    closeBundle() {
      const destDir = path.join(outDir, "assets");
      try {
        fs.cpSync(SHARED_ASSETS_DIR, destDir, { recursive: true });
        console.log(`[vicky-shared-assets] Copied ../assets \u2192 ${destDir}`);
      } catch (e) {
        console.warn("[vicky-shared-assets] Asset copy failed:", e.message);
      }
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [react(), sharedAssets()],
  server: {
    proxy: {
      "/analyze": "http://localhost:8000",
      "/generate": "http://localhost:8000",
      "/catalog": "http://localhost:8000",
      // covers /catalog/swatches/* too
      "/saves": "http://localhost:8000",
      "/status": "http://localhost:8000"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvb3B0aW1pc3RpYy1zZXJlbmUtbWF5ZXIvbW50L3ZlZWxvL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvb3B0aW1pc3RpYy1zZXJlbmUtbWF5ZXIvbW50L3ZlZWxvL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9vcHRpbWlzdGljLXNlcmVuZS1tYXllci9tbnQvdmVlbG8vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybClcbmNvbnN0IF9fZGlybmFtZSAgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSlcblxuLy8gUGhvdG9ncmFwaHMgYW5kIG90aGVyIHNoYXJlZCBtZWRpYSBsaXZlIG9uZSBsZXZlbCBhYm92ZSB0aGUgZnJvbnRlbmQgYXRcbi8vIHJlcG8tcm9vdCAvYXNzZXRzLy4gV2UgbW91bnQgdGhhdCBmb2xkZXIgYXQgdGhlIC9hc3NldHMvIFVSTCBzbzpcbi8vICAgLSB0aGUgbWFya2V0aW5nIHNpdGUgY2FuIHJlZmVyZW5jZSAvYXNzZXRzL3NpdGUvaGVyby8qIGRpcmVjdGx5LCBhbmRcbi8vICAgLSBWaWNreSdzIHJlYWwgcGhvdG9ncmFwaHMgYXBwZWFyIGltbWVkaWF0ZWx5IHdoZW4gZHJvcHBlZCBvbiBkaXNrIFx1MjAxNFxuLy8gICAgIG5vIHJlYnVpbGQsIG5vIGNvZGUgY2hhbmdlLlxuLy9cbi8vIFZlZWxvJ3MgcnVudGltZSBpbWFnZXMgY29tZSBmcm9tIHRoZSBGYXN0QVBJIGJhY2tlbmQgKHByb3hpZWQgYmVsb3cpIGFuZFxuLy8gYXJlIHVuYWZmZWN0ZWQgYnkgdGhpcyBtb3VudC5cbmNvbnN0IFNIQVJFRF9BU1NFVFNfRElSID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL2Fzc2V0cycpXG5cbmNvbnN0IE1JTUUgPSB7XG4gICcuanBnJzogICdpbWFnZS9qcGVnJyxcbiAgJy5qcGVnJzogJ2ltYWdlL2pwZWcnLFxuICAnLnBuZyc6ICAnaW1hZ2UvcG5nJyxcbiAgJy53ZWJwJzogJ2ltYWdlL3dlYnAnLFxuICAnLmF2aWYnOiAnaW1hZ2UvYXZpZicsXG4gICcuZ2lmJzogICdpbWFnZS9naWYnLFxuICAnLnN2Zyc6ICAnaW1hZ2Uvc3ZnK3htbCcsXG59XG5cbmZ1bmN0aW9uIHNoYXJlZEFzc2V0cygpIHtcbiAgbGV0IG91dERpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdkaXN0JykgLy8gb3ZlcnJpZGRlbiBieSBjb25maWdSZXNvbHZlZFxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3ZpY2t5LXNoYXJlZC1hc3NldHMnLFxuXG4gICAgLy8gQ2FwdHVyZSB0aGUgcmVzb2x2ZWQgb3V0cHV0IGRpcmVjdG9yeSBzbyBjbG9zZUJ1bmRsZSBjYW4gdXNlIGl0LlxuICAgIGNvbmZpZ1Jlc29sdmVkKGNvbmZpZykge1xuICAgICAgb3V0RGlyID0gY29uZmlnLmJ1aWxkLm91dERpclxuICAgICAgICA/IHBhdGgucmVzb2x2ZShjb25maWcucm9vdCwgY29uZmlnLmJ1aWxkLm91dERpcilcbiAgICAgICAgOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZGlzdCcpXG4gICAgfSxcblxuICAgIC8vIERldiBzZXJ2ZXI6IHNlcnZlIC4uL2Fzc2V0cyBhdCAvYXNzZXRzLyBVUkwgd2l0aG91dCBjb3B5aW5nIGZpbGVzLlxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hc3NldHMnLCAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB1cmwgPSBkZWNvZGVVUklDb21wb25lbnQoKHJlcS51cmwgfHwgJycpLnNwbGl0KCc/JylbMF0pXG4gICAgICAgICAgLy8gRGVmZW5jZTogYmxvY2sgdHJhdmVyc2FsLiBwYXRoLmpvaW4gKyBub3JtYWxpemUgKyBwcmVmaXgtY2hlY2suXG4gICAgICAgICAgY29uc3QgcmVxdWVzdGVkID0gcGF0aC5ub3JtYWxpemUocGF0aC5qb2luKFNIQVJFRF9BU1NFVFNfRElSLCB1cmwpKVxuICAgICAgICAgIGlmICghcmVxdWVzdGVkLnN0YXJ0c1dpdGgoU0hBUkVEX0FTU0VUU19ESVIgKyBwYXRoLnNlcCkgJiYgcmVxdWVzdGVkICE9PSBTSEFSRURfQVNTRVRTX0RJUikge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDNcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKCdGb3JiaWRkZW4nKVxuICAgICAgICAgIH1cbiAgICAgICAgICBmcy5zdGF0KHJlcXVlc3RlZCwgKGVyciwgc3RhdCkgPT4ge1xuICAgICAgICAgICAgaWYgKGVyciB8fCAhc3RhdC5pc0ZpbGUoKSkgcmV0dXJuIG5leHQoKVxuICAgICAgICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKHJlcXVlc3RlZCkudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgaWYgKE1JTUVbZXh0XSkgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgTUlNRVtleHRdKVxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsICdwdWJsaWMsIG1heC1hZ2U9MzYwMCcpXG4gICAgICAgICAgICBmcy5jcmVhdGVSZWFkU3RyZWFtKHJlcXVlc3RlZCkucGlwZShyZXMpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcblxuICAgIC8vIFByb2R1Y3Rpb24gYnVpbGQ6IGNvcHkgLi4vYXNzZXRzIFx1MjE5MiA8b3V0RGlyPi9hc3NldHMvIHNvIC9hc3NldHMvKiBVUkxzXG4gICAgLy8gcmVzb2x2ZSBvbiBOZXRsaWZ5IChhbmQgYW55IHN0YXRpYyBob3N0KSBleGFjdGx5IGFzIHRoZXkgZG8gaW4gZGV2LlxuICAgIGNsb3NlQnVuZGxlKCkge1xuICAgICAgY29uc3QgZGVzdERpciA9IHBhdGguam9pbihvdXREaXIsICdhc3NldHMnKVxuICAgICAgdHJ5IHtcbiAgICAgICAgZnMuY3BTeW5jKFNIQVJFRF9BU1NFVFNfRElSLCBkZXN0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxuICAgICAgICBjb25zb2xlLmxvZyhgW3ZpY2t5LXNoYXJlZC1hc3NldHNdIENvcGllZCAuLi9hc3NldHMgXHUyMTkyICR7ZGVzdERpcn1gKVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1t2aWNreS1zaGFyZWQtYXNzZXRzXSBBc3NldCBjb3B5IGZhaWxlZDonLCBlLm1lc3NhZ2UpXG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgc2hhcmVkQXNzZXRzKCldLFxuICBzZXJ2ZXI6IHtcbiAgICBwcm94eToge1xuICAgICAgJy9hbmFseXplJzogICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgICAgJy9nZW5lcmF0ZSc6ICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgICAgJy9jYXRhbG9nJzogICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLCAgIC8vIGNvdmVycyAvY2F0YWxvZy9zd2F0Y2hlcy8qIHRvb1xuICAgICAgJy9zYXZlcyc6ICAgICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgICAgJy9zdGF0dXMnOiAgICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFUsU0FBUyxvQkFBb0I7QUFDM1csT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixTQUFTLHFCQUFxQjtBQUprTCxJQUFNLDJDQUEyQztBQU1qUSxJQUFNLGFBQWEsY0FBYyx3Q0FBZTtBQUNoRCxJQUFNLFlBQWEsS0FBSyxRQUFRLFVBQVU7QUFVMUMsSUFBTSxvQkFBb0IsS0FBSyxRQUFRLFdBQVcsV0FBVztBQUU3RCxJQUFNLE9BQU87QUFBQSxFQUNYLFFBQVM7QUFBQSxFQUNULFNBQVM7QUFBQSxFQUNULFFBQVM7QUFBQSxFQUNULFNBQVM7QUFBQSxFQUNULFNBQVM7QUFBQSxFQUNULFFBQVM7QUFBQSxFQUNULFFBQVM7QUFDWDtBQUVBLFNBQVMsZUFBZTtBQUN0QixNQUFJLFNBQVMsS0FBSyxRQUFRLFdBQVcsTUFBTTtBQUUzQyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUE7QUFBQSxJQUdOLGVBQWUsUUFBUTtBQUNyQixlQUFTLE9BQU8sTUFBTSxTQUNsQixLQUFLLFFBQVEsT0FBTyxNQUFNLE9BQU8sTUFBTSxNQUFNLElBQzdDLEtBQUssUUFBUSxXQUFXLE1BQU07QUFBQSxJQUNwQztBQUFBO0FBQUEsSUFHQSxnQkFBZ0IsUUFBUTtBQUN0QixhQUFPLFlBQVksSUFBSSxXQUFXLENBQUMsS0FBSyxLQUFLLFNBQVM7QUFDcEQsWUFBSTtBQUNGLGdCQUFNLE1BQU0sb0JBQW9CLElBQUksT0FBTyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztBQUU1RCxnQkFBTSxZQUFZLEtBQUssVUFBVSxLQUFLLEtBQUssbUJBQW1CLEdBQUcsQ0FBQztBQUNsRSxjQUFJLENBQUMsVUFBVSxXQUFXLG9CQUFvQixLQUFLLEdBQUcsS0FBSyxjQUFjLG1CQUFtQjtBQUMxRixnQkFBSSxhQUFhO0FBQ2pCLG1CQUFPLElBQUksSUFBSSxXQUFXO0FBQUEsVUFDNUI7QUFDQSxhQUFHLEtBQUssV0FBVyxDQUFDLEtBQUssU0FBUztBQUNoQyxnQkFBSSxPQUFPLENBQUMsS0FBSyxPQUFPLEVBQUcsUUFBTyxLQUFLO0FBQ3ZDLGtCQUFNLE1BQU0sS0FBSyxRQUFRLFNBQVMsRUFBRSxZQUFZO0FBQ2hELGdCQUFJLEtBQUssR0FBRyxFQUFHLEtBQUksVUFBVSxnQkFBZ0IsS0FBSyxHQUFHLENBQUM7QUFDdEQsZ0JBQUksVUFBVSxpQkFBaUIsc0JBQXNCO0FBQ3JELGVBQUcsaUJBQWlCLFNBQVMsRUFBRSxLQUFLLEdBQUc7QUFBQSxVQUN6QyxDQUFDO0FBQUEsUUFDSCxRQUFRO0FBQ04sZUFBSztBQUFBLFFBQ1A7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUE7QUFBQTtBQUFBLElBSUEsY0FBYztBQUNaLFlBQU0sVUFBVSxLQUFLLEtBQUssUUFBUSxRQUFRO0FBQzFDLFVBQUk7QUFDRixXQUFHLE9BQU8sbUJBQW1CLFNBQVMsRUFBRSxXQUFXLEtBQUssQ0FBQztBQUN6RCxnQkFBUSxJQUFJLGlEQUE0QyxPQUFPLEVBQUU7QUFBQSxNQUNuRSxTQUFTLEdBQUc7QUFDVixnQkFBUSxLQUFLLDRDQUE0QyxFQUFFLE9BQU87QUFBQSxNQUNwRTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQztBQUFBLEVBQ2pDLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFlBQWE7QUFBQSxNQUNiLGFBQWE7QUFBQSxNQUNiLFlBQWE7QUFBQTtBQUFBLE1BQ2IsVUFBYTtBQUFBLE1BQ2IsV0FBYTtBQUFBLElBQ2Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
