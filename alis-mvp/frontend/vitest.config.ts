import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// 测试配置。S2 评分内核测试跑纯 Node；S4 组件测试在文件头用
//   // @vitest-environment jsdom
// 单独切 jsdom，全局默认仍是 node（不拖慢内核测试、不改 S2 行为）。
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
