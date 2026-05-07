// vite.config.js
import { defineConfig } from "file:///sessions/confident-pensive-brahmagupta/mnt/veelo/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/confident-pensive-brahmagupta/mnt/veelo/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
var __vite_injected_original_import_meta_url = "file:///sessions/confident-pensive-brahmagupta/mnt/veelo/frontend/vite.config.js";
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
      "/status": "http://localhost:8000"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvY29uZmlkZW50LXBlbnNpdmUtYnJhaG1hZ3VwdGEvbW50L3ZlZWxvL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvY29uZmlkZW50LXBlbnNpdmUtYnJhaG1hZ3VwdGEvbW50L3ZlZWxvL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9jb25maWRlbnQtcGVuc2l2ZS1icmFobWFndXB0YS9tbnQvdmVlbG8vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybClcbmNvbnN0IF9fZGlybmFtZSAgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSlcblxuLy8gUGhvdG9ncmFwaHMgYW5kIG90aGVyIHNoYXJlZCBtZWRpYSBsaXZlIG9uZSBsZXZlbCBhYm92ZSB0aGUgZnJvbnRlbmQgYXRcbi8vIHJlcG8tcm9vdCAvYXNzZXRzLy4gV2UgbW91bnQgdGhhdCBmb2xkZXIgYXQgdGhlIC9hc3NldHMvIFVSTCBzbzpcbi8vICAgLSB0aGUgbWFya2V0aW5nIHNpdGUgY2FuIHJlZmVyZW5jZSAvYXNzZXRzL3NpdGUvaGVyby8qIGRpcmVjdGx5LCBhbmRcbi8vICAgLSBWaWNreSdzIHJlYWwgcGhvdG9ncmFwaHMgYXBwZWFyIGltbWVkaWF0ZWx5IHdoZW4gZHJvcHBlZCBvbiBkaXNrIFx1MjAxNFxuLy8gICAgIG5vIHJlYnVpbGQsIG5vIGNvZGUgY2hhbmdlLlxuLy9cbi8vIFZlZWxvJ3MgcnVudGltZSBpbWFnZXMgY29tZSBmcm9tIHRoZSBGYXN0QVBJIGJhY2tlbmQgKHByb3hpZWQgYmVsb3cpIGFuZFxuLy8gYXJlIHVuYWZmZWN0ZWQgYnkgdGhpcyBtb3VudC5cbmNvbnN0IFNIQVJFRF9BU1NFVFNfRElSID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL2Fzc2V0cycpXG5cbmNvbnN0IE1JTUUgPSB7XG4gICcuanBnJzogICdpbWFnZS9qcGVnJyxcbiAgJy5qcGVnJzogJ2ltYWdlL2pwZWcnLFxuICAnLnBuZyc6ICAnaW1hZ2UvcG5nJyxcbiAgJy53ZWJwJzogJ2ltYWdlL3dlYnAnLFxuICAnLmF2aWYnOiAnaW1hZ2UvYXZpZicsXG4gICcuZ2lmJzogICdpbWFnZS9naWYnLFxuICAnLnN2Zyc6ICAnaW1hZ2Uvc3ZnK3htbCcsXG59XG5cbmZ1bmN0aW9uIHNoYXJlZEFzc2V0cygpIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndmlja3ktc2hhcmVkLWFzc2V0cycsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2Fzc2V0cycsIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHVybCA9IGRlY29kZVVSSUNvbXBvbmVudCgocmVxLnVybCB8fCAnJykuc3BsaXQoJz8nKVswXSlcbiAgICAgICAgICAvLyBEZWZlbmNlOiBibG9jayB0cmF2ZXJzYWwuIHBhdGguam9pbiArIG5vcm1hbGl6ZSArIHByZWZpeC1jaGVjay5cbiAgICAgICAgICBjb25zdCByZXF1ZXN0ZWQgPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4oU0hBUkVEX0FTU0VUU19ESVIsIHVybCkpXG4gICAgICAgICAgaWYgKCFyZXF1ZXN0ZWQuc3RhcnRzV2l0aChTSEFSRURfQVNTRVRTX0RJUiArIHBhdGguc2VwKSAmJiByZXF1ZXN0ZWQgIT09IFNIQVJFRF9BU1NFVFNfRElSKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwM1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoJ0ZvcmJpZGRlbicpXG4gICAgICAgICAgfVxuICAgICAgICAgIGZzLnN0YXQocmVxdWVzdGVkLCAoZXJyLCBzdGF0KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyIHx8ICFzdGF0LmlzRmlsZSgpKSByZXR1cm4gbmV4dCgpXG4gICAgICAgICAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUocmVxdWVzdGVkKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICBpZiAoTUlNRVtleHRdKSByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBNSU1FW2V4dF0pXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDYWNoZS1Db250cm9sJywgJ3B1YmxpYywgbWF4LWFnZT0zNjAwJylcbiAgICAgICAgICAgIGZzLmNyZWF0ZVJlYWRTdHJlYW0ocmVxdWVzdGVkKS5waXBlKHJlcylcbiAgICAgICAgICB9KVxuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9LFxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBzaGFyZWRBc3NldHMoKV0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAnL2FuYWx5emUnOiAgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAnL2dlbmVyYXRlJzogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAnL2NhdGFsb2cnOiAgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsICAgLy8gY292ZXJzIC9jYXRhbG9nL3N3YXRjaGVzLyogdG9vXG4gICAgICAnL3N0YXR1cyc6ICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgfVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnVyxTQUFTLG9CQUFvQjtBQUM3WCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sUUFBUTtBQUNmLFNBQVMscUJBQXFCO0FBSjhMLElBQU0sMkNBQTJDO0FBTTdRLElBQU0sYUFBYSxjQUFjLHdDQUFlO0FBQ2hELElBQU0sWUFBYSxLQUFLLFFBQVEsVUFBVTtBQVUxQyxJQUFNLG9CQUFvQixLQUFLLFFBQVEsV0FBVyxXQUFXO0FBRTdELElBQU0sT0FBTztBQUFBLEVBQ1gsUUFBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsUUFBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsUUFBUztBQUFBLEVBQ1QsUUFBUztBQUNYO0FBRUEsU0FBUyxlQUFlO0FBQ3RCLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGdCQUFnQixRQUFRO0FBQ3RCLGFBQU8sWUFBWSxJQUFJLFdBQVcsQ0FBQyxLQUFLLEtBQUssU0FBUztBQUNwRCxZQUFJO0FBQ0YsZ0JBQU0sTUFBTSxvQkFBb0IsSUFBSSxPQUFPLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBRTVELGdCQUFNLFlBQVksS0FBSyxVQUFVLEtBQUssS0FBSyxtQkFBbUIsR0FBRyxDQUFDO0FBQ2xFLGNBQUksQ0FBQyxVQUFVLFdBQVcsb0JBQW9CLEtBQUssR0FBRyxLQUFLLGNBQWMsbUJBQW1CO0FBQzFGLGdCQUFJLGFBQWE7QUFDakIsbUJBQU8sSUFBSSxJQUFJLFdBQVc7QUFBQSxVQUM1QjtBQUNBLGFBQUcsS0FBSyxXQUFXLENBQUMsS0FBSyxTQUFTO0FBQ2hDLGdCQUFJLE9BQU8sQ0FBQyxLQUFLLE9BQU8sRUFBRyxRQUFPLEtBQUs7QUFDdkMsa0JBQU0sTUFBTSxLQUFLLFFBQVEsU0FBUyxFQUFFLFlBQVk7QUFDaEQsZ0JBQUksS0FBSyxHQUFHLEVBQUcsS0FBSSxVQUFVLGdCQUFnQixLQUFLLEdBQUcsQ0FBQztBQUN0RCxnQkFBSSxVQUFVLGlCQUFpQixzQkFBc0I7QUFDckQsZUFBRyxpQkFBaUIsU0FBUyxFQUFFLEtBQUssR0FBRztBQUFBLFVBQ3pDLENBQUM7QUFBQSxRQUNILFFBQVE7QUFDTixlQUFLO0FBQUEsUUFDUDtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQztBQUFBLEVBQ2pDLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFlBQWE7QUFBQSxNQUNiLGFBQWE7QUFBQSxNQUNiLFlBQWE7QUFBQTtBQUFBLE1BQ2IsV0FBYTtBQUFBLElBQ2Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
