"""本地 Whisper 转写缝（S5 音频管线）。

对齐 S0 红线：音频**本地转写不走云 API**；转写核对后 ≤7 天删原始音频；
本层只产出转写文本 + 时长，音频原始文件绝不入库（narrative_segments 只存路径指针）。

与 LLM 层同构：Protocol + Stub（测试/离线，不装重依赖）+ 惰性真实实现。
真实 WhisperTranscriber 惰性 import faster-whisper；模型经 ALIS_WHISPER_MODEL（默认 base）。
真机跑真实转写需装 faster-whisper + 有音频文件（属硬件/资源项，见交付报告）。
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass
class Transcript:
    text: str
    duration_sec: float
    model: str


@runtime_checkable
class Transcriber(Protocol):
    def transcribe(self, audio_path: str) -> Transcript: ...


class StubTranscriber:
    """测试/离线用：不读真实音频，返回可控文本。"""

    model = "stub-transcriber"

    def __init__(self, text: str = "（桩转写）我记得那次是为了赶一份报告。", duration: float = 12.0):
        self._text = text
        self._duration = duration

    def transcribe(self, audio_path: str) -> Transcript:  # noqa: ARG002
        return Transcript(text=self._text, duration_sec=self._duration, model=self.model)


class WhisperTranscriber:
    """生产用：本地 faster-whisper 转写（惰性 import，不在导入期拉重依赖）。"""

    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or os.environ.get("ALIS_WHISPER_MODEL", "base")
        self._model = None

    def _ensure(self):
        if self._model is None:
            from faster_whisper import WhisperModel  # 惰性：仅生产转写时才需安装

            # 本地 CPU 推理；量化 int8 省内存。真机可按硬件调 device/compute_type。
            self._model = WhisperModel(self.model_name, device="cpu", compute_type="int8")
        return self._model

    def transcribe(self, audio_path: str) -> Transcript:
        model = self._ensure()
        segments, info = model.transcribe(audio_path, language="zh")
        text = "".join(seg.text for seg in segments).strip()
        return Transcript(
            text=text,
            duration_sec=float(getattr(info, "duration", 0.0)),
            model=f"faster-whisper/{self.model_name}",
        )
