// 数值小工具（保持纯函数、无副作用，便于确定性测试）。

export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
