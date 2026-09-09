"""ALIS backend package.

社会学 AI 素养调查研究软件（ALIS）后端数据层。
铁律：LLM 只负责语言，不负责逻辑。本包为纯数据层，不含评分/分支/追问决策。
"""

__all__ = ["db", "models", "content", "bundle"]
__version__ = "0.1.0-s1"
