# ALIS MVP · 后端数据地基（S1）

社会学 AI 素养调查研究软件（ALIS）单题闭环 MVP 的数据层。
**铁律：LLM 只负责语言，不负责逻辑。** 本层是纯数据层，不含评分/分支/追问决策。

## 是什么
- ORM 模型（SQLAlchemy 2.x）：7 表 + `unified_timeline` 视图 —— 见 `alis/models.py`。
- 连接串抽象：默认 SQLite，设 `DATABASE_URL` 即切 PostgreSQL，**代码不改**（`alis/db.py`）。这是最重要的迁移埋点。
- 会话包打包器：`alis/bundle.py` 的 `export_session()` 把一场访谈导出成可携带、可校验的目录，供 S5 汇聚入库到私有中心分析库（"本地采集 → 中心分析"两层架构的连接件）。
- 可编辑内容：`content/question_pack_v2.1.yaml`（15 题 + 7 维度 provisional 映射 + 追问树骨架 + 人格文案），**师门 7 月末可直接改此文件、不动代码**；`alis/content.py` 负责加载+校验。

## 采纳的量表 v2.1 决策（已落进 schema）
- 人格 = **连续剖面 + 置信区间**（`personality_profiles`：percentile/ci_low/ci_high），**无硬类型字段**。
- **阶段隔离**：`likert_responses.locked_at`——评分在类型反馈前锁定。
- 护栏：音频只存路径（`narrative_segments.audio_file_id`）、`age_screen_pass` 未成年筛查、无人脸字段。

## 怎么跑
```bash
cd backend
python -m venv .venv && . .venv/Scripts/activate   # Windows Git Bash
pip install -r requirements.txt

# 建库 + 视图（默认 SQLite ./alis_local.db）
alembic upgrade head

# 测试
pytest -q
```
明春切 PostgreSQL：`export DATABASE_URL=postgresql+psycopg://user:pwd@host/alis` 后 `alembic upgrade head`，代码零改动。

## 边界（S1 只做数据地基）
不含：XState 评分 FSM（S2）、LLM 追问（S3）、前端 UI（S4）、汇聚入库端（S5）。
启动封装（docker-compose / 双击批处理）留到 S6。
