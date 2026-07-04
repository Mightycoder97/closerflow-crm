import json
import redis.asyncio as aioredis
from typing import Dict, Any
from src.ports.outbound.event_queue_port import EventQueuePort

class RedisQueueAdapter(EventQueuePort):
    def __init__(self, redis_url: str, queue_name: str = "meta_webhook_queue"):
        self.redis_url = redis_url
        self.queue_name = queue_name
        self._redis = None

    async def _get_client(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = await aioredis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    async def enqueue_meta_event(self, event_data: Dict[str, Any]) -> None:
        client = await self._get_client()
        event_str = json.dumps(event_data)
        await client.rpush(self.queue_name, event_str)
