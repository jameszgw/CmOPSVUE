import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icons/pwa-192.png", "icons/pwa-512.png"],
      manifest: {
        name: "统一监控平台",
        short_name: "监控",
        description: "网络拓扑与监控指标 · 移动端",
        theme_color: "#1677ff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/m/dashboard",
        icons: [
          { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/sso/, /^\/ws/],
        runtimeCaching: [
          { urlPattern: ({ url }) => url.pathname.startsWith("/api/"), handler: "NetworkOnly" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 8002,
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://192.168.0.152:8080",
        changeOrigin: true,
        ws: true,
      },
      "/sso": {
        target: process.env.VITE_PROXY_TARGET || "http://192.168.0.152:8080",
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
