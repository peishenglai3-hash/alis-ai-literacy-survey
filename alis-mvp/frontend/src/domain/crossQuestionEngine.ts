// 跨题关联规则引擎（v3.4）。
// 来源：C:\Users\35636\Downloads\726反馈2.1\产品整体反思_从模块化到空间化_v3.3设计升级.md 第七章 7.2 Type B2
//
// 设计：将静态 crossQuestionLinks.ts 数据升级为运行时触发匹配。
// 当受访者回复命中 triggerKeywords 时，自动生成跨题关联气泡（Type B2）。
//
// 架构：纯函数，无副作用。复用 CROSS_QUESTION_LINKS 数据。
// 规则引擎为自定义轻量实现——约 30 条规则，不需要 json-rules-engine。

import {
  CROSS_QUESTION_LINKS,
  type CrossQuestionLink,
} from "../content/crossQuestionLinks";

// ============================================================================
// 类型定义
// ============================================================================

/** 触发的规则匹配结果 */
export interface TriggeredRule {
  /** 匹配的跨题链接 */
  link: CrossQuestionLink;
  /** 命中的关键词 */
  matchedKeyword: string;
  /** 关键词在回复文本中的位置 */
  matchPosition: number;
}

/** 规则气泡的元数据（用于转换为 ThoughtBubble） */
export interface CrossQuestionBubbleMeta {
  id: string;
  content: string;
  source: string;
  targetQuestion: string;
  matchedKeyword: string;
  fromQuestion: string;
  createdAt: string;
}

// ============================================================================
// 规则匹配引擎
// ============================================================================

/**
 * 在受访者回复中匹配跨题关联规则。
 *
 * 匹配逻辑：
 * 1. 筛选以当前题目为起点的所有关联规则
 * 2. 检查回复文本是否包含任一 triggerKeyword
 * 3. 返回所有命中的规则（去重——同一规则只触发一次）
 *
 * @param reply - 受访者回复文本
 * @param currentQuestionId - 当前题目ID（如 "Q1"）
 * @param alreadyTriggered - 已经触发过的规则ID集合（用于避免重复触发）
 * @returns 触发的规则匹配结果数组
 */
export function matchReplyAgainstRules(
  reply: string,
  currentQuestionId: string,
  alreadyTriggered: Set<string> = new Set(),
): TriggeredRule[] {
  if (!reply.trim()) return [];

  // 筛选以当前题为起点的所有关联
  const relevantLinks = CROSS_QUESTION_LINKS.filter(
    (link) => link.fromQuestion === currentQuestionId,
  );

  const results: TriggeredRule[] = [];

  for (const link of relevantLinks) {
    // 已触发过的规则跳过
    const ruleId = `${link.fromQuestion}→${link.toQuestion}`;
    if (alreadyTriggered.has(ruleId)) continue;

    // 检查每个 triggerKeyword
    for (const kw of link.triggerKeywords) {
      const pos = reply.indexOf(kw);
      if (pos !== -1) {
        results.push({
          link,
          matchedKeyword: kw,
          matchPosition: pos,
        });
        break; // 每条规则只记录第一个命中的关键词
      }
    }
  }

  return results;
}

/**
 * 批量匹配——对多条历史回复进行规则匹配。
 * 用于在回顾模式中聚合所有触发过的规则。
 *
 * @param replies - 回复数组（{questionId, text}）
 * @returns 所有触发的规则
 */
export function matchAllRepliesAgainstRules(
  replies: { questionId: string; text: string }[],
): TriggeredRule[] {
  const triggered = new Set<string>();
  const results: TriggeredRule[] = [];

  for (const { questionId, text } of replies) {
    const matches = matchReplyAgainstRules(text, questionId, triggered);
    for (const m of matches) {
      const ruleId = `${m.link.fromQuestion}→${m.link.toQuestion}`;
      triggered.add(ruleId);
      results.push(m);
    }
  }

  return results;
}

// ============================================================================
// 气泡转换
// ============================================================================

/**
 * 将触发的规则转换为气泡元数据。
 * 用于在 ThoughtBubblePanel 中渲染跨题关联气泡。
 */
export function triggeredRuleToBubbleMeta(
  rule: TriggeredRule,
): CrossQuestionBubbleMeta {
  return {
    id: `cross_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    content: `💡 ${rule.link.hintText}`,
    source: "cross_question",
    targetQuestion: rule.link.toQuestion,
    matchedKeyword: rule.matchedKeyword,
    fromQuestion: rule.link.fromQuestion,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 获取某条规则的唯一标识符。
 */
export function getRuleId(link: CrossQuestionLink): string {
  return `${link.fromQuestion}→${link.toQuestion}`;
}

// ============================================================================
// 规则统计（用于回顾模式）
// ============================================================================

/** 规则触发统计 */
export interface RuleTriggerStats {
  ruleId: string;
  fromQuestion: string;
  toQuestion: string;
  connectionLogic: string;
  triggerCount: number;
  lastTriggeredAt?: string;
}

/**
 * 聚合规则触发统计。
 * 用于回顾模式展示"哪些跨题关联被触发了"。
 */
export function aggregateRuleStats(
  triggeredRules: TriggeredRule[],
): RuleTriggerStats[] {
  const statsMap = new Map<string, RuleTriggerStats>();

  for (const rule of triggeredRules) {
    const ruleId = getRuleId(rule.link);
    const existing = statsMap.get(ruleId);
    if (existing) {
      existing.triggerCount++;
      existing.lastTriggeredAt = new Date().toISOString();
    } else {
      statsMap.set(ruleId, {
        ruleId,
        fromQuestion: rule.link.fromQuestion,
        toQuestion: rule.link.toQuestion,
        connectionLogic: rule.link.connectionLogic,
        triggerCount: 1,
        lastTriggeredAt: new Date().toISOString(),
      });
    }
  }

  return [...statsMap.values()].sort((a, b) => b.triggerCount - a.triggerCount);
}
