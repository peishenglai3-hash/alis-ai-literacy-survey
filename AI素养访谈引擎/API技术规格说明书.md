# API技术规格说明书 v1.0

## 文档说明

**目的**：为开发者提供完整的API接口规范，确保前后端协作顺畅
**适用阶段**：MVP开发阶段（6周）
**技术栈**：FastAPI (Python 3.10+) + Vue.js 3.0
**基准URL**：`http://localhost:8000/api/v1`

---

## 1. 通用规范

### 1.1 请求格式
```http
POST /api/v1/endpoint HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Bearer {token}  // MVP阶段可选
```

### 1.2 响应格式
**成功响应** (HTTP 200):
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

**错误响应** (HTTP 4xx/5xx):
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "详细错误信息",
    "details": {}
  },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### 1.3 错误码定义
| 错误码 | HTTP状态 | 说明 | 处理建议 |
|--------|---------|------|----------|
| INVALID_REQUEST | 400 | 请求参数无效 | 检查请求格式 |
| UNAUTHORIZED | 401 | 未授权 | MVP阶段可忽略 |
| NOT_FOUND | 404 | 资源不存在 | 检查请求路径 |
| CALCULATION_ERROR | 422 | 计算错误 | 检查输入数据 |
| INTERNAL_ERROR | 500 | 服务器内部错误 | 联系开发者 |

---

## 2. 核心端点规范

### 2.1 问卷模块 (Questionnaire Module)

#### 2.1.1 获取题目列表
```http
GET /api/v1/questionnaire/questions
```

