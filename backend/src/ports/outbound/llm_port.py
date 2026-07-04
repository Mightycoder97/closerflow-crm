from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import List

class AIAnalysisResult(BaseModel):
    summary: str
    detected_objections: List[str]
    suggested_stage: str

class LLMPort(ABC):
    @abstractmethod
    def analyze_chat_history(
        self, 
        chat_transcript: str, 
        niche_type: str, 
        customized_rules: dict
    ) -> AIAnalysisResult:
        pass
