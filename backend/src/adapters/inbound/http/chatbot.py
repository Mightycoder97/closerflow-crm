import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID, uuid4
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.config.dependencies import get_db_session
from src.adapters.outbound.database.models import ChatbotRuleDBModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot/rules", tags=["Chatbot Auto-Responses"])

class ChatbotRuleResponse(BaseModel):
    id: UUID
    business_profile_id: UUID
    trigger_keyword: str
    response_content: str
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class CreateChatbotRuleRequest(BaseModel):
    trigger_keyword: str
    response_content: str
    is_active: Optional[bool] = True

class UpdateChatbotRuleRequest(BaseModel):
    trigger_keyword: Optional[str] = None
    response_content: Optional[str] = None
    is_active: Optional[bool] = None

# GET /api/v1/chatbot/rules
@router.get("", response_model=List[ChatbotRuleResponse])
async def list_chatbot_rules(db: Session = Depends(get_db_session)):
    rules = db.query(ChatbotRuleDBModel).order_by(ChatbotRuleDBModel.created_at.desc()).all()
    result = []
    for r in rules:
        result.append(ChatbotRuleResponse(
            id=r.id,
            business_profile_id=r.business_profile_id,
            trigger_keyword=r.trigger_keyword,
            response_content=r.response_content,
            is_active=r.is_active,
            created_at=r.created_at.isoformat(),
            updated_at=r.updated_at.isoformat()
        ))
    return result

# POST /api/v1/chatbot/rules
@router.post("", response_model=ChatbotRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_chatbot_rule(body: CreateChatbotRuleRequest, db: Session = Depends(get_db_session)):
    # Obtener el primer business_profile_id registrado
    business_profile_id = db.execute(text("SELECT id FROM business_profiles LIMIT 1")).scalar()
    if not business_profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay ningún perfil de negocio registrado. Por favor crea uno primero."
        )

    # Crear regla
    db_rule = ChatbotRuleDBModel(
        id=uuid4(),
        business_profile_id=business_profile_id,
        trigger_keyword=body.trigger_keyword.strip(),
        response_content=body.response_content.strip(),
        is_active=body.is_active
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)

    return ChatbotRuleResponse(
        id=db_rule.id,
        business_profile_id=db_rule.business_profile_id,
        trigger_keyword=db_rule.trigger_keyword,
        response_content=db_rule.response_content,
        is_active=db_rule.is_active,
        created_at=db_rule.created_at.isoformat(),
        updated_at=db_rule.updated_at.isoformat()
    )

# PUT /api/v1/chatbot/rules/{rule_id}
@router.put("/{rule_id}", response_model=ChatbotRuleResponse)
async def update_chatbot_rule(rule_id: UUID, body: UpdateChatbotRuleRequest, db: Session = Depends(get_db_session)):
    rule = db.query(ChatbotRuleDBModel).filter_by(id=rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regla del chatbot no encontrada"
        )

    if body.trigger_keyword is not None:
        rule.trigger_keyword = body.trigger_keyword.strip()
    if body.response_content is not None:
        rule.response_content = body.response_content.strip()
    if body.is_active is not None:
        rule.is_active = body.is_active

    rule.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rule)

    return ChatbotRuleResponse(
        id=rule.id,
        business_profile_id=rule.business_profile_id,
        trigger_keyword=rule.trigger_keyword,
        response_content=rule.response_content,
        is_active=rule.is_active,
        created_at=rule.created_at.isoformat(),
        updated_at=rule.updated_at.isoformat()
    )

# DELETE /api/v1/chatbot/rules/{rule_id}
@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chatbot_rule(rule_id: UUID, db: Session = Depends(get_db_session)):
    rule = db.query(ChatbotRuleDBModel).filter_by(id=rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regla del chatbot no encontrada"
        )
    db.delete(rule)
    db.commit()
    return None