**响应**：
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "Q1",
        "text": "我通常能够判断，一个应用或服务是否真正使用了AI，而不仅仅是在宣传中提到AI",
        "dimension": "AI_Orientation",
        "dimension_aspect": "能力识别",
        "order": 1
      },
      {
        "id": "Q2",
        "text": "我发现，自己已经越来越容易注意到生活中哪些地方正在使用AI",
        "dimension": "AI_Orientation",
        "dimension_aspect": "感知敏感度",
        "order": 2
      }
      // ... 共15道题
    ],
    "likert_scale": {
      "min": 1,
      "max": 7,
      "labels": {
        "1": "非常不同意",
        "2": "不同意",
        "3": "有点不同意",
        "4": "中立",
        "5": "有点同意",
        "6": "同意",
        "7": "非常同意"
      }
    }
  }
}
```

#### 2.1.2 提交问卷答案
```http
POST /api/v1/questionnaire/submit
```

**请求体**：
```json
{
  "session_id": "uuid-string",  // 可选，前端生成或后端返回
  "responses": {
    "Q1": 6,
    "Q2": 5,
    "Q3": 7,
    "Q4": 4,
    "Q5": 6,
    "Q6": 5,
    "Q7": 6,
    "Q8": 5,
    "Q9": 6,
    "Q10": 4,
    "Q11": 5,
    "Q12": 6,
    "Q13": 5,
    "Q14": 4,
    "Q15": 5
  },
  "metadata": {
    "start_time": "2025-01-15T10:00:00Z",
    "end_time": "2025-01-15T10:05:00Z",
    "total_duration": 300
  }
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-string",
    "user_id": "user-uuid",
    "calculation_status": "completed",
    "journey_plan": {
      "user_framework": {
        "style_type": "AI协作者",
        "style_name_en": "AI Collaborator",
        "confidence": 0.85,
        "emoji": "🤝"
      },
      "total_stages": 6,
      "current_stage": 1,
      "estimated_duration": "45-60分钟",
      "stage_questions": {
        "1": ["Q1", "Q2"],
        "2": ["Q3", "Q4", "Q5", "Q6"],
        "3": ["Q7", "Q8", "Q9", "Q12"],
        "4": ["Q10", "Q11", "Q14"],
        "5": ["Q10", "Q11"],
        "6": ["Q14", "Q15"]
      }
    },
    "next_action": "start_journey"
  }
}
```

### 2.2 旅程模块 (Journey Module)

#### 2.2.1 开始阶段
```http
POST /api/v1/journey/stage/{stage_id}/start
```

**路径参数**：
- `stage_id`: 阶段ID (1-6)

**请求体**：
```json
{
  "session_id": "uuid-string"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "stage_id": 3,
    "stage_name": "信任AI",
    "stage_emoji": "🔍",
    "stage_objective": "探索你如何建立对AI的信任",
    "entry_question": "你在Q7中选择了'非常同意'：即使遇到复杂问题，也能逐步利用AI解决。作为'AI协作者'，你什么时候愿意信任AI处理复杂问题？",
    "framework_lens": "从'AI协作者'框架看：用户的信任判断机制",
    "questions_in_stage": ["Q7", "Q8", "Q9", "Q12"],
    "current_question": "Q7",
    "framework_card_data": {
      "framework_name": "AI协作者",
      "framework_name_en": "AI Collaborator",
      "current_stage": "信任AI",
      "stage_progress": "2/6",
      "stage_questions": ["Q7: 解决过程信任", "Q8: 判断能力", "Q9: 边界意识", "Q12: 质疑精神"],
      "stage_discoveries": [],
      "journey_progress_bar": "✅ ✅ 🔄 ⏳ ⏳ ⏳"
    }
  }
}
```

#### 2.2.2 提交追问回答
```http
POST /api/v1/journey/follow-up/submit
```

**请求体**：
```json
{
  "session_id": "uuid-string",
  "stage_id": 3,
  "question_id": "Q8",
  "user_response": "我会在重要事情上验证，比如工作相关的任务。日常小事就不太验证。",
  "question_context": {
    "original_answer": 5,
    "follow_up_layer": 2  // 1=经验唤起, 2=框架连接, 3=矛盾检测, 4=AI素养桥接, 5=反思深化
  }
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "follow_up_questions": [
      {
        "layer": 1,
        "question": "作为'AI协作者'，你的验证标准是什么？",
        "type": "framework_connection",
        "framework_reference": "AI协作者"
      },
      {
        "layer": 2,
        "question": "你既愿意信任AI处理复杂问题（Q7高分），又会验证结果（Q8高分）。这种'选择性信任'你是如何管理的？",
        "type": "contradiction_detection",
        "contradiction_type": "信任与验证平衡"
      },
      {
        "layer": 3,
        "question": "你知道吗？这种判断AI可信度的能力，正是AI素养的核心：'批判性评估'。你觉得这种能力重要吗？",
        "type": "ai_literacy_bridge",
        "ai_literacy_concept": "批判性评估"
      }
    ],
    "framework_discovery": {
      "discovery_text": "选择性验证能力",
      "framework_interpretation": "作为AI协作者，你已经形成了选择性信任机制"
    },
    "conversation_update": {
      "system_message": "你在Q8中选择了'比较同意'：能够判断AI什么时候值得相信",
      "user_response": "我会在重要事情上验证...",
      "follow_up_triggered": "作为'AI协作者'，你的验证标准是什么？",
      "timestamp": "2025-01-15T10:10:00Z"
    }
  }
}
```

#### 2.2.3 完成阶段
```http
POST /api/v1/journey/stage/{stage_id}/complete
```

**请求体**：
```json
{
  "session_id": "uuid-string",
  "stage_discoveries": [
    "选择性验证能力",
    "情境化信任判断"
  ],
  "user_reflection": "通过这段旅程，我意识到我的信任判断不是简单的信或不信，而是基于情境的选择性验证。"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "stage_completed": 3,
    "closure_message": "✨ 本阶段完成！\n\n💡 我们发现了：\n• 选择性验证能力\n• 情境化信任判断\n\n作为'AI协作者'，你的选择性信任体现了什么？",
    "has_next_stage": true,
    "next_stage_id": 4,
    "next_stage_preview": {
      "stage_id": 4,
      "stage_name": "与AI相处",
      "stage_emoji": "🤖",
      "questions_in_stage": ["Q10", "Q11", "Q14"]
    },
    "journey_summary": {
      "total_stages": 6,
      "completed_stages": 3,
      "current_stage": 3,
      "total_discoveries": 5,
      "conversation_turns": 12,
      "completion_rate": 0.5
    }
  }
}
```

### 2.3 计算模块 (Calculation Module)

#### 2.3.1 计算维度得分
```http
POST /api/v1/calculate/dimensions
```

**请求体**：
```json
{
  "responses": {
    "Q1": 6,
    "Q2": 5,
    // ... 所有15道题
  }
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "dimensions": {
      "AI_Orientation": {
        "score": 5.5,
        "tendency": {
          "level": "strong_A",
          "type": "Explorer",
          "confidence": 0.85
        },
        "component_questions": ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"],
        "raw_scores": {
          "Q1": 6,
          "Q2": 5,
          "Q3": 7,
          "Q4": 4,
          "Q5": 6,
          "Q6": 5
        }
      },
      "AI_Trust": {
        "score": 5.2,
        "tendency": {
          "level": "moderate_A",
          "type": "Collaborator",
          "confidence": 0.72
        },
        "component_questions": ["Q5", "Q7", "Q8", "Q9", "Q12"]
      },
      "AI_Relationship": {
        "score": 4.8,
        "tendency": {
          "level": "moderate_A",
          "type": "Integrated",
          "confidence": 0.65
        },
        "component_questions": ["Q2", "Q3", "Q9", "Q10", "Q11", "Q14"]
      },
      "AI_Responsibility": {
        "score": 5.0,
        "tendency": {
          "level": "neutral",
          "type": "Self-focused",
          "confidence": 0.70
        },
        "component_questions": ["Q10", "Q11", "Q12", "Q13", "Q15"]
      }
    }
  }
}
```

#### 2.3.2 判定协作风格
```http
POST /api/v1/calculate/style
```

**请求体**：
```json
{
  "dimension_scores": {
    "AI_Orientation": {"score": 5.5, "type": "Explorer"},
    "AI_Trust": {"score": 5.2, "type": "Collaborator"},
    "AI_Relationship": {"score": 4.8, "type": "Integrated"},
    "AI_Responsibility": {"score": 5.0, "type": "Self-focused"}
  },
  "responses": {
    "Q5": 6,
    "Q7": 6,
    // ... 关键题目
  }
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "primary_style": "AI协作者",
    "secondary_style": "AI探索者",
    "confidence": 0.82,
    "matched_styles": ["AI协作者", "AI探索者"],
    "match_reasons": [
      "强协作意愿（Q5=6, Q7=6）",
      "融合型关系模式（Q14=4, Q2=5）",
      "平衡的责任模式"
    ]
  }
}
```

### 2.4 画像模块 (Profile Module)

#### 2.4.1 获取风格画像
```http
GET /api/v1/profile/{style_name}
```

**路径参数**：
- `style_name`: 风格名称，如 "AI协作者"

**响应**：
```json
{
  "success": true,
  "data": {
    "basic_info": {
      "style_name": "AI协作者",
      "chinese_name": "AI协作者",
      "name_en": "AI Collaborator",
      "emoji": "🤝",
      "keywords": ["互动", "共创", "调整", "对话", "持续修正"],
      "core_concept": "AI是需要不断交流的合作对象"
    },
    "description": "你不把AI看作工具，而看作需要不断交流和调整的合作对象。",
    "detailed_description": "作为AI协作者，你不把AI看作工具，而看作需要不断交流和调整的合作对象。你不会期待AI一次性给出完美答案，而是通过持续的对话、调整、修正来共同完成目标。",
    "strengths": [
      {
        "title": "持续协作能力强",
        "description": "愿意通过持续互动调整AI结果",
        "evidence_questions": ["Q5", "Q7"],
        "evidence_scores": {"Q5": 6, "Q7": 6}
      },
      {
        "title": "灵活应对",
        "description": "能够灵活应对AI的不同表现",
        "evidence_questions": ["Q5"],
        "evidence_scores": {"Q5": 6}
      },
      {
        "title": "共创思维",
        "description": "将AI视为共创对象，而非指令执行者",
        "evidence_questions": ["Q7"],
        "evidence_scores": {"Q7": 6}
      }
    ],
    "blind_spots": [
      {
        "title": "可能形成过度依赖",
        "description": "在高度依赖互动时，可能降低独立思考能力",
        "reflection_question": "有没有哪些任务你现在已经无法不依赖AI完成了？"
      },
      {
        "title": "可能降低验证意识",
        "description": "过度关注互动过程，可能忽视结果验证",
        "reflection_question": "在和AI的互动中，你会验证最终结果吗？"
      }
    ],
    "reflection_questions": [
      "这个描述符合你吗？",
      "你觉得把AI当合作对象这个比喻准确吗？",
      "能讲一个你和AI共同完成任务的例子吗？",
      "你觉得这种协作模式给你带来了什么？"
    ]
  }
}
```

#### 2.4.2 生成个性化画像
```http
POST /api/v1/profile/generate
```

**请求体**：
```json
{
  "style_name": "AI协作者",
  "dimension_scores": {},
  "responses": {}
}
```

**响应**：同上，但包含个性化内容（基于用户具体得分）

### 2.5 会话模块 (Session Module)

#### 2.5.1 创建新会话
```http
POST /api/v1/session/create
```

**响应**：
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-v4-string",
    "created_at": "2025-01-15T10:00:00Z",
    "expires_at": "2025-01-15T12:00:00Z"
  }
}
```

