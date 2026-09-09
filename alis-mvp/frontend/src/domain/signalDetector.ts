// AI 受访者信号检测器（v3.4）。
// 来源：C:\Users\35636\Downloads\726反馈2.1\产品整体反思_从模块化到空间化_v3.3设计升级.md 第七章 7.2 Type A
//
// 设计：在访谈者添加 respondent reply 时，实时分析文本中的"潜在情况"信号，
// 生成 Type A 气泡（受访者信号），帮助访谈者觉察受访者回答文本之下的线索。
//
// 架构：复用 contradictionDetector.ts 的 pattern 数组 + detect() 纯函数模式。
// 所有检测逻辑为纯函数，无副作用，可独立测试。

// ============================================================================
// 类型定义
// ============================================================================

/** 信号检测维度 */
export type SignalSubtype =
  | "hedging"            // 犹豫/不确定性表达
  | "keyword_repetition" // 关键词高频重复
  | "emotion_marker"     // 情绪标记（兴奋/负面）
  | "answer_text_gap";   // 分数-表述不一致

/** 信号严重程度 */
export type SignalSeverity = "high" | "medium" | "low";

/** 信号置信度 */
export type SignalConfidence = "high" | "medium" | "low";

/** 单条检测信号 */
export interface SignalResult {
  /** 信号唯一ID */
  id: string;
  /** 信号类型 */
  type: "interviewee_signal";
  /** 检测子维度 */
  subtype: SignalSubtype;
  /** 气泡内容（简短一句话，已经过去价值化过滤） */
  content: string;
  /** AI 推测置信度 */
  confidence: SignalConfidence;
  /** 关联的题目ID */
  sourceQuestionId: string;
  /** 信号严重程度 */
  severity: SignalSeverity;
}

/** 检测模式定义 */
interface SignalPattern {
  id: string;
  subtype: SignalSubtype;
  severity: SignalSeverity;
  /** 检测条件：回复文本 + 对应分数 + 所有历史回复 */
  check: (reply: string, score: number | undefined, allReplies: string[]) => boolean;
  /** 生成气泡内容 */
  generate: (reply: string, score: number | undefined) => { content: string; confidence: SignalConfidence };
}

// ============================================================================
// "去价值化"过滤（关键伦理设计）
// ============================================================================

/** 禁止出现的价值判断词汇。命中任一模式的 AI 气泡将被拒绝生成。 */
const FORBIDDEN_PATTERNS = [
  "应该", "必须", "正确", "错误", "不足", "不够",
  "素养低", "能力差", "建议你引导", "需要纠正",
  "应该这样", "不该这样", "对的", "错的",
];

/**
 * 过滤 AI 生成气泡中的价值判断。
 * 返回 null 表示该内容被拒绝（触发了禁用词）。
 */
export function filterBias(content: string): string | null {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (content.includes(pattern)) return null;
  }
  return content;
}

// ============================================================================
// 中文信号词库
// ============================================================================

/** 犹豫/不确定性表达词（hedging） */
const HEDGING_WORDS = [
  "应该", "可能", "大概", "算是", "差不多",
  "也许", "好像", "似乎", "不确定", "不太清楚",
  "说不上来", "感觉吧", "或许", "估计",
];

/** 积极情绪词 */
const POSITIVE_EMOTION_WORDS = [
  "特别", "非常", "太棒了", "很厉害", "惊艳",
  "神奇", "震撼", "兴奋", "喜欢", "开心",
  "方便", "好用", "强大", "惊喜", "超出预期",
];

/** 负面情绪词 */
const NEGATIVE_EMOTION_WORDS = [
  "烦", "难用", "焦虑", "担心", "害怕",
  "困惑", "挫败", "失望", "生气", "无语",
  "麻烦", "复杂", "搞不懂", "头疼", "崩溃",
];

/** 高频重复检测的最小出现次数 */
const REPETITION_THRESHOLD = 3;

/** 高频重复检测的最小词长（过滤"的""了""是"等功能词） */
const MIN_KEYWORD_LENGTH = 2;

/** 常见功能词（在高频检测中排除） */
const STOP_WORDS = new Set([
  "的", "了", "是", "我", "不", "在", "有", "和", "就",
  "都", "也", "这", "那", "他", "她", "它", "们",
  "一个", "这个", "那个", "怎么", "什么", "为什么",
  "可以", "会", "能", "要", "想", "觉得", "知道",
  "比较", "还是", "但", "因为", "所以", "如果",
]);

// ============================================================================
// 检测模式定义（8 种）
// ============================================================================

