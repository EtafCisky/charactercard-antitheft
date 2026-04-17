import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip 压缩插件
    viteCompression({
      verbose: true, // 输出压缩结果
      disable: false, // 不禁用压缩
      threshold: 10240, // 大于 10kb 的文件才压缩
      algorithm: "gzip", // 压缩算法
      ext: ".gz", // 压缩文件扩展名
    }),
    // Brotli 压缩（可选，更好的压缩率）
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: "brotliCompress",
      ext: ".br",
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // 生产构建优化
    minify: "terser", // 使用 terser 进行更好的压缩
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true, // 移除 debugger
      },
    },
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: {
          // React 核心库单独打包
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI 组件库单独打包（如果有的话）
          // 'ui-vendor': ['@mui/material', 'antd'],
        },
        // 静态资源命名
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
    // 分块大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生成 source map（可选，生产环境可以关闭）
    sourcemap: false,
    // 资源内联限制（小于 4kb 的资源会被内联为 base64）
    assetsInlineLimit: 4096,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "axios"],
  },
});
