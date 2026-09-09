# AI协作风格访谈引擎 - MVP技术实现方案

## 一、MVP产品定位

### 1.1 核心目标
- 验证核心概念的可行性
- 测试访谈流程的完整性
- 收集用户反馈和数据
- 为后续迭代提供基础

### 1.2 MVP功能范围
**包含功能**：
- ✅ 15道AI素养题目测试
- ✅ 4个维度评分计算
- ✅ 8种协作风格判定
- ✅ 基础风格画像展示
- ✅ 简化版追问系统
- ✅ 访谈记录保存

**暂不包含功能**：
- ❌ 复杂矛盾检测
- ❌ 自适应追问路径
- ❌ 高级数据分析
- ❌ 多用户并发
- ❌ 数据可视化dashboard

---

## 二、技术栈选择

### 2.1 前端技术栈
```
核心框架：Vue.js 3.0 (Composition API)
UI组件库：Element Plus / Ant Design Vue
状态管理：Pinia
路由：Vue Router
HTTP客户端：Axios
实时通信：WebSocket (Socket.io)
```

**选择理由**：
- Vue.js 学习曲线平缓，适合快速开发
- 丰富的中文社区和组件库
- 良好的响应式数据绑定
- 易于维护和扩展

### 2.2 后端技术栈
```
核心框架：FastAPI (Python 3.10+)
API文档：Swagger UI / ReDoc
数据库：SQLite (MVP) -> PostgreSQL (生产)
ORM：SQLAlchemy
异步处理：asyncio + aiohttp
实时通信：WebSocket
```

**选择理由**：
- FastAPI 现代化、高性能
- 自动生成API文档
- 原生异步支持
- 类型提示友好
- Python生态丰富（便于后期集成LLM）

### 2.3 数据存储
```
主数据库：SQLite (单文件，零配置)
缓存：Redis (可选，用于会话管理)
文件存储：本地文件系统（访谈记录）
```

**选择理由**：
- MVP阶段无需复杂数据库运维
- SQLite足够支撑小规模测试
- 易于备份和迁移
- 后期可平滑迁移到PostgreSQL

---

## 三、系统架构设计

### 3.1 整体架构图
```
┌─────────────────┐
│  前端 (Vue.js)  │
│  ┌───────────┐  │
│  │  问卷展示 │  │
│  │  结果展示 │  │
│  │  追问界面 │  │
│  └───────────┘  │
└────────┬────────┘
         │ HTTP/WebSocket
         ↓
┌─────────────────┐
│  后端 (FastAPI) │
│  ┌───────────┐  │
│  │ API层     │  │
│  │ 业务逻辑层│  │
│  │ 数据访问层│  │
│  └───────────┘  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  数据层 (SQLite) │
│  ┌───────────┐  │
│  │ 用户数据  │  │
│  │ 访谈数据  │  │
│  │ 配置数据  │  │
│  └───────────┘  │
└─────────────────┘
```

### 3.2 核心模块划分

#### Module 1: 问卷模块 (Questionnaire Module)
```python
# 主要功能
- 题目配置管理
- 答题流程控制
- 答案数据收集
- 答案验证

# API端点
GET  /api/questions          # 获取题目列表
POST /api/responses          # 提交答案
GET  /api/responses/{id}     # 获取答案记录
```

#### Module 2: 评分模块 (Scoring Module)
```python
# 主要功能
- 维度分数计算
- 倾向判定
- 协作风格判定
- 置信度计算

# API端点
POST /api/calculate/dimensions     # 计算维度得分
POST /api/calculate/style         # 判定协作风格
GET  /api/calculate/result/{id}   # 获取完整结果
```

#### Module 3: 画像模块 (Profile Module)
```python
# 主要功能
- 风格画像生成
- 个性化反馈生成
- 追问问题生成
- 反思问题生成

# API端点
GET  /api/profile/{style_id}           # 获取风格画像
POST /api/profile/generate             # 生成个性化画像
GET  /api/profile/reflection-questions # 获取反思问题
```

#### Module 4: 追问模块 (Follow-up Module)
```python
# 主要功能
- 追问问题生成
- 对话状态管理
- 答案分析
- 路径选择

# API端点
POST /api/follow-up/generate          # 生成追问问题
POST /api/follow-up/submit-answer     # 提交追问答案
GET  /api/follow-up/history/{id}      # 获取追问历史
```

#### Module 5: 访谈模块 (Interview Module)
```python
# 主要功能
- 访谈会话管理
- 实时通信
- 访谈记录保存
- 访谈状态同步

# API端点
WebSocket /ws/interview/{session_id}  # 实时访谈连接
POST    /api/interview/start          # 开始访谈
POST    /api/interview/end            # 结束访谈
GET     /api/interview/{id}           # 获取访谈记录
```

---

## 四、数据库设计

### 4.1 数据表结构

