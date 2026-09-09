# ALIS 云部署架构设计与工程勘查报告

> **版本**: 1.0  
> **日期**: 2026-07-11  
> **角色**: 云部署技术架构研究员  
> **项目**: ALIS (AI Literacy Situational Interview Scale) — 社会学研究调查程序，非游戏  
> **目标**: 本地成品搬上国内轻量服务器（阿里云/腾讯云），为多端做准备  

---

## 目录

1. [勘查事实](#1-勘查事实)
   - 1.1 后端结构与 ASGI 入口
   - 1.2 数据库层与迁移埋点
   - 1.3 音频与转写管线
   - 1.4 LLM 层
   - 1.5 前端与 PWA
   - 1.6 部署设施现状
2. [云部署拓扑设计](#2-云部署拓扑设计)
   - 2.1 总体架构图
   - 2.2 反向代理与 HTTPS
   - 2.3 进程与容器化策略
   - 2.4 数据库：SQLite → PostgreSQL
   - 2.5 音频对象存储
   - 2.6 Whisper 转写算力评估
   - 2.7 API-first 多端架构
   - 2.8 配置与密钥管理
   - 2.9 可观测与运维底线
3. [分阶段落地路线](#3-分阶段落地路线)
   - 阶段一：最小可上线
   - 阶段二：加固
   - 阶段三：多端就绪
4. [需赖培胜协调事项](#4-需赖培胜协调事项)
5. [不确定与待验证项](#5-不确定与待验证项)

---

## 1. 勘查事实

### 1.1 后端结构与 ASGI 入口

| 项目 | 值 |
|------|-----|
| **ASGI 入口** | `backend/main.py` (第 33 行): `app = create_app()` → 符合 `main:app` 模式 |
| **启动命令** | `uvicorn main:app --host 127.0.0.1 --port 8000` |
| **应用工厂** | `backend/alis/api.py` (第 149-154 行): `create_app(client, pack, session_factory)` — 三个参数均为可选注入，便于测试 |
| **FastAPI 版本** | title="ALIS API", version="0.4.0-s6" (第 155 行) |
| **CORS** | 第 157-167 行: 白名单 `localhost:5173/4173`，生产需收紧 |
| **健康检查** | 第 172-174 行: `GET /health` 返回 `{"status": "ok", "scale_version": ...}` |
| **路由清单** | `POST /session/start`, `POST /probe/render`, `POST /session/commit`, `GET /sessions`, `GET /stats`, `GET /export/{wide,long}.csv`, `GET /export/bundle.zip`, `POST /narrative/register` |
| **PWA 托管** | 第 412-414 行: 若 `frontend/dist` 存在，在**所有 API 路由后**挂载 `StaticFiles("/")` 实现同源托管 |
| **依赖清单** | `backend/requirements.txt` (19 行): SQLAlchemy>=2.0, alembic>=1.13, PyYAML>=6.0, pytest>=8.0, fastapi>=0.110, httpx>=0.27, uvicorn>=0.30; `litellm>=1.40` 和 `faster-whisper>=1.0` 注释掉（按需手动装） |
| **pyproject.toml** | 不存在 |
| **Dockerfile** | **不存在** — 整个项目树无 Dockerfile / docker-compose.yml |
| **Shell 脚本** | 无 `.sh` 文件；唯一启动入口是 Windows `一键启动_成果报备.bat` |

**结论**: 后端已做好上云的核心准备——`main:app` ASGI 模式、/health 端点、CORS 预埋、静态文件同源托管。缺容器化配置。

---

### 1.2 数据库层与迁移埋点

| 项目 | 值 |
|------|-----|
| **连接串抽象** | `backend/alis/db.py` 第 16 行: `DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./alis_local.db")` |
| **当前数据库** | SQLite (WAL 模式，`backend/alis_local.db`) — 明文写在 8 月本地优先策略 |
| **PostgreSQL 切换** | 设 `DATABASE_URL=postgresql+psycopg://user:pwd@host/alis` 即切，**零代码改动**（第 4-6 行注释明确标注） |
| **引擎工厂** | `make_engine()` (第 23-38 行): 自动检测 SQLite/非 SQLite，SQLite 则开 WAL+外键 |
| **会话管理** | 同步 `SessionLocal = sessionmaker(bind=engine)` (第 42 行); **无 async/异步引擎** |
| **ORM 模型** | `backend/alis/models.py`: 7 张表 — Session, LikertResponse, DimensionScore, PersonalityProfile, ProbeEvent, NarrativeSegment, QuestionReaction (第 172-180 行 `ALL_MODELS` 列表) |
| **Alembic 迁移** | `backend/alembic/` 已就绪 — `env.py` (第 26-27 行) 优先从环境变量读 `DATABASE_URL` |
| **初始迁移** | `backend/alembic/versions/0001_initial.py` (2026-07-10): `create_all` + 建 `unified_timeline` 视图; `render_as_batch=True` 兼容 SQLite |
| **种子脚本** | 不存在 |

**关键发现**: 数据库迁移埋点**完备**。DATABASE_URL 环境变量可零代码切换 SQLite↔PostgreSQL。Alembic autogenerate 支持已配好（`target_metadata = Base.metadata`）。

**注意事项**: 当前为**同步 SQLAlchemy**，不是 async。生产上可用 `uvicorn` 多 worker 处理并发，或考虑异步化（Phase 2/3 再做）。

---

### 1.3 音频与转写管线

| 项目 | 值 |
|------|-----|
| **转写模块** | `backend/alis/transcribe.py` (66 行) |
| **架构** | Protocol + Stub + 惰性真实实现 (第 24-27 行 `Transcriber` Protocol, 第 29-39 行 `StubTranscriber`, 第 42-65 行 `WhisperTranscriber`) |
| **Whisper 模型** | 默认 `base`，可通过环境变量 `ALIS_WHISPER_MODEL` 覆盖 (第 46 行) |
| **推理配置** | `device="cpu"`, `compute_type="int8"` (第 54 行) |
| **语言** | `language="zh"` 中文转录 (第 59 行) |
| **铁律** | 文件头注释 (第 3-8 行): 音频**本地转写不走云 API**；**只存路径指针不入库**；**转写核对后 <=7 天删原始音频** |
| **惰性导入** | `from faster_whisper import WhisperModel` 在 `_ensure()` 内 (第 51 行)，测试/离线不装此依赖 |
| **录音在前端** | `frontend/src/ui/Recorder.tsx` (136 行): 双轨设计 — 浏览器 MediaRecorder（需 HTTPS）+ 手动上传备轨；产出仅本地生成可下载文件，**绝不自动上传** |

**结论**: 音频管线设计合理 — 前端只录不传、后端转写走本地。`Transcriber` Protocol 允许将来替换为云端转写服务（如阿里云语音识别），但当前铁律要求本地 + <=7 天删除。

---

### 1.4 LLM 层

| 项目 | 值 |
|------|-----|
| **LLM 模块** | `backend/alis/probe.py` (225 行) |
| **架构** | Protocol + Stub + 惰性真实实现 (第 49-53 行 `LLMClient` Protocol, 第 56-64 行 `StubLLMClient`, 第 67-92 行 `LiteLLMClient`) |
| **生产实现** | LiteLLM + DeepSeek (第 67-92 行); `litellm.completion()` 惰性导入 |
| **模型配置** | 环境变量 `ALIS_PROBE_MODEL` (默认 `deepseek/deepseek-chat`, 第 76 行) |
| **API Key** | 环境变量 `DEEPSEEK_API_KEY` (第 71-72 行注释说明); `.env` 文件中明文，**不入 git** |
| **铁律** | 第 4-12 行: LLM **只渲染语言**，绝不选题/评分/改分支。输入 `ProbeTarget` 由确定性状态机定死 |
| **回退** | 第 188-224 行 `render_probe()`: LLM 异常/空输出 → 自动回退到骨架文本 (`fallback=True`)，闭环不断 |
| **调用方** | `api.py` 第 206-237 行 `POST /probe/render` 端点 |

**结论**: LLM 层已是生产就绪的 Protocol 抽象。云上只需通过环境变量注入 DeepSeek Key，无需改代码。回退机制保证 Key 失效时服务不中断（只降级追问质量）。

---

### 1.5 前端与 PWA

| 项目 | 值 |
|------|-----|
| **框架** | React 18 + TypeScript (strict mode + `noUncheckedIndexedAccess`) |
| **构建** | Vite 5 (vite.config.ts) + @vitejs/plugin-react |
| **状态机** | XState 5 (第 16 行 `package.json`: `xstate ^5.19.0`, `@xstate/react ^5.0.0`) |
| **PWA Manifest** | `frontend/public/manifest.webmanifest`: display=standalone, scope="/", 三尺寸图标 + SVG |
| **Service Worker** | `frontend/public/sw.js` (81 行): 手动编写的轻量 SW，无 Workbox 依赖 |
| **SW 策略** | 导航→网络优先/离线回退缓存首页；静态资源→缓存优先回填；API 请求→直连不缓存 |
| **SW 注册** | `frontend/src/main.tsx` 第 16-22 行: `import.meta.env.PROD` 时注册 |
| **离线队列** | `frontend/src/offline/commitQueue.ts` (105 行): IndexedDB 存储 `pending_commits`，联网自动重放 |
| **API 客户端** | `frontend/src/api/client.ts` (166 行): 基址从 `VITE_API_BASE` 环境变量或开发默认 `http://localhost:8000` 或生产空字符串（同源） |
| **测试** | Vitest + jsdom，11 个前端测试文件 |

**结论**: 前端已是完整 PWA — 可安装、离线打开外壳、IndexedDB 暂存数据。后端同源托管（`api.py` StaticFiles）意味一条 uvicorn 命令同时服务 API + 前端，**Nginx 直出或后端托管两种模式都支持**。

---

### 1.6 部署设施现状

```mermaid
packet-beta
0-1: "Dockerfile"
2-3: "docker-compose"
4-5: "Makefile"
6-7: "Shell scripts"
8-9: "CI/CD config"
title: 已存在容器/部署文件
```

- **Dockerfile**: 不存在
- **docker-compose.yml**: 不存在
- **Makefile**: 不存在（项目级）
- **Shell 脚本**: 不存在
- **CI/CD**: 不存在
- **唯一启动入口**: Windows 批处理 `一键启动_成果报备.bat` — 先 `npm run build` 再 `uvicorn main:app`

项目 README (`backend/README.md` 第 33 行) 明确说 **"启动封装（docker-compose / 双击批处理）留到 S6"** — 即当前阶段已到 S6，容器化是计划内工作。

---

## 2. 云部署拓扑设计

### 2.1 总体架构图

```mermaid
graph TB
    subgraph "互联网"
        U[受访者/促进者 浏览器/手机]
    end

    subgraph "阿里云/腾讯云 轻量应用服务器"
        subgraph "Docker 内网"
            NGINX["Nginx\n反向代理\nHTTPS 终止\nTLS 证书\n（Let's Encrypt / 云平台签发）"]
            
            subgraph "backend 服务群"
                API1["uvicorn worker #1\nmain:app\n:8001"]
                API2["uvicorn worker #2\nmain:app\n:8001"]
                API3["uvicorn worker #N\nmain:app\n:8001"]
            end

            subgraph "转写后台（可选）"
                WHISPER["转写 Worker\nfaster-whisper\nCPU int8"]
            end

            POSTGRES[("PostgreSQL 15+\n端口 5432\n定时 pg_dump 备份")]
            MINIO[("MinIO\n对象存储\n音频文件\n生命周期: 7天自动删除")]
        end
        
        subgraph "主机卷"
            DATA_VOL["数据持久卷\npostgres_data/\nminio_data/\nwhisper_cache/"]
            ENV_FILE[".env\n（密钥/配置，不入镜像）"]
        end
    end

    U -->|"HTTPS :443"| NGINX
    NGINX -->|"反向代理 :8001"| API1
    NGINX -->|"反向代理 :8001"| API2
    NGINX -->|"反向代理 :8001"| API3
    NGINX -->|"直出静态 PWA\n/assets/*, /sw.js"| U
    
    API1 -->|SQL| POSTGRES
    API2 -->|SQL| POSTGRES
    API3 -->|SQL| POSTGRES
    
    API1 -->|"S3 协议"| MINIO
    API2 -->|S3| MINIO
    API3 -->|S3| MINIO

    API1 -.->|"Future: 异步任务"| WHISPER
    WHISPER -.-> MINIO
    WHISPER -.-> POSTGRES

    classDef docker fill:#e6f3ff,stroke:#4a90d9
    classDef storage fill:#fff3e6,stroke:#d98a4a
    classDef external fill:#f0f0f0,stroke:#999

    class NGINX,API1,API2,API3,WHISPER docker
    class POSTGRES,MINIO,DATA_VOL storage
    class U external
```

### 2.2 反向代理与 HTTPS

**推荐方案: Nginx**

| 考量 | 选择 | 理由 |
|------|------|------|
| 反向代理 | **Nginx** | 阿里云/腾讯云镜像源直接 `apt install nginx`，文档成熟，师门非专业运维也能维护 |
| TLS 证书 | **云平台免费证书** 或 **acme.sh + Let's Encrypt** | 腾讯云/阿里云提供每年免费 DV 证书；acme.sh 可自动续期 |
| 静态资源 | **Nginx 直出 dist** | 当前后端同源托管（`api.py` StaticFiles）虽能工作，但多 worker 时每 worker 都占内存存静态文件句柄；Nginx 直出更高效，且可加 `Cache-Control` 头、gzip 压缩 |

**Nginx 配置要点**:

```
# /etc/nginx/sites-available/alis.conf

upstream alis_backend {
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    # 按 worker 数量扩展
}

server {
    listen 443 ssl http2;
    server_name alis.example.com;  # 替换为实际域名

    ssl_certificate     /etc/ssl/certs/alis.pem;
    ssl_certificate_key /etc/ssl/private/alis.key;

    # PWA 静态资源 — Nginx 直出（高效）
    root /opt/alis/frontend/dist;
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location /sw.js {
        expires 0;
        add_header Cache-Control "no-cache";
    }
    location /manifest.webmanifest {
        expires 1h;
    }

    # API 反向代理
    location / {
        try_files $uri $uri/ @api;
    }
    location @api {
        proxy_pass http://alis_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**为什么不纯 uvicorn multi-worker?** 纯 `uvicorn --workers 4` 虽然简单，但缺少 TLS 终止、静态文件高效服务、速率限制、访问日志等功能。Nginx + uvicorn 是业界标准组合。

**Gunicorn + uvicorn worker 还是纯 uvicorn?** 推荐**纯 uvicorn multi-worker**（当前代码无需任何改动）。项目是同步 SQLAlchemy（非 async），uvicorn 的 worker 以多进程方式运行，每个 worker 独立处理请求，对于当前 15 题的轻量级访谈场景足够。等未来并发量上升再考虑 Gunicorn + uvicorn workers 的精细进程管理。

---

### 2.3 进程与容器化策略

**推荐方案: Docker Compose**（阶段二再上，阶段一可裸机）

| 方案 | 优点 | 缺点 | 推荐时机 |
|------|------|------|---------|
| 裸机 systemd | 零学习成本，直接 apt install | 依赖手工管理，迁移麻烦 | 阶段一（最小可上线） |
| **Docker Compose** | 可复现、易迁移、服务间网络隔离 | 师门需学基础 Docker 操作 | **阶段二/三**（推荐） |

**Docker Compose 服务拆分**:

| 服务 | 镜像 | 资源需求 | 说明 |
|------|------|---------|------|
| `backend` | `alis-backend:latest` | 1-2 CPU, 1-2 GB RAM | FastAPI 应用，多 worker |
| `postgres` | `postgres:15-alpine` | 1 CPU, 1 GB RAM + 数据卷 | 数据库 |
| `nginx` | `nginx:stable-alpine` | <0.5 CPU | 反向代理 |
| `minio` | `minio/minio:latest` | 1 CPU, 1 GB RAM + 数据卷 | 音频对象存储（阶段二） |
| `transcriber` | `alis-backend` (同镜像不同 entrypoint) | 2+ CPU, 2+ GB RAM | 异步转写 Worker（阶段二/三） |

**关键容器化策略**: 将所有配置通过环境变量注入（`env_file: .env`），不把 `.env` 打进镜像。`backend` 和 `transcriber` 可用同一个镜像不同命令。

---

### 2.4 数据库：SQLite → PostgreSQL

**迁移路径**:

```
当前 (SQLite)         阶段一 (SQLite 继续)        阶段二 (切换)
  alis_local.db  ────  复制到服务器            ────  DATABASE_URL=postgresql://...
  WAL 模式              用 docker 挂载               alembic upgrade head
```

**为何不一开始就上 PostgreSQL?** 阶段一最小可上线时，SQLite 在轻量服务器上 100% 可用。后文 Whsiper 算力分析将说明，当前访谈并发极低（每日几组），SQLite 的 WAL 模式足够。PostgreSQL 迁移仅在数据量上升/需要并发写时才有必要。

**PostgreSQL 切换步骤**（阶段二）：

1. 在服务器安装 PostgreSQL 15+（或在 Compose 中加 postgres 服务）
2. 建 `alis` 数据库，创建专用用户
3. 设置环境变量: `DATABASE_URL=postgresql+psycopg://alis:password@localhost:5432/alis`
4. 运行 `alembic upgrade head`（零代码改动，已验证于 `env.py` 第 26-27 行）
5. 数据迁移: 可选用 `alembic` 不做自动数据迁移，写一个小脚本从 SQLite 导出→导入 PostgreSQL

**备份策略**（阶段二/三）：

```bash
# crontab 每日凌晨自动备份
0 3 * * * pg_dump -U alis -h localhost alis > /backup/alis_$(date +\%F).sql
# 保留最近 30 天，过期清理
0 5 * * * find /backup -name "alis_*.sql" -mtime +30 -delete
```

备份文件应 rsync 到对象存储或另一台机器（异地容灾）。

---

### 2.5 音频对象存储

**需求约束**（源于项目铁律和法规）：

1. 音频文件**只存路径指针**不入数据库（`narrative_segments.audio_file_id` → `String(256)`）
2. 转写核对后**≤7 天删除原始音频**
3. 数据**只能留在境内**（不可用 AWS S3 美西等跨境存储）
4. 音频在本地录制 → 促进者另存 → S5 汇聚管线登记路径指针

**方案比较**:

| 方案 | 运维成本 | 数据出境风险 | 自动删除 | 推荐 |
|------|---------|-------------|---------|:----:|
| **MinIO（自建容器）** | 中（Docker 一键启动） | 无（数据不出服务器） | 需脚本或 S3 生命周期 | ⭐ 推荐 |
| 阿里云 OSS | 低（托管服务） | 无（境内节点） | 生命周期规则原生支持 | 可选 |
| 腾讯云 COS | 低（托管服务） | 无（境内节点） | 生命周期规则原生支持 | 可选 |
| 本地文件系统 | 最低 | 无 | 需 cron 脚本 | 阶段一过渡 |

**推荐: MinIO 容器**（阶段二）

```
MinIO 内网 S3 兼容 API
    │
    ├── bucket: alis-audio
    │   └── lifecycle: 7 天过期
    │
    └── 路径: {session_id}/{segment_id}.webm

通过 SQLAlchemy: narrative_segments.audio_file_id = "minio://alis-audio/{path}"
```

**生命周期规则**（7 天自动删除）:

```bash
# MinIO 自带 mc 客户端配置
mc alias set alisminio http://minio:9000 minioadmin minioadmin
mc ilm rule add alisminio/alis-audio --expire-days 7
```

**阶段一过渡方案**: 直接用服务器本地文件系统存储音频块，cron 脚本每日清理 7 天前的文件：

```bash
# /etc/cron.daily/clean-audio
find /opt/alis/audio -type f -mtime +7 -delete
```

---

### 2.6 Whisper 转写算力评估

**这是本次架构最关键的约束点。**

#### 代码现状

`backend/alis/transcribe.py` 第 53-54 行:
```python
self._model = WhisperModel(self.model_name, device="cpu", compute_type="int8")
```

默认 `base` 模型，`int8` 量化，CPU 推理，中文转录。

#### 各模型规格 vs 轻量服务器

| 模型 | 参数 | 磁盘 | RAM 需求 | 2C4G 单次延迟(估) | 4C8G 单次延迟(估) | 推荐 |
|:----:|:----:|:----:|:--------:|:-----------------:|:-----------------:|:----:|
| `tiny` | 39M | ~75MB | ~300MB | 10-20s | 5-10s | ❌ 中文精度不足 |
| `base` | 74M | ~140MB | ~500MB | 20-40s | 10-20s | ⭐ 当前默认 |
| `small` | 244M | ~465MB | ~1.5GB | 60-120s | 30-60s | ⚠️ 可用但慢 |
| `medium` | 769M | ~1.5GB | ~4GB | >3min | 2-3min | ❌ 超 2C4G 能力 |

> **注**: 以上延迟基于社区 benchmark 推算，未在当前项目的特定硬件上实测。实际性能取决于 CPU 具体型号（至强 / 霄龙 / 鲲鹏 920 等）和并发任务数。

#### 工程判断

**结论**: **2C4G 轻量服务器可以在后台批量跑 Whisper base 中文转写，但不适合实时交互式转写。**

- **单次访谈转写**: 一场约 15 道题，每道题目回答 ~30-60 秒音频。base 模型每段 20-40 秒 → 总转写时间约 5-10 分钟
- **并发**: 师门每日访谈量 ~5-10 场，非高并发场景
- **转写时机**: 当前设计是后端同步调用（`/narrative/register` 需要转写完成才返回）。这意味着用户等待转写完成

**异步化方案对比**:

| 方案 | 复杂度 | 适合阶段 | 说明 |
|------|--------|---------|------|
| FastAPI `BackgroundTasks` | 低 | **阶段一** | 立即返回 202，后台执行转写，完成后回调更新 DB |
| Redis RQ | 中 | 阶段二 | 轻量级任务队列，Redis 做 broker |
| Celery + Redis/RabbitMQ | 高 | 阶段三 | 功能最全但对非运维团队过重 |

**推荐**: 阶段一用 `BackgroundTasks`（FastAPI 内置，零新依赖），阶段二评估是否需要 RQ。

**如果延迟不可接受**: 考虑离线批量转写——促进者白天采集音频，夜间服务器 cron 触发批量转写。这完全符合"转写核对后 ≤7 天删"的铁律。

**不推荐上 GPU 实例**: 阿里云 GPU 实例（如 V100）月租数千元，对师门预算不合理。`base.int8` 在 4C8G 上的 10-20 秒延迟对后台批量转写是完全可以接受的。

---

### 2.7 API-first 多端架构

当前后端是纯 REST API（FastAPI），已生成 OpenAPI 文档（FastAPI 自动）。多端策略如下：

```mermaid
graph LR
    subgraph "当前 (阶段一)"
        PWA1["同源 PWA\n（React SPA）"]
    end
    
    subgraph "未来 (阶段三)"
        PWA2["PWA（React）\n独立域名"]
        APP["手机 App\nFlutter/RN/原生"]
        PC["专门 Web 端\nVue/React"]
    end

    subgraph "后端统一 API"
        API["FastAPI REST API\nOpenAPI 契约"]
    end

    PWA1 -->|"同源无 CORS"| API
    PWA2 -->|"跨域"| API
    APP -->|"跨域"| API
    PC -->|"跨域"| API
```

**需要补充的工作**:

| 工作项 | 优先级 | 说明 |
|--------|--------|------|
| **CORS 策略扩展** | P1 | `api.py` 第 156 行注释说"生产内网部署时按实际域名收紧"，多端场景需要白名单多个域名 |
| **鉴权/会话令牌** | P2 | 当前无用户认证（研究场景下促进者物理控制设备）。多端需引入 JWT / session token |
| **API 版本化** | P2 | 当前无版本前缀（`/session/start`）。建议 `/v1/session/start` 以支持向后兼容 |
| **API Key 鉴权** | P3 | 对第三方接入，考虑发放 API Key 而非用户密码 |
| **速率限制** | P3 | 多端大规模调用时需限流 |

**CORS 配置建议**（阶段三）:

```python
# api.py 中 create_app() 内部
allow_origins = os.environ.get(
    "ALIS_CORS_ORIGINS",
    "https://alis.example.com,https://app.alis.example.com"
).split(",")
```

---

### 2.8 配置与密钥管理

**原则**: 所有密钥和配置通过环境变量注入，不入镜像，不入 git。

| 变量名 | 用途 | 来源 | 必填 |
|--------|------|------|:----:|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 用户从 DeepSeek 控制台获取 | 调试时可选（生产必填） |
| `ALIS_PROBE_MODEL` | LLM 模型名 | 默认 `deepseek/deepseek-chat` | 可选 |
| `DATABASE_URL` | 数据库连接串 | 阶段一不填（默认 SQLite），阶段二必填 | 按阶段 |
| `ALIS_WHISPER_MODEL` | Whisper 模型大小 | 默认 `base` | 可选 |
| `ALIS_CORS_ORIGINS` | 允许的跨域来源 | 根据前端域名配置 | 阶段三必填 |
| `TZ` | 时区 | `Asia/Shanghai` | 推荐 |

**注入方式**:

```bash
# Docker Compose 方式（推荐阶段二后）
# docker-compose.yml 中：
services:
  backend:
    env_file: .env

# 或 systemd 方式（阶段一）
# /etc/systemd/system/alis-backend.service
[Service]
EnvironmentFile=/opt/alis/.env
ExecStart=/opt/alis/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001
```

**.env 文件模板**:

```ini
# ALIS 服务器环境变量 —— 此文件打在服务器上，不入镜像，不入 git
ALIS_PROBE_MODEL=deepseek/deepseek-chat
DEEPSEEK_API_KEY=your-key-here
DATABASE_URL=sqlite:///./data/alis.db
ALIS_WHISPER_MODEL=base
TZ=Asia/Shanghai
```

---

### 2.9 可观测与运维底线

| 维度 | 实现 | 说明 |
|------|------|------|
| **健康检查** | `GET /health` 已有 | 返回 `{"status": "ok", "scale_version": ...}` |
| **日志** | uvicorn 日志 → stdout → Docker 日志驱动 / systemd journal | 建议 JSON 格式方便索引 |
| **开机自启** | Docker: `restart: always`; systemd: `WantedBy=multi-user.target` | 容器/服务崩溃自动重启 |
| **崩溃重启** | systemd `Restart=on-failure` 或 Docker `restart: unless-stopped` | 后端进程崩了自动拉起 |
| **磁盘监控** | 腾讯云/阿里云自带基础监控 | 需额外设置磁盘使用率告警（音频可能快速涨） |
| **进程监控** | `supervisor` 或 Docker healthcheck | 可选 |

**最小的 systemd 服务文件**（阶段一）:

```ini
# /etc/systemd/system/alis-backend.service
[Unit]
Description=ALIS Backend API
After=network.target

[Service]
Type=simple
User=alis
WorkingDirectory=/opt/alis/backend
EnvironmentFile=/opt/alis/.env
ExecStart=/opt/alis/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001 --workers 2
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**日志轮转**:

```bash
# /etc/logrotate.d/alis
/opt/alis/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

---

## 3. 分阶段落地路线

### 阶段一：最小可上线（1-2 天）

**目标**: 把现有成品搬上国内轻量服务器，师门通过域名远程访问，供内测。

**服务器规格推荐**: 阿里云/腾讯云 **2C4G** 轻量应用服务器（~60-80 元/月），系统 Ubuntu 22.04 LTS

**工程动作**:

| # | 动作 | 涉及文件 |
|---|------|---------|
| 1 | 在服务器安装 Python 3.11+、Node.js 18+、Nginx | — |
| 2 | 从 git 拉取代码到 `/opt/alis/` | — |
| 3 | `cd backend && python -m venv .venv && pip install -r requirements.txt` | `backend/requirements.txt` |
| 4 | 手动装 `litellm>=1.40` 和 `faster-whisper>=1.0`（之前注释掉的） | `backend/requirements.txt` |
| 5 | `cd frontend && npm ci && npm run build` | 构建 PWA 到 `frontend/dist/` |
| 6 | 创建 `/opt/alis/.env` 填入 DeepSeek Key 等配置 | `.env` |
| 7 | 配置 Nginx 反向代理 + 免费 HTTPS 证书（云平台签发或用 acme.sh） | Nginx config |
| 8 | 配置 systemd 服务 | alis-backend.service |
| 9 | `alembic upgrade head` 初始化数据库 | `backend/alembic/` |
| 10 | 启动服务、验证 `/health` 端点、浏览器打开 HTTPS 域名 | — |

**工作量**: 1-2 天（含 Nginx 配置和证书申请）

**阶段一架构**:

```mermaid
graph LR
    U["浏览器/手机"] -->|"HTTPS"| N["Nginx\n（TLS + 直出 dist）"]
    N -->|"反向代理 :8001"| B["uvicorn * 2 workers\nmain:app"]
    B -->|"SQLite\n（数据卷挂载）"| D["alis_local.db\nWAL 模式"]
    B -->|"本地文件"| A["/opt/alis/audio/\n（cron 7天清理）"]
```

---

### 阶段二：加固（1-2 周）

**目标**: 数据安全加固、音频对象存储、异步转写、容器化。

**工程动作**:

| # | 动作 | 优先级 |
|---|------|--------|
| 1 | ✨ **编写 Dockerfile + docker-compose.yml** | P0 |
| 2 | 引入 PostgreSQL 15 容器，切换 `DATABASE_URL` | P0 |
| 3 | 数据从 SQLite 迁移到 PostgreSQL | P0 |
| 4 | 引入 MinIO 容器，音频改存 MinIO bucket | P1 |
| 5 | 配置 MinIO 生命周期规则（7 天自动删除） | P1 |
| 6 | 将后端 `/narrative/register` 改为异步（BackgroundTasks 或 RQ） | P1 |
| 7 | 实现定时数据库备份（pg_dump cron + 异地 rsync） | P1 |
| 8 | 配置 Docker healthcheck 和日志驱动 | P2 |
| 9 | 收紧 CORS 白名单为实际域名 | P2 |
| 10 | 增加 `/health` 详细检查（数据库连接、磁盘空间） | P2 |

**Dockerfile 示例**:

```dockerfile
FROM python:3.11-slim AS backend
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir "litellm>=1.40" "faster-whisper>=1.0"
COPY backend/ .
RUN alembic upgrade head
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json .
RUN npm ci
COPY frontend/ .
RUN npm run build
```

**工作量**: 1-2 周

---

### 阶段三：多端就绪（2-4 周）

**目标**: API 分层、鉴权、面向手机 App / 专门 Web / PC 端的稳定契约。

**工程动作**:

| # | 动作 | 说明 |
|---|------|------|
| 1 | API 路由增加 `/v1/` 前缀（原路由保留重定向） | 向后兼容 |
| 2 | 引入会话鉴权（JWT 或 session token） | 当前无认证，多端需用户身份 |
| 3 | 扩展 CORS 白名单为多域名 | 见 2.7 节 |
| 4 | 完善 OpenAPI 文档（添加请求示例、响应描述） | FastAPI 自动生成，但需补充 |
| 5 | 评估 RQ/Celery 任务队列 | 若转写并发上升 |
| 6 | 评估 GPU 实例 | 若 Whisper small/medium 需要 |
| 7 | 写 API 版本迁移指南 | 供 App/Web 开发者使用 |

**工作量**: 2-4 周（主要取决于鉴权方案复杂度）

---

## 4. 需赖培胜协调事项

> 以下事项涉及采购、密钥、硬件选择，需要项目负责人赖培胜（LPS/朝闻道）决策或执行。

### 4.1 服务器采购

| 项目 | 建议配置 | 估费 | 说明 |
|------|---------|------|------|
| **阶段一** | 阿里云/腾讯云 **2C4G** 轻量应用服务器 | ~60-80 元/月 | Ubuntu 22.04, 40GB SSD + 3Mbps 带宽 |
| **阶段二** | 扩容至 **4C8G**（或同规格 ECS） | ~120-180 元/月 | 多 Postgres + MinIO 容器后 RAM 紧张 |
| **域名** | 注册一个简短二级域名（如 `alis.xxx.cn`） | ~30-50 元/年 | 需 ICP 备案（国内服务器必备案） |

> **ICP 备案提醒**: 国内服务器绑域名必须 ICP 备案。备案周期 1-2 周，建议尽早启动。

### 4.2 密钥与账户

| 项目 | 状态 | 动作 |
|------|------|------|
| DeepSeek API Key | ✅ `.env` 中已有（`DEEPSEEK_API_KEY`） | 确认 Key 余额/是否需续费 |
| 云平台账户 | ❌ 未开通 | 注册阿里云/腾讯云、实名认证 |
| SSL 证书 | ❌ 待申请 | 云平台免费 DV 证书或 Let's Encrypt |

### 4.3 数据合规确认

| 事项 | 说明 |
|------|------|
| IRB 审核 | 确认服务器上线是否需要 IRB 补充审核 |
| 数据出境 | 确认云节点地域（建议华东/华南，避免跨境） |
| 音频删除 | 铁律要求 ≤7 天删除原始音频，需师门确认自动化删除策略 |
| 知情同意 | 受访者是否明确知道数据将存储在哪台服务器上 |

### 4.4 师门运维能力评估

| 能力 | 当前水平 | 所需 |
|------|---------|------|
| Linux 基础命令 | 待确认 | ls/cd/vim/systemctl |
| Docker | 待确认 | docker-compose up/down/logs |
| Nginx 配置 | 待确认 | 修改 sites-available, reload |
| 数据库操作 | 待确认 | pg_dump, psql 基本查询 |

> 如果师门无 Linux 运维经验，建议阶段一由赖培胜主导部署，后续运维由 Docker 封装降低复杂度。

---

## 5. 不确定与待验证项

1. **Whisper 在 2C4G/4C8G 上的实际延迟**: 以上延迟基于社区基准推算，需在具体型号 CPU（如 Intel Xeon Platinum / AMD EPYC / 华为鲲鹏 920）上实测。建议阶段一部署后用 3-5 个真实音频文件验证。

2. **faster-whisper base 在 2C4G 上是否内存不足**: `int8` 量化后的 base 模型约 500MB RAM。2C4G 服务器同时跑 uvicorn 2 workers + Nginx + Whisper 转写时，总内存约 2-2.5GB，2C4G 的 4GB 勉强够。如果实际上限是 3GB（云服务器通常有预留），则可能需要升级到 4C8G。

3. **SQLite WAL 在 NFS 挂载卷上的表现**: 如果数据卷是云平台网络盘（而非本地 SSD），SQLite WAL 性能可能退化。建议数据库文件放在本地系统盘。

4. **litellm 在中国区网络访问 DeepSeek 的稳定性**: 阿里云/腾讯云访问 `api.deepseek.com` 可能需要额外的网络配置。需验证服务器能否直接 HTTPS 连接 DeepSeek API，是否需要配置 HTTP 代理。

5. **PWA 在 HTTPS 环境下的 MediaRecorder 行为**: MediaRecorder 需要安全上下文（HTTPS 或 localhost）。部署后在真实手机/平板上测试录音是否正常工作。

6. **移动端 PWA 的 IndexedDB 持久性**: 某些浏览器（特别是微信内置浏览器）可能在关闭时清除 IndexedDB。需测试离线队列数据在移动端的持久性。

---

## 附录：关键文件路径速查

| 组件 | 文件路径 |
|------|---------|
| ASGI 入口 | `D:\AI素养 调查\alis-mvp\backend\main.py` |
| 应用工厂 | `D:\AI素养 调查\alis-mvp\backend\alis\api.py` |
| 数据库引擎 | `D:\AI素养 调查\alis-mvp\backend\alis\db.py` |
| ORM 模型 | `D:\AI素养 调查\alis-mvp\backend\alis\models.py` |
| 持久化层 | `D:\AI素养 调查\alis-mvp\backend\alis\store.py` |
| LLM 探针 | `D:\AI素养 调查\alis-mvp\backend\alis\probe.py` |
| 音频转写 | `D:\AI素养 调查\alis-mvp\backend\alis\transcribe.py` |
| 依赖清单 | `D:\AI素养 调查\alis-mvp\backend\requirements.txt` |
| Alembic 配置 | `D:\AI素养 调查\alis-mvp\backend\alembic.ini` |
| Alembic 环境 | `D:\AI素养 调查\alis-mvp\backend\alembic\env.py` |
| 初始迁移 | `D:\AI素养 调查\alis-mvp\backend\alembic\versions\0001_initial.py` |
| 前端入口 | `D:\AI素养 调查\alis-mvp\frontend\index.html` |
| PWA Manifest | `D:\AI素养 调查\alis-mvp\frontend\public\manifest.webmanifest` |
| Service Worker | `D:\AI素养 调查\alis-mvp\frontend\public\sw.js` |
| API 客户端 | `D:\AI素养 调查\alis-mvp\frontend\src\api\client.ts` |
| 离线队列 | `D:\AI素养 调查\alis-mvp\frontend\src\offline\commitQueue.ts` |
| Vite 配置 | `D:\AI素养 调查\alis-mvp\frontend\vite.config.ts` |
| 录音组件 | `D:\AI素养 调查\alis-mvp\frontend\src\ui\Recorder.tsx` |
| 项目依赖 | `D:\AI素养 调查\alis-mvp\frontend\package.json` |
| 启动脚本 | `D:\AI素养 调查\alis-mvp\一键启动_成果报备.bat` |

---

*本报告由 ALIS 云部署技术架构研究员基于代码勘查和社区基准撰写。Whisper 延迟数据需在目标服务器上实测验证。*  
*报告日期: 2026-07-11*