#### 2.5.2 获取会话状态
```http
GET /api/v1/session/{session_id}/status
```

**响应**：
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-string",
    "status": "in_journey",
    "current_stage": 3,
    "completed_stages": [1, 2],
    "journey_progress": {
      "total_stages": 6,
      "completed_stages": 2,
      "current_stage": 3,
      "total_discoveries": 5,
      "conversation_turns": 12
    },
    "user_framework": {
      "style_type": "AI协作者",
      "style_name_en": "AI Collaborator"
    }
  }
}
```

---

## 3. WebSocket 实时通信规范

### 3.1 连接端点
```
ws://localhost:8000/ws/journey/{session_id}
```

### 3.2 消息格式

#### 客户端 → 服务器
```json
{
  "event": "user_message",
  "data": {
    "stage_id": 3,
    "question_id": "Q8",
    "user_response": "我会在重要事情上验证...",
    "timestamp": "2025-01-15T10:10:00Z"
  }
}
```

#### 服务器 → 客户端
```json
{
  "event": "follow_up_generated",
  "data": {
    "follow_up_questions": [...],
    "framework_discovery": {...},
    "timestamp": "2025-01-15T10:10:01Z"
  }
}
```

### 3.3 事件类型
| 事件名 | 方向 | 说明 |
|--------|------|------|
| `user_message` | C→S | 用户提交回答 |
| `follow_up_generated` | S→C | 追问问题生成完成 |
| `stage_completed` | S→C | 阶段完成通知 |
| `journey_completed` | S→C | 整个旅程完成 |
| `error` | S→C | 错误通知 |

---

## 4. 数据验证规范

### 4.1 Pydantic 模型定义
```python
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional
from datetime import datetime

