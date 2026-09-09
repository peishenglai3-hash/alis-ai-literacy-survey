# S0 首份产出：ADR-001 + 数据 Schema 草案

> **级别**：S0 定标锁范围｜**状态**：✅ **Accepted（2026-07-10 赖培胜批准，师门内容协商留至 7 月末）**｜**日期**：2026-07-10

---

## 第一部分：ADR-001 —— MVP 范围锁定为"仅单题闭环"

**状态**：✅ **Accepted**（赖培胜先行自审通过；量表内容决策推迟 7 月末师门会议）
**背景（Context）**
- 距 8/1 试运行 21 天；技术主力（赖培胜）七线并行，带宽是最大约束。
- 七层架构 8 月只可能点亮①问题②测评③解释 + 第④层访谈引擎的"单题追问"残版。
- 完整访谈引擎（多题追问树、断裂检测、成员分类、分析研究层）是明年的 IP，不是这个夏天的事。

**决策（Decision）**
> 8 月 MVP = **"单题闭环"**一条最薄垂直切片：
> **量表作答 → 硬编码评分 → 7 维度连续剖面（+置信区间）→ 对"偏离最大的 1 题"发起一次 AI 追问 → 录音本地暂存 → debrief。**

**明确 NOT 做（写死防范围蔓延）**
- ❌ 多题追问树 / 完整 BOOT→…→WRAP 状态机（只做单题的 ELICIT→PROBE→录音）
- ❌ 断裂检测 BREAK 态、成员分类三层分析、反思⑤/分析⑥/研究⑦层
- ❌ **硬人格类型标签**（改连续剖面——✅ 采纳《修订建议》收敛项①）
- ❌ 面部识别（按最小必要原则从 MVP 移除）
- ❌ 公网部署 / 阿里云（本地优先，绕 ICP）
- ❌ 云端 ASR（本地 Whisper，音频不出域）

**🔧 内容可改性要求（S0 批准附加约束，2026-07-10）**
> 量表题目、追问树骨架、维度与人格文案**全部外置为可编辑 Question Pack（YAML/JSON）**，不硬编码进逻辑层。**给内容板块留足"站位 + 可修改余地"**，让师门 7 月末开会能直接改内容而**不动一行代码**。8 月不加/删/改题（保 MAILS 复用辩护 + 赶窗口），但结构上必须"随时可改"。

**后果（Consequences）**
- ✅ 21 天可交付；铁律可守（评分/分支全硬编码，LLM 只填一句追问）。
- ✅ 成功标准聚焦三个可行性问题（技术稳不稳 / 新手能否当促进者 / 暴露评分能否激发叙事）。
- ⚠️ 学术产出以"可行性验证 + 认知访谈质性"为主，非规模化信效度——已与《修订建议》对齐。

---

## 第二部分：数据 Schema 草案 v0.1（MVP 子集）

> 从①整合架构的 9 表全量，**裁到单题闭环需要的最小集**；用 **ORM 建模**（SQLAlchemy / Drizzle / Prisma 三选一），8 月落 SQLite，明春改一行连接串切 PostgreSQL。
> **两处采纳《修订建议》**：`personality_profiles` 存**连续剖面 + CI**（非硬 type）；`likert_responses` 带 `locked_at` 实现**阶段隔离**。

### 表清单（MVP 7 张 + 1 视图）

| 表 | 作用 | MVP 关键字段 |
|---|---|---|
| `sessions` | 一场访谈一行 | `session_id`(UUID)、`facilitator_id`、`scale_version`、`started_at`、`consent_ref`、`age_screen_pass`(未成年筛查) |
| `likert_responses` | 15 题作答事件 | `session_id`、`item_id`、`raw_score`(1–7)、`answered_at`、**`locked_at`**(阶段隔离：反馈前锁定) |
| `dimension_scores` | 7 维度评分 | `session_id`、`dimension_id`、`score`、`computed_at`（**硬编码算出，非 LLM**） |
| `personality_profiles` | 人格**连续剖面** | `session_id`、`dimension_id`、`percentile`、**`ci_low`/`ci_high`**（置信区间）、`self_named_label`(受访者自命名)｜**不存硬 type** |
| `probe_events` | 单题追问 | `session_id`、`target_item_id`(偏离最大题)、`probe_text`(LLM 生成语言层)、`asked_at` |
| `narrative_segments` | 叙事片段 | `segment_id`、`session_id`、`ref_item_id`(回指触发题)、`transcript`、`t_start`/`t_end`、`audio_file_id`(仅存 ID，音频不入库) |
| `question_reactions` | 暴露评价埋点 | `session_id`、`item_id`、`exposed`(bool，AB 埋点)、`express_len`、`emotion_intensity` |
| `unified_timeline`（视图） | 定量×定性同轴 | 按 `session_id + wall_clock` JOIN Likert 事件与叙事片段，供混合方法分析 |

### 会话包（session bundle）落 S1 的目录格式
```
session_<uuid>/
  manifest.json          # 元数据 + scale_version + checksums 指针
  scale_responses.json   # likert + dimension + profile
  narrative_segments.json
  probe_events.json
  audio/                 # 本地音频（≤7天转写后删原始）
  transcripts/           # 本地 Whisper 转写
  checksums.sha256
```

### 设计约束（守住铁律与护栏）
- `dimension_scores` / `probe_events.target_item_id` 由**确定性代码**算出；LLM 只写 `probe_events.probe_text`。
- `audio_file_id` 只存指针，音频留本地磁盘 / 明春 OSS；库里绝不落原始音频。
- ORM 层统一建模，SQLite↔PostgreSQL 迁移零改 SQL（本项目最重要埋点）。
- `age_screen_pass` 为 false → 走监护人同意流程（研究质量护栏，静默内建）。

---

## 请求审阅

**技术审**：范围锁定合不合理？schema 够不够单题闭环、有没有过度设计？ORM/会话包埋点对不对？
**学术审**：ADR 的"NOT 做"清单有没有砍掉你要的学术点？`personality_profiles` 改连续剖面能不能接受（须先在《修订建议》拍板）？

> 审阅通过 + 量表 5 项决策拍板后，我开 **S1 数据地基**（ORM 模型 + SQLite 落库 + 会话包打包器）。
