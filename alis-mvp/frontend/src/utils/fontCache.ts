// 中文字体缓存（v3.8 共享模块，v3.10 修复字体注册方式）。
// 问题：interviewPDF.ts 和 styleResultPDF.ts 各自独立 fetch SimHei.ttf（9.7MB）→ base64（~13MB），
// 两次导出 = 两次下载 + 两次 base64 转换，内存峰值 ~26MB，大字体异步延迟易触发弹窗拦截。
// 修复：全局单例缓存——首次加载后复用，预加载提前触发。
// 同时提供一个 blob-based download 作为 pdfmake download() 的兜底（浏览器弹窗拦截器更友好）。
//
// v3.10 字体注册修复（外围测试②实测根因）：
//   早期方式把字体转 data URL 字符串塞进 pdfMake.fonts —— pdfmake 0.3.11 的 PDFKit
//   对字体字符串走浏览器 fs polyfill 的 readFileSync → 抛 "File ... could not be found"，
//   所有 PDF 导出在浏览器必失败。
//   正确方式：pdfMake.addFontContainer({ vfs: { "SimHei.ttf": base64 }, fonts: {} })
//   + fonts 引用 VFS 文件名（测试代理②已对照验证可生成 3745B 中文 PDF）。

let fontDataUrlCache: string | null = null;
let fontLoadPromise: Promise<string> | null = null;
let fontBase64Cache: string | null = null;
let fontBase64Promise: Promise<string> | null = null;

/** 获取 SimHei 字体 base64 data URL（全局缓存，仅首次 fetch）。 */
export async function getSimHeiFontDataUrl(fontUrl: string): Promise<string> {
  if (fontDataUrlCache) return fontDataUrlCache;
  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = (async () => {
    const resp = await fetch(fontUrl);
    if (!resp.ok) throw new Error(`字体下载失败 HTTP ${resp.status}`);
    const blob = await resp.blob();
    fontDataUrlCache = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error ?? new Error("字体解析失败"));
      fr.readAsDataURL(blob);
    });
    return fontDataUrlCache;
  })();

  return fontLoadPromise;
}

/** 获取 SimHei 字体原始 base64（不含 data: 前缀）——pdfmake VFS 所需格式。全局缓存。 */
export async function getSimHeiFontBase64(fontUrl: string): Promise<string> {
  if (fontBase64Cache) return fontBase64Cache;
  if (fontBase64Promise) return fontBase64Promise;

  fontBase64Promise = (async () => {
    const resp = await fetch(fontUrl);
    if (!resp.ok) throw new Error(`字体下载失败 HTTP ${resp.status}`);
    const buf = new Uint8Array(await resp.arrayBuffer());
    let binary = "";
    const chunk = 0x8000; // 分块避免栈溢出（9.7MB 单次 join 在部分浏览器报错）
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    return btoa(binary);
  })();

  return fontBase64Promise;
}

/** 清除字体缓存（调试用）。 */
export function clearFontCache(): void {
  fontDataUrlCache = null;
  fontLoadPromise = null;
  fontBase64Cache = null;
  fontBase64Promise = null;
}

/** Blob-based download——比 pdfmake 的 createObjectURL + click 更不受弹窗拦截器影响。 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // 延迟 revoke 确保浏览器已开始下载
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