class QuestionnaireSubmission(BaseModel):
    """问卷提交模型"""
    session_id: Optional[str] = Field(None, description="会话ID")
    responses: Dict[str, int] = Field(..., description="15道题的答案，1-7分")
    metadata: Optional[Dict] = Field(None, description="元数据")

    @validator('responses')
    def validate_responses(cls, v):
        required_questions = [f"Q{i}" for i in range(1, 16)]
        for q in required_questions:
            if q not in v:
                raise ValueError(f"缺少题目: {q}")
            if v[q] < 1 or v[q] > 7:
                raise ValueError(f"{q}答案必须在1-7之间")
        return v

class FollowUpSubmission(BaseModel):
    """追问回答提交模型"""
    session_id: str = Field(..., description="会话ID")
    stage_id: int = Field(..., ge=1, le=6, description="阶段ID")
    question_id: str = Field(..., regex=r'^Q\d+$', description="题目ID")
    user_response: str = Field(..., min_length=1, max_length=2000, description="用户回答")
    question_context: Optional[Dict] = Field(None, description="问题上下文")

class StageCompletion(BaseModel):
    """阶段完成模型"""
    session_id: str
    stage_discoveries: List[str] = Field(default_factory=list, max_items=5)
    user_reflection: Optional[str] = Field(None, max_length=1000)
