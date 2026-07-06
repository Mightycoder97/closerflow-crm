import os
from src.adapters.outbound.queue.redis_queue_adapter import RedisQueueAdapter
from src.adapters.outbound.llm.deepseek_adapter import DeepSeekAdapter
from src.adapters.outbound.database.postgres import get_db
from src.adapters.outbound.whatsapp.meta_api_adapter import MetaWhatsAppAdapter

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "mock_key")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "").strip().replace('"', '').replace("'", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip().replace('"', '').replace("'", "")

# Instancia única del adaptador de la cola
_queue_adapter = RedisQueueAdapter(redis_url=REDIS_URL)

def get_event_queue_adapter():
    return _queue_adapter

def get_llm_adapter():
    return DeepSeekAdapter(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

def get_whatsapp_adapter():
    return MetaWhatsAppAdapter(
        access_token=META_ACCESS_TOKEN,
        phone_number_id=WHATSAPP_PHONE_NUMBER_ID,
    )

def get_db_session():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()