#### Table: users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON  -- 存储额外的用户信息
);
```

#### Table: responses
```sql
CREATE TABLE responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id VARCHAR(10) NOT NULL,
    answer INTEGER NOT NULL,  -- 1-7 Likert scale
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_spent INTEGER,  -- 答题用时（秒）
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Table: dimension_scores
```sql
CREATE TABLE dimension_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    dimension_name VARCHAR(50) NOT NULL,
    score FLOAT NOT NULL,
    tendency VARCHAR(50) NOT NULL,
    confidence FLOAT NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Table: collaboration_styles
```sql
CREATE TABLE collaboration_styles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    primary_style VARCHAR(50) NOT NULL,
    secondary_style VARCHAR(50),
    confidence FLOAT NOT NULL,
    matched_styles JSON,  -- 存储所有匹配的风格
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Table: interviews
```sql
CREATE TABLE interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'in_progress',  -- in_progress, completed, abandoned
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_duration INTEGER,  -- 总时长（秒）
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Table: follow_up_questions
```sql
CREATE TABLE follow_up_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interview_id INTEGER NOT NULL,
    node_id VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL,
    asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answer TEXT,
    answered_at TIMESTAMP,
    FOREIGN KEY (interview_id) REFERENCES interviews(id)
);
```

---

## 五、核心算法实现

### 5.1 维度计算实现
```python
# services/dimension_calculator.py

class DimensionCalculator:
    def __init__(self):
        self.dimension_configs = self._load_dimension_configs()

    def calculate_dimensions(self, responses):
        """计算所有维度得分"""
        results = {}

        for dimension_name, config in self.dimension_configs.items():
            dimension_score = self._calculate_single_dimension(
                dimension_name, config, responses
            )
            results[dimension_name] = dimension_score

        return results

    def _calculate_single_dimension(self, dimension_name, config, responses):
        """计算单个维度得分"""
        questions = config['questions']
        weights = config['weights']

        weighted_sum = 0
        weight_sum = 0

        for question_id in questions:
            if question_id in responses:
                answer = responses[question_id]
                weight = weights.get(question_id, 1.0)
                weighted_sum += answer * weight
                weight_sum += weight

        final_score = weighted_sum / weight_sum if weight_sum > 0 else 0

        return {
            'score': round(final_score, 2),
            'tendency': self._determine_tendency(final_score),
            'confidence': self._calculate_confidence(questions, responses)
        }

    def _determine_tendency(self, score):
        """判定倾向"""
        if score >= 5.5:
            return 'strong_A'
        elif score >= 4.5:
            return 'moderate_A'
        elif score >= 3.5:
            return 'neutral'
        elif score >= 2.5:
            return 'moderate_B'
        else:
            return 'strong_B'
```

### 5.2 风格判定实现
```python
# services/style_classifier.py

class StyleClassifier:
    def __init__(self):
        self.style_rules = self._load_style_rules()

    def classify_style(self, dimension_scores, responses):
        """判定协作风格"""
        matched_styles = []

        for style_name, style_config in self.style_rules.items():
            if self._check_style_match(style_name, style_config, dimension_scores, responses):
                matched_styles.append(style_name)

        # 选择置信度最高的风格
        if matched_styles:
            primary_style = matched_styles[0]  # 简化版直接取第一个
            confidence = self._calculate_confidence(primary_style, dimension_scores, responses)
        else:
            primary_style = "AI平衡者"
            confidence = 0.5

        return {
            'primary_type': primary_style,
            'confidence': confidence,
            'matched_styles': matched_styles
        }

    def _check_style_match(self, style_name, style_config, dimension_scores, responses):
        """检查风格匹配条件"""
        conditions = style_config.get('required_conditions', [])
        matched_count = 0

        for condition in conditions:
            if self._evaluate_condition(condition, dimension_scores, responses):
                matched_count += 1

        # 至少满足50%的条件
        return matched_count / len(conditions) >= 0.5 if conditions else False
```

---

## 六、前端实现要点

### 6.1 问卷组件设计
```vue
<!-- Questionnaire.vue -->
<template>
  <div class="questionnaire-container">
    <div class="progress-bar">
      <el-progress :percentage="progress" />
    </div>

    <div class="question-card" v-if="currentQuestion">
      <h3>{{ currentQuestion.text }}</h3>

      <div class="likert-scale">
        <el-radio-group v-model="currentAnswer">
          <el-radio
            v-for="option in likertOptions"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </el-radio>
        </el-radio-group>
      </div>

      <div class="navigation">
        <el-button @click="previousQuestion" :disabled="currentIndex === 0">
          上一题
        </el-button>
        <el-button
          type="primary"
          @click="nextQuestion"
          :disabled="!currentAnswer"
        >
          {{ currentIndex === questions.length - 1 ? '提交' : '下一题' }}
        </el-button>
      </div>
    </div>
  </div>
