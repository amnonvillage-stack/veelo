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
  return {
    name: "vicky-shared-assets",
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
    // Production build: copy ../assets → dist/assets/ so /assets/* URLs resolve
    // on Netlify (and any static host) exactly as they do in the dev server.
    closeBundle() {
      const destDir = path.resolve(__dirname, "dist/assets");
      try {
        fs.cpSync(SHARED_ASSETS_DIR, destDir, { recursive: true });
        console.log("[vicky-shared-assets] Copied ../assets \u2192 dist/assets/");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvb3B0aW1pc3RpYy1zZXJlbmUtbWF5ZXIvbW50L3ZlZWxvL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvb3B0aW1pc3RpYy1zZXJlbmUtbWF5ZXIvbW50L3ZlZWxvL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9vcHRpbWlzdGljLXNlcmVuZS1tYXllci9tbnQvdmVlbG8vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybClcbmNvbnN0IF9fZGlybmFtZSAgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSlcblxuLy8gUGhvdG9ncmFwaHMgYW5kIG90aGVyIHNoYXJlZCBtZWRpYSBsaXZlIG9uZSBsZXZlbCBhYm92ZSB0aGUgZnJvbnRlbmQgYXRcbi8vIHJlcG8tcm9vdCAvYXNzZXRzLy4gV2UgbW91bnQgdGhhdCBmb2xkZXIgYXQgdGhlIC9hc3NldHMvIFVSTCBzbzpcbi8vICAgLSB0aGUgbWFya2V0aW5nIHNpdGUgY2FuIHJlZmVyZW5jZSAvYXNzZXRzL3NpdGUvaGVyby8qIGRpcmVjdGx5LCBhbmRcbi8vICAgLSBWaWNreSdzIHJlYWwgcGhvdG9ncmFwaHMgYXBwZWFyIGltbWVkaWF0ZWx5IHdoZW4gZHJvcHBlZCBvbiBkaXNrIFx1MjAxNFxuLy8gICAgIG5vIHJlYnVpbGQsIG5vIGNvZGUgY2hhbmdlLlxuLy9cbi8vIFZlZWxvJ3MgcnVudGltZSBpbWFnZXMgY29tZSBmcm9tIHRoZSBGYXN0QVBJIGJhY2tlbmQgKHByb3hpZWQgYmVsb3cpIGFuZFxuLy8gYXJlIHVuYWZmZWN0ZWQgYnkgdGhpcyBtb3VudC5cbmNvbnN0IFNIQVJFRF9BU1NFVFNfRElSID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL2Fzc2V0cycpXG5cbmNvbnN0IE1JTUUgPSB7XG4gICcuanBnJzogICdpbWFnZS9qcGVnJyxcbiAgJy5qcGVnJzogJ2ltYWdlL2pwZWcnLFxuICAnLnBuZyc6ICAnaW1hZ2UvcG5nJyxcbiAgJy53ZWJwJzogJ2ltYWdlL3dlYnAnLFxuICAnLmF2aWYnOiAnaW1hZ2UvYXZpZicsXG4gICcuZ2lmJzogICdpbWFnZS9naWYnLFxuICAnLnN2Zyc6ICAnaW1hZ2Uvc3ZnK3htbCcsXG59XG5cbmZ1bmN0aW9uIHNoYXJlZEFzc2V0cygpIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndmlja3ktc2hhcmVkLWFzc2V0cycsXG5cbiAgICAvLyBEZXYgc2VydmVyOiBzZXJ2ZSAuLi9hc3NldHMgYXQgL2Fzc2V0cy8gVVJMIHdpdGhvdXQgY29weWluZyBmaWxlcy5cbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXNzZXRzJywgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgdXJsID0gZGVjb2RlVVJJQ29tcG9uZW50KChyZXEudXJsIHx8ICcnKS5zcGxpdCgnPycpWzBdKVxuICAgICAgICAgIC8vIERlZmVuY2U6IGJsb2NrIHRyYXZlcnNhbC4gcGF0aC5qb2luICsgbm9ybWFsaXplICsgcHJlZml4LWNoZWNrLlxuICAgICAgICAgIGNvbnN0IHJlcXVlc3RlZCA9IHBhdGgubm9ybWFsaXplKHBhdGguam9pbihTSEFSRURfQVNTRVRTX0RJUiwgdXJsKSlcbiAgICAgICAgICBpZiAoIXJlcXVlc3RlZC5zdGFydHNXaXRoKFNIQVJFRF9BU1NFVFNfRElSICsgcGF0aC5zZXApICYmIHJlcXVlc3RlZCAhPT0gU0hBUkVEX0FTU0VUU19ESVIpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAzXG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZCgnRm9yYmlkZGVuJylcbiAgICAgICAgICB9XG4gICAgICAgICAgZnMuc3RhdChyZXF1ZXN0ZWQsIChlcnIsIHN0YXQpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIgfHwgIXN0YXQuaXNGaWxlKCkpIHJldHVybiBuZXh0KClcbiAgICAgICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShyZXF1ZXN0ZWQpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgIGlmIChNSU1FW2V4dF0pIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIE1JTUVbZXh0XSlcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NhY2hlLUNvbnRyb2wnLCAncHVibGljLCBtYXgtYWdlPTM2MDAnKVxuICAgICAgICAgICAgZnMuY3JlYXRlUmVhZFN0cmVhbShyZXF1ZXN0ZWQpLnBpcGUocmVzKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIG5leHQoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG5cbiAgICAvLyBQcm9kdWN0aW9uIGJ1aWxkOiBjb3B5IC4uL2Fzc2V0cyBcdTIxOTIgZGlzdC9hc3NldHMvIHNvIC9hc3NldHMvKiBVUkxzIHJlc29sdmVcbiAgICAvLyBvbiBOZXRsaWZ5IChhbmQgYW55IHN0YXRpYyBob3N0KSBleGFjdGx5IGFzIHRoZXkgZG8gaW4gdGhlIGRldiBzZXJ2ZXIuXG4gICAgY2xvc2VCdW5kbGUoKSB7XG4gICAgICBjb25zdCBkZXN0RGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2Rpc3QvYXNzZXRzJylcbiAgICAgIHRyeSB7XG4gICAgICAgIGZzLmNwU3luYyhTSEFSRURfQVNTRVRTX0RJUiwgZGVzdERpciwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgICAgICAgY29uc29sZS5sb2coJ1t2aWNreS1zaGFyZWQtYXNzZXRzXSBDb3BpZWQgLi4vYXNzZXRzIFx1MjE5MiBkaXN0L2Fzc2V0cy8nKVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1t2aWNreS1zaGFyZWQtYXNzZXRzXSBBc3NldCBjb3B5IGZhaWxlZDonLCBlLm1lc3NhZ2UpXG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgc2hhcmVkQXNzZXRzKCldLFxuICBzZXJ2ZXI6IHtcbiAgICBwcm94eToge1xuICAgICAgJy9hbmFseXplJzogICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgICAgJy9nZW5lcmF0ZSc6ICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgICAgJy9jYXRhbG9nJzogICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLCAgIC8vIGNvdmVycyAvY2F0YWxvZy9zd2F0Y2hlcy8qIHRvb1xuICAgICAgJy9zYXZlcyc6ICAgICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgICAgJy9zdGF0dXMnOiAgICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFUsU0FBUyxvQkFBb0I7QUFDM1csT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixTQUFTLHFCQUFxQjtBQUprTCxJQUFNLDJDQUEyQztBQU1qUSxJQUFNLGFBQWEsY0FBYyx3Q0FBZTtBQUNoRCxJQUFNLFlBQWEsS0FBSyxRQUFRLFVBQVU7QUFVMUMsSUFBTSxvQkFBb0IsS0FBSyxRQUFRLFdBQVcsV0FBVztBQUU3RCxJQUFNLE9BQU87QUFBQSxFQUNYLFFBQVM7QUFBQSxFQUNULFNBQVM7QUFBQSxFQUNULFFBQVM7QUFBQSxFQUNULFNBQVM7QUFBQSxFQUNULFNBQVM7QUFBQSxFQUNULFFBQVM7QUFBQSxFQUNULFFBQVM7QUFDWDtBQUVBLFNBQVMsZUFBZTtBQUN0QixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUE7QUFBQSxJQUdOLGdCQUFnQixRQUFRO0FBQ3RCLGFBQU8sWUFBWSxJQUFJLFdBQVcsQ0FBQyxLQUFLLEtBQUssU0FBUztBQUNwRCxZQUFJO0FBQ0YsZ0JBQU0sTUFBTSxvQkFBb0IsSUFBSSxPQUFPLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBRTVELGdCQUFNLFlBQVksS0FBSyxVQUFVLEtBQUssS0FBSyxtQkFBbUIsR0FBRyxDQUFDO0FBQ2xFLGNBQUksQ0FBQyxVQUFVLFdBQVcsb0JBQW9CLEtBQUssR0FBRyxLQUFLLGNBQWMsbUJBQW1CO0FBQzFGLGdCQUFJLGFBQWE7QUFDakIsbUJBQU8sSUFBSSxJQUFJLFdBQVc7QUFBQSxVQUM1QjtBQUNBLGFBQUcsS0FBSyxXQUFXLENBQUMsS0FBSyxTQUFTO0FBQ2hDLGdCQUFJLE9BQU8sQ0FBQyxLQUFLLE9BQU8sRUFBRyxRQUFPLEtBQUs7QUFDdkMsa0JBQU0sTUFBTSxLQUFLLFFBQVEsU0FBUyxFQUFFLFlBQVk7QUFDaEQsZ0JBQUksS0FBSyxHQUFHLEVBQUcsS0FBSSxVQUFVLGdCQUFnQixLQUFLLEdBQUcsQ0FBQztBQUN0RCxnQkFBSSxVQUFVLGlCQUFpQixzQkFBc0I7QUFDckQsZUFBRyxpQkFBaUIsU0FBUyxFQUFFLEtBQUssR0FBRztBQUFBLFVBQ3pDLENBQUM7QUFBQSxRQUNILFFBQVE7QUFDTixlQUFLO0FBQUEsUUFDUDtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQTtBQUFBO0FBQUEsSUFJQSxjQUFjO0FBQ1osWUFBTSxVQUFVLEtBQUssUUFBUSxXQUFXLGFBQWE7QUFDckQsVUFBSTtBQUNGLFdBQUcsT0FBTyxtQkFBbUIsU0FBUyxFQUFFLFdBQVcsS0FBSyxDQUFDO0FBQ3pELGdCQUFRLElBQUksNERBQXVEO0FBQUEsTUFDckUsU0FBUyxHQUFHO0FBQ1YsZ0JBQVEsS0FBSyw0Q0FBNEMsRUFBRSxPQUFPO0FBQUEsTUFDcEU7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUM7QUFBQSxFQUNqQyxRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxZQUFhO0FBQUEsTUFDYixhQUFhO0FBQUEsTUFDYixZQUFhO0FBQUE7QUFBQSxNQUNiLFVBQWE7QUFBQSxNQUNiLFdBQWE7QUFBQSxJQUNmO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
