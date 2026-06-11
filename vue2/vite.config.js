import { defineConfig } from "vite";
import vue2 from "@vitejs/plugin-vue2";
import path from "path";

export default defineConfig({
  plugins: [vue2()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 8001,
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
      "/sso": {
        target: process.env.VITE_PROXY_TARGET || "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
