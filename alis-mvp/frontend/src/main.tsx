import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const el = document.getElementById("root");
if (!el) throw new Error("#root not found");
createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA Service Worker（点2）：仅在生产构建注册，避免干扰 vite 开发服务器（:5173）。
// 由后端同源托管的 dist 下 /sw.js 生效，实现"可安装 + 离线打开外壳"。
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 注册失败不影响正常使用（仍是普通网页）
    });
  });
}