```

---

## 5. 数据库Schema详细设计

### 5.1 users 表
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(36) UNIQUE NOT NULL,  -- UUID
    session_id VARCHAR(36) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON DEFAULT '{}'
);

CREATE INDEX idx_users_session_id ON users(session_id);
CREATE INDEX idx_users_user_id ON users(user_id);
```

### 5.2 responses 表
```sql
CREATE TABLE responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id VARCHAR(10) NOT NULL,
    answer INTEGER NOT NULL CHECK(answer >= 1 AND answer <= 7),
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_spent INTEGER DEFAULT 0,  -- 答题用时（秒）
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_responses_user_id ON responses(user_id);
CREATE INDEX idx_responses_question_id ON responses(question_id);
```

### 5.3 dimension_scores 表
```sql
CREATE TABLE dimension_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    dimension_name VARCHAR(50) NOT NULL,
    score FLOAT NOT NULL,
    tendency_level VARCHAR(20) NOT NULL,  -- strong_A, moderate_A, neutral, etc.
    tendency_type VARCHAR(50) NOT NULL,   -- Explorer, Navigator, etc.
    confidence FLOAT NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_dimension_scores_user_id ON dimension_scores(user_id);
```

### 5.4 collaboration_styles 表
```sql
CREATE TABLE collaboration_styles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    primary_style VARCHAR(50) NOT NULL,
    secondary_style VARCHAR(50),
    confidence FLOAT NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
    matched_styles JSON,  -- 存储所有匹配的风格
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 5.5 journey_progress 表 (新增)
```sql
CREATE TABLE journey_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    current_stage INTEGER DEFAULT 1 CHECK(current_stage >= 1 AND current_stage <= 6),
    completed_stages JSON DEFAULT '[]',  -- [1, 2, 3]
    stage_status JSON NOT NULL,  -- {"1": "completed", "2": "completed", "3": "current", ...}
    discoveries JSON DEFAULT '[]',
    framework_adjustments JSON DEFAULT '[]',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_journey_progress_session ON journey_progress(session_id);
