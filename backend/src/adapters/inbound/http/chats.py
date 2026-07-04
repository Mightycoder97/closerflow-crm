from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from src.ports.outbound.llm_port import LLMPort
from src.config.dependencies import get_llm_adapter, get_db_session
from src.adapters.outbound.database.models import ContactDBModel, MessageDBModel, AIAnalysisDBModel, PipelineStageDBModel

router = APIRouter(prefix="/chats", tags=["Chats & IA"])

class AIAnalysisResponse(BaseModel):
    summary: str
    detected_objections: List[str]
    suggested_stage: str

@router.post("/{contact_id}/analyze", response_model=AIAnalysisResponse)
async def request_ai_assistance(
    contact_id: UUID,
    db: Session = Depends(get_db_session),
    llm_adapter: LLMPort = Depends(get_llm_adapter)
):
    # 1. Obtener el contacto y sus reglas de negocio
    contact = db.query(ContactDBModel).filter_by(id=contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contacto no encontrado")
        
    business_profile = contact.business_profile
    if not business_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El contacto no tiene un perfil de negocio asociado"
        )
        
    # 2. Obtener los últimos 30 mensajes del chat formateados en texto plano
    messages = db.query(MessageDBModel).filter_by(contact_id=contact_id).order_by(MessageDBModel.created_at.desc()).limit(30).all()
    if not messages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay mensajes suficientes para analizar")

    # Revertir orden para que sea cronológico
    formatted_transcript = ""
    for msg in reversed(messages):
        sender = "Cliente" if msg.direction == "INBOUND" else "Agente"
        formatted_transcript += f"[{msg.created_at.strftime('%H:%M')}] {sender}: {msg.content}\n"

    # 3. Llamada a DeepSeek
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

    # 4. Guardar el análisis
    # Encontrar la etapa sugerida en el embudo
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
