import os
import json
import logging
from datetime import datetime, timezone
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from src.ports.outbound.llm_port import LLMPort
from src.ports.outbound.whatsapp_port import WhatsAppPort
from src.config.dependencies import get_llm_adapter, get_db_session, get_whatsapp_adapter
from src.adapters.outbound.database.models import ContactDBModel, MessageDBModel, AIAnalysisDBModel, PipelineStageDBModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chats", tags=["Chats & IA"])

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class AIAnalysisResponse(BaseModel):
    summary: str
    detected_objections: List[str]
    suggested_stage: str

class ContactResponse(BaseModel):
    id: UUID
    business_profile_id: UUID
    first_name: Optional[str]
    last_name: Optional[str]
    phone_number: str
    email: Optional[str]
    status: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: UUID
    contact_id: UUID
    direction: str
    content: str
    message_type: str
    meta_message_id: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    content: str

# --- NUEVO: Obtener la lista de todos los contactos (leads) ---
@router.get("", response_model=List[ContactResponse])
async def list_chats(db: Session = Depends(get_db_session)):
    contacts = db.query(ContactDBModel).order_by(ContactDBModel.updated_at.desc()).all()
    
    result = []
    for c in contacts:
        result.append(ContactResponse(
            id=c.id,
            business_profile_id=c.business_profile_id,
            first_name=c.first_name,
            last_name=c.last_name,
            phone_number=c.phone_number,
            email=c.email,
            status=c.status,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat()
        ))
    return result

# --- NUEVO: Obtener el historial de mensajes de un contacto ---
@router.get("/{contact_id}/messages", response_model=List[MessageResponse])
async def get_chat_messages(contact_id: UUID, db: Session = Depends(get_db_session)):
    messages = db.query(MessageDBModel).filter_by(contact_id=contact_id).order_by(MessageDBModel.created_at.asc()).all()
    
    result = []
    for m in messages:
        result.append(MessageResponse(
            id=m.id,
            contact_id=m.contact_id,
            direction=m.direction,
            content=m.content,
            message_type=m.message_type,
            meta_message_id=m.meta_message_id,
            created_at=m.created_at.isoformat()
        ))
    return result

# --- NUEVO: Enviar mensaje de texto a un contacto vía WhatsApp ---
@router.post("/{contact_id}/send", response_model=MessageResponse)
async def send_message(
    contact_id: UUID,
    body: SendMessageRequest,
    db: Session = Depends(get_db_session),
    whatsapp_adapter: WhatsAppPort = Depends(get_whatsapp_adapter),
):
    # 1. Buscar el contacto por ID para obtener el phone_number
    contact = db.query(ContactDBModel).filter_by(id=contact_id).first()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contacto no encontrado"
        )

    # 2. Enviar el mensaje vía WhatsApp Cloud API
    try:
        wa_response = await whatsapp_adapter.send_text_message(
            to_phone=contact.phone_number,
            message=body.content,
        )
    except Exception as e:
        logger.error(f"Error al enviar mensaje de WhatsApp a {contact.phone_number}: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al enviar mensaje vía WhatsApp: {str(e)}"
        )

    # 3. Guardar el mensaje en la base de datos como OUTBOUND
    meta_msg_id = None
    if wa_response and "messages" in wa_response:
        messages_list = wa_response["messages"]
        if messages_list:
            meta_msg_id = messages_list[0].get("id")

    db_msg = MessageDBModel(
        contact_id=contact.id,
        direction="OUTBOUND",
        content=body.content,
        message_type="TEXT",
        meta_message_id=meta_msg_id,
    )
    db.add(db_msg)

    # Actualizar el timestamp de modificación del contacto para ordenamiento
    contact.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(db_msg)

    # 4. Publicar evento OUTBOUND_MESSAGE a Redis Pub/Sub para tiempo real
    try:
        redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
        event_payload = {
            "type": "OUTBOUND_MESSAGE",
            "payload": {
                "id": str(db_msg.id),
                "contact_id": str(contact.id),
                "direction": db_msg.direction,
                "content": db_msg.content,
                "message_type": db_msg.message_type,
                "meta_message_id": db_msg.meta_message_id,
                "created_at": db_msg.created_at.isoformat(),
            }
        }
        await redis_client.publish("ws_broadcast", json.dumps(event_payload))
        await redis_client.close()
        logger.info(f"Mensaje OUTBOUND publicado a ws_broadcast para contacto {contact_id}")
    except Exception as e:
        logger.warning(f"No se pudo publicar evento a Redis Pub/Sub: {e}")

    # 5. Retornar el mensaje guardado
    return MessageResponse(
        id=db_msg.id,
        contact_id=db_msg.contact_id,
        direction=db_msg.direction,
        content=db_msg.content,
        message_type=db_msg.message_type,
        meta_message_id=db_msg.meta_message_id,
        created_at=db_msg.created_at.isoformat(),
    )

# --- Analizar chat bajo demanda ---
@router.post("/{contact_id}/analyze", response_model=AIAnalysisResponse)
async def request_ai_assistance(
    contact_id: UUID,
    db: Session = Depends(get_db_session),
    llm_adapter: LLMPort = Depends(get_llm_adapter)
):
    contact = db.query(ContactDBModel).filter_by(id=contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contacto no encontrado")
        
    business_profile = contact.business_profile
    if not business_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El contacto no tiene un perfil de negocio asociado"
        )
        
    messages = db.query(MessageDBModel).filter_by(contact_id=contact_id).order_by(MessageDBModel.created_at.desc()).limit(30).all()
    if not messages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay mensajes suficientes para analizar")

    formatted_transcript = ""
    for msg in reversed(messages):
        sender = "Cliente" if msg.direction == "INBOUND" else "Agente"
        formatted_transcript += f"[{msg.created_at.strftime('%H:%M')}] {sender}: {msg.content}\n"

    try:
        analysis = llm_adapter.analyze_chat_history(
            chat_transcript=formatted_transcript,
            niche_type=business_profile.niche_type,
            customized_rules=business_profile.customized_rules
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al conectar con DeepSeek: {str(e)}"
        )

    stage = db.query(PipelineStageDBModel).filter_by(
        business_profile_id=business_profile.id,
        name=analysis.suggested_stage
    ).first()
    stage_id = stage.id if stage else None

    db_analysis = AIAnalysisDBModel(
        contact_id=contact_id,
        summary=analysis.summary,
        detected_objections=analysis.detected_objections,
        suggested_stage_id=stage_id
    )
    db.add(db_analysis)
    db.commit()

    return AIAnalysisResponse(
        summary=analysis.summary,
        detected_objections=analysis.detected_objections,
        suggested_stage=analysis.suggested_stage
    )
