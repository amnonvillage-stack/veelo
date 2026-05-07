// vite.config.js
import { defineConfig } from "file:///sessions/confident-pensive-brahmagupta/mnt/veelo/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/confident-pensive-brahmagupta/mnt/veelo/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvY29uZmlkZW50LXBlbnNpdmUtYnJhaG1hZ3VwdGEvbW50L3ZlZWxvL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvY29uZmlkZW50LXBlbnNpdmUtYnJhaG1hZ3VwdGEvbW50L3ZlZWxvL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9jb25maWRlbnQtcGVuc2l2ZS1icmFobWFndXB0YS9tbnQvdmVlbG8vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAnL2FuYWx5emUnOiAgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAnL2dlbmVyYXRlJzogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAnL2NhdGFsb2cnOiAgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsICAgLy8gY292ZXJzIC9jYXRhbG9nL3N3YXRjaGVzLyogdG9vXG4gICAgICAnL3N0YXR1cyc6ICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgfVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnVyxTQUFTLG9CQUFvQjtBQUM3WCxPQUFPLFdBQVc7QUFFbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFlBQWE7QUFBQSxNQUNiLGFBQWE7QUFBQSxNQUNiLFlBQWE7QUFBQTtBQUFBLE1BQ2IsV0FBYTtBQUFBLElBQ2Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
