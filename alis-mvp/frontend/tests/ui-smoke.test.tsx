// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { parsePack } from "../src/content/pack-loader";
import { LikertScreen } from "../src/ui/LikertScreen";
import { ProfileView } from "../src/ui/ProfileView";
import type { DimensionProfile } from "../src/types";

// 未启用 vitest globals，需显式在每个用例后清理 DOM，避免多次 render 的实例互相污染。
afterEach(cleanup);

// jsdom 下 import.meta.url 非 file:// 协议，改用 cwd（vitest 从 frontend 目录运行）定位后端 YAML 真源。
const raw = readFileSync(
  resolve(process.cwd(), "../backend/content/question_pack_v2.1.yaml"),
  "utf-8",
);
const pack = parsePack(raw);

describe("LikertScreen（测量阶段 UI）", () => {
  it("显示首题题干与 6 档量表按钮", () => {
    render(
      <LikertScreen pack={pack} responses={{}} onAnswer={() => {}} onLock={() => {}} />,
    );
    const first = pack.items[0]!;
    expect(screen.getByText(first.stem_zh as string)).toBeTruthy();
    expect(screen.getAllByRole("radio").length).toBe(6);
  });

  it("选择分值时回调 onAnswer(itemId, rawScore)", () => {
    const onAnswer = vi.fn();
    render(
      <LikertScreen pack={pack} responses={{}} onAnswer={onAnswer} onLock={() => {}} />,
    );
    const first = pack.items[0]!;
    fireEvent.click(screen.getAllByRole("radio")[5]!); // 第 6 档 = 6 分（去中点 6 点制最高分）
    expect(onAnswer).toHaveBeenCalledWith(first.id, 6);
  });

  it("阶段隔离：未答齐时不出现任何分数/剖面字样", () => {
    render(
      <LikertScreen pack={pack} responses={{}} onAnswer={() => {}} onLock={() => {}} />,
    );
    expect(screen.queryByText(/相对位置/)).toBeNull();
  });
});

describe("ProfileView（相对位置 + 伦理文案）", () => {
  const profile: DimensionProfile[] = pack.dimensions.map((d, i) => ({
    dimensionId: d.id,
    mean: 4 + (i % 3),
    percentile: 30 + i * 8,
    ciLow: 20 + i * 8,
    ciHigh: 45 + i * 8,
    normed: false,
    normSource: "provisional-midpoint",
    ciEstimable: true,
  }));

  it("渲染伦理文案（相对位置、非排名）与 7 条维度", () => {
    render(<ProfileView pack={pack} profile={profile} targetDimensionId="D2" />);
    expect(screen.getByText(/相对位置，不是与他人比较的排名/)).toBeTruthy();
    // 7 个维度名至少出现其一
    expect(screen.getByText(/识别 AI/)).toBeTruthy();
  });
});
