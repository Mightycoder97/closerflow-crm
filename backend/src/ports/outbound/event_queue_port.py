from abc import ABC, abstractmethod
from typing import Dict, Any

class EventQueuePort(ABC):
    @abstractmethod
    async def enqueue_meta_event(self, event_data: Dict[str, Any]) -> None:
        pass
