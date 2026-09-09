import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// ALIS 采集前端（S4）。React + XState 评分机跑浏览器端，离线可用。
// 单一真源：题库/维度/伦理文案来自后端 content/question_pack_v2.1.yaml（?raw 打包）。
// 因 YAML 在 frontend 根之外（../backend），需放开 fs.allow 到仓库根。
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // 允许读取 alis-mvp 仓库根下文件（含 backend/content 的 YAML 真源）
      allow: [fileURLToPath(new URL("..", import.meta.url))],
    },
  },
});