```

### 5.6 stage_discoveries 表 (新增)
```sql
CREATE TABLE stage_discoveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    stage_id INTEGER NOT NULL,
    discovery_text TEXT NOT NULL,
    discovery_type VARCHAR(50),  -- framework, contradiction, reflection
    related_questions JSON,  -- ["Q7", "Q8"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_stage_discoveries_session ON stage_discoveries(session_id);
```

### 5.7 follow_up_history 表
```sql
CREATE TABLE follow_up_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(36) NOT NULL,
    stage_id INTEGER NOT NULL,
    question_id VARCHAR(10) NOT NULL,
    system_message TEXT,
    user_response TEXT NOT NULL,
    follow_up_triggered TEXT,
    question_context JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_follow_up_history_session ON follow_up_history(session_id);
```

---

## 6. 开发者快速开始指南

### 6.1 环境搭建
```bash
# 克隆项目
git clone <project-repo>
cd ai-interview-engine

# 后端环境
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 初始化数据库
python scripts/init_db.py

# 启动后端
uvicorn main:app --reload --port 8000

# 前端环境
cd frontend
npm install
npm run dev
```

### 6.2 配置文件示例
```yaml
# config/settings.yaml
api:
  base_url: "http://localhost:8000"
  version: "v1"
  timeout: 30

database:
  url: "sqlite:///./data/ai_interview.db"
  echo: false

journey:
  total_stages: 6
  max_follow_up_depth: 5
  estimated_duration: "45-60min"

logging:
  level: INFO
  file: "logs/app.log"
```

### 6.3 核心算法伪代码转Python
```python
# services/journey_engine.py

class JourneyEngine:
    def __init__(self):
        self.stage_configs = self._load_stage_configs()
        self.state_manager = JourneyStateManager()
        self.follow_up_executor = FollowUpExecutor()

    def start_stage(self, session_id, stage_id):
        """开始特定阶段"""
        # 1. 获取用户会话数据
        session_data = self.state_manager.get_session(session_id)

        # 2. 获取阶段配置
        stage_config = self.stage_configs[stage_id]

        # 3. 生成进入问题
        entry_question = self._generate_entry_question(
            stage_config,
            session_data['user_responses'],
            session_data['user_framework']
        )

        # 4. 更新状态
        self.state_manager.set_current_stage(session_id, stage_id)

        return {
            'entry_question': entry_question,
            'framework_card_data': self._get_framework_card(session_data)
        }
```

---

## 7. 测试示例

### 7.1 单元测试示例
```python
# tests/test_journey_engine.py

def test_start_stage_3():
    """测试开始第三阶段"""
    # 准备测试数据
    session_id = "test-session-123"
    responses = {
        "Q7": 6, "Q8": 5, "Q9": 6, "Q12": 6,
        # ... 其他题目
    }

    # 执行测试
    engine = JourneyEngine()
    result = engine.start_stage(session_id, 3)

    # 验证结果
    assert result['stage_id'] == 3
    assert "AI协作者" in result['entry_question']
    assert "选择性验证" in result['framework_card_data']['stage_discoveries'][0]

def test_follow_up_generation():
    """测试追问生成"""
    executor = FollowUpExecutor()

    result = executor.generate_follow_up_for_question(
        question_id="Q8",
        user_score=5,
        user_framework={"style_type": "AI协作者"},
        stage_id=3
    )

    assert len(result) >= 3  # 至少3层追问
    assert result[0]['layer'] == 1  # 第一层是经验唤起
```

### 7.2 集成测试示例
```python
# tests/test_api_integration.py

def test_complete_journey_flow():
    """测试完整旅程流程"""
    client = TestClient(app)

    # 1. 提交问卷
    response = client.post("/api/v1/questionnaire/submit", json={
        "responses": {f"Q{i}": 5 for i in range(1, 16)}
    })
    assert response.status_code == 200
    session_id = response.json()['data']['session_id']

    # 2. 开始第一阶段
    response = client.post(f"/api/v1/journey/stage/1/start", json={
        "session_id": session_id
    })
    assert response.status_code == 200
    entry_question = response.json()['data']['entry_question']

    # 3. 提交追问回答
    response = client.post("/api/v1/journey/follow-up/submit", json={
        "session_id": session_id,
        "stage_id": 1,
        "question_id": "Q1",
        "user_response": "我通过实际使用来判断..."
    })
    assert response.status_code == 200
    follow_ups = response.json()['data']['follow_up_questions']
    assert len(follow_ups) > 0
```

---

## 8. 部署和运维

### 8.1 Docker 部署
```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 8.2 健康检查
```http
GET /health
```

**响应**：
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

## 9. FAQ

### Q1: 如何处理用户中途退出？
**A**: 会话状态保存在`journey_progress`表中，用户下次访问时可基于`session_id`恢复到离开的阶段。

### Q2: 追问问题如何保证多样性？
**A**: MVP阶段使用模板化追问 + 轻微随机化；后期可集成LLM生成更灵活的追问。

### Q3: 如何扩展到其他风格类型？
**A**: 在`style_rules`配置中添加新的风格定义，无需修改核心代码。

### Q4: 如何保证对话自然度？
**A**: 5层追问序列确保了递进性；使用用户原话确保相关性；避免说教语气保持探讨感。

---

**文档版本**: v1.0
**最后更新**: 2025-01-15
**维护者**: [项目团队]