const SIGNAL_PATTERNS: SignalPattern[] = [
  // ---- hedging 检测（3 种模式） ----
  {
    id: "S01",
    subtype: "hedging",
    severity: "medium",
    check: (reply, score) => {
      // 高分（≥6）+ 回复含 hedging 词 → 分数与语气不一致
      if (score === undefined || score < 6) return false;
      const hasHedging = HEDGING_WORDS.some(w => reply.includes(w));
      if (!hasHedging) return false;
      // 至少 2 个 hedging 词才触发（提高准确率）
      const hedgingCount = HEDGING_WORDS.filter(w => reply.includes(w)).length;
      return hedgingCount >= 2;
    },
    generate: (reply) => {
      const foundWords = HEDGING_WORDS.filter(w => reply.includes(w));
      const wordStr = foundWords.slice(0, 3).join("、");
      return {
        content: `高分但语气不坚决？回复中出现了"${wordStr}"等犹豫表达，可能实际边界比分数显示的更模糊`,
        confidence: "medium",
      };
    },
  },
  {
    id: "S02",
    subtype: "hedging",
    severity: "low",
    check: (reply, _score) => {
      // 回复中 hedging 词密度高（≥4 个不同的 hedging 词）
      const uniqueHedging = new Set(
        HEDGING_WORDS.filter(w => reply.includes(w))
      );
      return uniqueHedging.size >= 4;
    },
    generate: (reply) => {
      const foundWords = [...new Set(HEDGING_WORDS.filter(w => reply.includes(w)))];
      return {
        content: `回复中有多处不确定表达（${foundWords.slice(0, 3).join("、")}等），受访者可能在这个话题上缺乏明确立场`,
        confidence: "high",
      };
    },
  },
  {
    id: "S03",
    subtype: "hedging",
    severity: "medium",
    check: (reply, score) => {
      // 低分（≤2）+ 回复含积极词 + hedging → 可能存在社会期望偏差
      if (score === undefined || score > 2) return false;
      const hasPositive = POSITIVE_EMOTION_WORDS.some(w => reply.includes(w));
      const hasHedging = HEDGING_WORDS.some(w => reply.includes(w));
      return hasPositive && hasHedging;
    },
    generate: (_reply) => ({
      content: "低分但语气积极且犹豫——可能在'应该怎么做'和'实际怎么做'之间有落差",
      confidence: "medium",
    }),
  },

  // ---- keyword_repetition 检测（2 种模式） ----
  {
    id: "S04",
    subtype: "keyword_repetition",
    severity: "medium",
    check: (reply, _score) => {
      // 同一非功能词出现 ≥3 次
      const words = reply.split(/[，,。.！!？?\s、]+/).filter(w => w.length >= MIN_KEYWORD_LENGTH);
      const wordCount = new Map<string, number>();
      for (const w of words) {
        if (STOP_WORDS.has(w)) continue;
        wordCount.set(w, (wordCount.get(w) ?? 0) + 1);
      }
      return [...wordCount.values()].some(c => c >= REPETITION_THRESHOLD);
    },
    generate: (reply) => {
      const words = reply.split(/[，,。.！!？?\s、]+/).filter(w => w.length >= MIN_KEYWORD_LENGTH && !STOP_WORDS.has(w));
      const wordCount = new Map<string, number>();
      for (const w of words) wordCount.set(w, (wordCount.get(w) ?? 0) + 1);
      let topWord = "";
      let topCount = 0;
      for (const [w, c] of wordCount) {
        if (c > topCount) { topWord = w; topCount = c; }
      }
      return {
        content: `反复提到"${topWord}"（${topCount}次），是否把核心判断简化成了这一个维度？`,
        confidence: "medium",
      };
    },
  },
  {
    id: "S05",
    subtype: "keyword_repetition",
    severity: "low",
    check: (reply, _score, allReplies) => {
      // 跨回复检测：同一关键词在过去 3 条以上回复中反复出现
      if (allReplies.length < 3) return false;
      const recentReplies = allReplies.slice(-4); // 最近 4 条（含当前）
      const words = reply.split(/[，,。.！!？?\s、]+/).filter(
        w => w.length >= MIN_KEYWORD_LENGTH && !STOP_WORDS.has(w),
      );
      const uniqueWords = [...new Set(words)];
      for (const w of uniqueWords) {
        const crossCount = recentReplies.filter(r => r.includes(w)).length;
        if (crossCount >= 3) return true;
      }
      return false;
    },
    generate: (reply) => {
      const words = reply.split(/[，,。.！!？?\s、]+/).filter(
        w => w.length >= MIN_KEYWORD_LENGTH && !STOP_WORDS.has(w),
      );
      return {
        content: `"${words[0] ?? '某个关键词'}"在多道题的回答中反复出现，可能是一个贯穿性的个人框架`,
        confidence: "low",
      };
    },
  },

  // ---- emotion_marker 检测（2 种模式） ----
  {
    id: "S06",
    subtype: "emotion_marker",
    severity: "high",
    check: (reply, _score) => {
      const posCount = POSITIVE_EMOTION_WORDS.filter(w => reply.includes(w)).length;
      const negCount = NEGATIVE_EMOTION_WORDS.filter(w => reply.includes(w)).length;
      // 强情绪信号：≥3 个积极词或 ≥2 个负面词
      return posCount >= 3 || negCount >= 2;
    },
    generate: (reply) => {
      const posWords = POSITIVE_EMOTION_WORDS.filter(w => reply.includes(w));
      const negWords = NEGATIVE_EMOTION_WORDS.filter(w => reply.includes(w));
      if (posWords.length >= negWords.length) {
        return {
          content: `这段经历触发了较强的积极情绪（${posWords.slice(0, 2).join("、")}等），值得深挖故事入口`,
          confidence: "high",
        };
      }
      return {
        content: `这段经历触发了负面情绪（${negWords.slice(0, 2).join("、")}等），背后可能有关键的转折经历`,
        confidence: "high",
      };
    },
  },
  {
    id: "S07",
    subtype: "emotion_marker",
    severity: "low",
    check: (reply, _score) => {
      // 情绪混合：同时含有积极词和负面词
      const hasPos = POSITIVE_EMOTION_WORDS.some(w => reply.includes(w));
      const hasNeg = NEGATIVE_EMOTION_WORDS.some(w => reply.includes(w));
      return hasPos && hasNeg;
    },
    generate: (_reply) => ({
      content: "回复中同时出现积极和负面情绪词——受访者对AI的态度可能是矛盾的，值得探索这种张力",
      confidence: "low",
    }),
  },

  // ---- answer_text_gap 检测（1 种模式） ----
  {
    id: "S08",
    subtype: "answer_text_gap",
    severity: "high",
    check: (reply, score) => {
      if (score === undefined) return false;
      const hasHedging = HEDGING_WORDS.some(w => reply.includes(w));
      const hasPositive = POSITIVE_EMOTION_WORDS.some(w => reply.includes(w));
      const hasNegative = NEGATIVE_EMOTION_WORDS.some(w => reply.includes(w));
      // 高分+犹豫（已在 S01 覆盖，此处检测 低分+积极）
      if (score <= 2 && hasPositive) return true;
      // 中分段+矛盾表达（积极+负面并存）
      if (score >= 3 && score <= 5 && hasPositive && hasNegative) return true;
      // 极端分+hedging（补充 S01 未覆盖的情况）
      if ((score >= 6 || score <= 2) && hasHedging && (hasPositive || hasNegative)) return true;
      return false;
    },
    generate: (_reply, score) => {
      if (score !== undefined && score <= 2) {
        return {
          content: `选了低分但描述中有积极表达——可能在"实际行为"和"自我评价"之间存在差异`,
          confidence: "medium",
        };
      }
      if (score !== undefined && score >= 6) {
        return {
          content: "高分但回答中情绪复杂——可能在实际体验中有比分数显示的更丰富的层次",
          confidence: "medium",
        };
      }
      return {
        content: "分数与表述之间存在张力——值得追问具体情境来理解这种复杂性",
        confidence: "low",
      };
    },
  },
];