</template>
```

### 6.2 结果展示组件设计
```vue
<!-- ResultProfile.vue -->
<template>
  <div class="result-profile">
    <div class="style-header">
      <div class="emoji">{{ profile.emoji }}</div>
      <h1>{{ profile.style_name }}</h1>
      <p class="english-name">{{ profile.name_en }}</p>
    </div>

    <div class="description">
      {{ profile.description }}
    </div>

    <div class="strengths">
      <h3>你的优势</h3>
      <div
        v-for="strength in profile.strengths"
        :key="strength.title"
        class="strength-item"
      >
        <h4>{{ strength.title }}</h4>
        <p>{{ strength.description }}</p>
      </div>
    </div>

    <div class="blind-spots">
      <h3>需要注意的地方</h3>
      <div
        v-for="blindspot in profile.blind_spots"
        :key="blindspot.title"
        class="blindspot-item"
      >
        <h4>{{ blindspot.title }}</h4>
        <p>{{ blindspot.description }}</p>
        <el-alert type="warning" :closable="false">
          {{ blindspot.reflection_question }}
        </el-alert>
      </div>
    </div>

    <div class="reflection-questions">
      <h3>思考一下</h3>
      <div
        v-for="(question, index) in profile.reflection_questions"
        :key="index"
        class="reflection-item"
      >
        {{ question }}
      </div>
    </div>
  </div>
</template>
```

---

## 七、开发计划

### 7.1 开发阶段划分

#### Phase 1: 基础架构搭建 (Week 1-2)
**目标**：搭建开发环境和基础框架
- [ ] 项目初始化
- [ ] 数据库设计和创建
- [ ] 基础API框架搭建
- [ ] 前端路由和状态管理配置

#### Phase 2: 核心功能开发 (Week 2-3)
**目标**：实现问卷和评分功能
- [ ] 问卷模块开发
- [ ] 评分模块开发
- [ ] 风格判定模块开发
- [ ] 前端问卷界面开发

#### Phase 3: 结果展示和追问 (Week 3-4)
**目标**：实现结果展示和基础追问
- [ ] 画像模块开发
- [ ] 追问模块开发
- [ ] 前端结果展示界面
- [ ] 前端追问界面

#### Phase 4: 测试和优化 (Week 4-5)
**目标**：系统测试和优化
- [ ] 功能测试
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] Bug修复

#### Phase 5: 试点和数据收集 (Week 5-6)
**目标**：小规模用户测试
- [ ] 招募测试用户
- [ ] 收集用户反馈
- [ ] 分析访谈数据
- [ ] 迭代优化

---

## 八、技术实现的关键考虑

### 8.1 数据验证
```python
# 中间件：答案验证
from pydantic import BaseModel, Field, validator

class AnswerSubmit(BaseModel):
    question_id: str = Field(..., regex=r'^Q\d+$')
    answer: int = Field(..., ge=1, le=7)

    @validator('answer')
    def validate_answer_range(cls, v):
        if v < 1 or v > 7:
            raise ValueError('答案必须在1-7之间')
        return v
```

### 8.2 错误处理
```python
# 统一错误处理
from fastapi import HTTPException

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
    )

# 业务逻辑错误
class CalculationError(Exception):
    """计算错误"""
    pass

@app.exception_handler(CalculationError)
async def calculation_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"message": f"计算错误: {str(exc)}"},
    )
```

### 8.3 日志记录
```python
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_interview.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# 使用日志
logger.info(f"用户 {user_id} 完成问卷")
logger.error(f"计算维度得分失败: {str(e)}")
```

---

## 九、部署方案

### 9.1 本地开发环境
```bash
# 后端环境
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 前端环境
cd frontend
npm install
npm run dev
```

### 9.2 生产部署方案（简化版）
```bash
# 使用Docker容器化
docker-compose up -d

# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## 十、性能优化考虑

### 10.1 前端优化
- 代码分割和懒加载
- 图片压缩和CDN
- 响应式数据优化
- 虚拟滚动（长列表）

### 10.2 后端优化
- 异步处理
- 数据库查询优化
- 缓存策略
- API响应压缩

### 10.3 数据库优化
- 索引优化
- 查询优化
- 数据归档策略

---

## 十一、安全和隐私

### 11.1 数据安全
- HTTPS加密传输
- 数据库加密存储
- 定期备份
- 访问日志记录

### 11.2 用户隐私
- 会话匿名化
- 数据最小化收集
- 用户数据删除机制
- 隐私政策声明

---

## 十二、监控和运维

### 12.1 应用监控
- API响应时间监控
- 错误率监控
- 用户行为分析
- 系统资源监控

### 12.2 日志管理
- 访问日志
- 错误日志
- 业务日志
- 安全日志

---

这个MVP技术方案为您提供了一个清晰的实施路径，从基础架构到核心功能，再到测试部署，都有详细的技术指导。您可以根据实际情况调整优先级和技术选型，但核心架构和设计思路可以作为开发的基础。
