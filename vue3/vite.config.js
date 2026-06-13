import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 8002,
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
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // 拆分大体积第三方库为独立缓存分块,减小主包并提升缓存命中
        manualChunks: {
          echarts: ["echarts"],
          "element-plus": ["element-plus", "@element-plus/icons-vue"],
          "vue-vendor": ["vue", "vue-router", "pinia"],
          xterm: ["xterm", "xterm-addon-fit", "xterm-addon-search", "xterm-addon-web-links"],
        },
      },
    },
  },
});