// ============================================================================
// 公共 API
// ============================================================================

/**
 * 检测单条受访者回复中的所有信号。
 *
 * @param reply - 受访者回复文本（当前题目）
 * @param score - 该题的选择分数（1-7），若无分数则传 undefined
 * @param questionId - 当前题目ID（如 "Q1"）
 * @param allReplies - 所有历史回复文本（不含当前条），用于跨题检测
 * @returns 检测到的信号数组（已按严重程度排序：high → medium → low）
 */
export function detectSignals(
  reply: string,
  score: number | undefined,
  questionId: string,
  allReplies: string[] = [],
): SignalResult[] {
  if (!reply.trim()) return [];

  const results: SignalResult[] = [];

  for (const pattern of SIGNAL_PATTERNS) {
    if (pattern.check(reply, score, allReplies)) {
      const generated = pattern.generate(reply, score);
      // 去价值化过滤
      const filtered = filterBias(generated.content);
      if (filtered === null) continue; // 被过滤，不生成

      results.push({
        id: `${pattern.id}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        type: "interviewee_signal",
        subtype: pattern.subtype,
        content: filtered,
        confidence: generated.confidence,
        sourceQuestionId: questionId,
        severity: pattern.severity,
      });
    }
  }

  // 按严重程度排序
  const severityOrder: Record<SignalSeverity, number> = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // 最多返回 3 条（避免信息过载）
  return results.slice(0, 3);
}

/**
 * 将 SignalResult 转换为 ThoughtBubble 兼容格式。
 * 用于在 ThoughtBubblePanel 中渲染信号气泡。
 */
export function signalToBubbleMeta(signal: SignalResult): {
  id: string;
  content: string;
  source: string;
  subtype: string;
  confidence: string;
  questionId: string;
  createdAt: string;
} {
  return {
    id: signal.id,
    content: signal.content,
    source: "interviewee_signal",
    subtype: signal.subtype,
    confidence: signal.confidence,
    questionId: signal.sourceQuestionId,
    createdAt: new Date().toISOString(),
  };
}
