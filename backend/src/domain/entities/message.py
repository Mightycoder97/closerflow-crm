from uuid import UUID, uuid4
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class MessageDirection(str, Enum):
    INBOUND = "INBOUND"
    OUTBOUND = "OUTBOUND"

class MessageType(str, Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    DOCUMENT = "DOCUMENT"
    TEMPLATE = "TEMPLATE"

class Message(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    contact_id: UUID
    direction: MessageDirection
    content: str
    message_type: MessageType = MessageType.TEXT
    meta_message_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
