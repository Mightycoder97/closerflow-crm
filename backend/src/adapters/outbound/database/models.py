from sqlalchemy import Column, String, Integer, Numeric, Text, ForeignKey, TIMESTAMP, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from src.adapters.outbound.database.postgres import Base

class BusinessProfileDBModel(Base):
    __tablename__ = "business_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(150), nullable=False)
    niche_type = Column(String(50), nullable=False)
    customized_rules = Column(JSON, default={})
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

    departments = relationship("DepartmentDBModel", back_populates="business_profile")
    contacts = relationship("ContactDBModel", back_populates="business_profile")

class DepartmentDBModel(Base):
    __tablename__ = "departments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_profile_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

    business_profile = relationship("BusinessProfileDBModel", back_populates="departments")
    users = relationship("UserDBModel", back_populates="department")

class UserDBModel(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(20), default="agent", nullable=False)
    status = Column(String(20), default="active", nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

    department = relationship("DepartmentDBModel", back_populates="users")

class ContactDBModel(Base):
    __tablename__ = "contacts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_profile_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone_number = Column(String(30), nullable=False)
    email = Column(String(255))
    status = Column(String(50), default="NEW", nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

    business_profile = relationship("BusinessProfileDBModel", back_populates="contacts")
    messages = relationship("MessageDBModel", back_populates="contact")
    attribution = relationship("LeadAttributionDBModel", back_populates="contact", uselist=False)

class PipelineStageDBModel(Base):
    __tablename__ = "pipeline_stages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_profile_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    order_index = Column(Integer, nullable=False)
    description = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

class DealDBModel(Base):
    __tablename__ = "deals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    stage_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_stages.id"), nullable=False)
    assigned_agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    title = Column(String(150), nullable=False)
    amount = Column(Numeric(12, 2))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

class MessageDBModel(Base):
    __tablename__ = "messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    direction = Column(String(10), nullable=False) # INBOUND, OUTBOUND
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="TEXT", nullable=False)
    meta_message_id = Column(String(255), unique=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

    contact = relationship("ContactDBModel", back_populates="messages")

class LeadAttributionDBModel(Base):
    __tablename__ = "lead_attributions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), unique=True, nullable=False)
    campaign_id = Column(String(100))
    campaign_name = Column(String(255))
    adset_id = Column(String(100))
    adset_name = Column(String(255))
    ad_id = Column(String(100))
    ad_name = Column(String(255))
    platform = Column(String(50))
    referral_raw = Column(JSON)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)

    contact = relationship("ContactDBModel", back_populates="attribution")

class AIAnalysisDBModel(Base):
    __tablename__ = "ai_analyses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=False)
    detected_objections = Column(JSON, default=[], nullable=False)
    suggested_stage_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_stages.id"))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
