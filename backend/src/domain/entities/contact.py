from uuid import UUID, uuid4
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional
from enum import Enum

class ContactStatus(str, Enum):
    NEW = "NEW"
    ENGAGED = "ENGAGED"
    QUALIFIED = "QUALIFIED"
    LOST = "LOST"
    WON = "WON"

class Contact(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    business_profile_id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: str
    email: Optional[EmailStr] = None
    status: ContactStatus = ContactStatus.NEW
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def mark_as_qualified(self):
        self.status = ContactStatus.QUALIFIED
        self.updated_at = datetime.utcnow()
