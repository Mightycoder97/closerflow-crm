import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID, uuid4
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.config.dependencies import get_db_session
from src.adapters.outbound.database.models import PipelineStageDBModel, DealDBModel, ContactDBModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pipeline", tags=["CRM Pipeline"])

class ContactBriefResponse(BaseModel):
    id: UUID
    first_name: Optional[str]
    last_name: Optional[str]
    phone_number: str

class DealResponse(BaseModel):
    id: UUID
    title: str
    amount: Optional[float]
    contact_id: UUID
    contact: Optional[ContactBriefResponse] = None
    stage_id: UUID
    assigned_agent_id: Optional[UUID]
    created_at: str
    updated_at: str

class StageResponse(BaseModel):
    id: UUID
    name: str
    order_index: int
    description: Optional[str]
    deals: List[DealResponse] = []

class CreateDealRequest(BaseModel):
    title: str
    amount: Optional[float] = 0.0
    contact_id: UUID
    stage_id: UUID
    assigned_agent_id: Optional[UUID] = None

class UpdateDealRequest(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    stage_id: Optional[UUID] = None

class MoveDealRequest(BaseModel):
    stage_id: UUID

# GET /api/v1/pipeline/stages
@router.get("/stages", response_model=List[StageResponse])
async def list_pipeline_stages(db: Session = Depends(get_db_session)):
    # 1. Obtener el primer business_profile_id
    business_profile_id = db.execute(text("SELECT id FROM business_profiles LIMIT 1")).scalar()
    if not business_profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay ningún perfil de negocio registrado."
        )

    # 2. Buscar si ya existen etapas para este business profile
    stages = db.query(PipelineStageDBModel).filter_by(business_profile_id=business_profile_id).order_by(PipelineStageDBModel.order_index.asc()).all()

    # 3. Si no hay etapas, sembrar las predeterminadas
    if not stages:
        default_names = ["NUEVO", "CONTACTADO", "PROPUESTA", "NEGOCIACION", "GANADO", "PERDIDO"]
        stages = []
        for index, name in enumerate(default_names):
            stage = PipelineStageDBModel(
                id=uuid4(),
                business_profile_id=business_profile_id,
                name=name,
                order_index=index,
                description=f"Etapa del embudo: {name}"
            )
            db.add(stage)
            stages.append(stage)
        db.commit()
        # Refrescar para obtener los timestamps
        for s in stages:
            db.refresh(s)

    # 4. Construir la respuesta con negocios asociados
    result = []
    for stage in stages:
        deals = db.query(DealDBModel).filter_by(stage_id=stage.id).order_by(DealDBModel.updated_at.desc()).all()
        deal_responses = []
        for deal in deals:
            # Obtener datos resumidos del contacto
            contact = db.query(ContactDBModel).filter_by(id=deal.contact_id).first()
            contact_brief = None
            if contact:
                contact_brief = ContactBriefResponse(
                    id=contact.id,
                    first_name=contact.first_name,
                    last_name=contact.last_name,
                    phone_number=contact.phone_number
                )
            
            deal_responses.append(DealResponse(
                id=deal.id,
                title=deal.title,
                amount=float(deal.amount) if deal.amount is not None else 0.0,
                contact_id=deal.contact_id,
                contact=contact_brief,
                stage_id=deal.stage_id,
                assigned_agent_id=deal.assigned_agent_id,
                created_at=deal.created_at.isoformat(),
                updated_at=deal.updated_at.isoformat()
            ))

        result.append(StageResponse(
            id=stage.id,
            name=stage.name,
            order_index=stage.order_index,
            description=stage.description,
            deals=deal_responses
        ))

    return result

# POST /api/v1/pipeline/deals
@router.post("/deals", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
async def create_deal(body: CreateDealRequest, db: Session = Depends(get_db_session)):
    # Validar contacto
    contact = db.query(ContactDBModel).filter_by(id=body.contact_id).first()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contacto asociado no encontrado"
        )
    
    # Validar etapa
    stage = db.query(PipelineStageDBModel).filter_by(id=body.stage_id).first()
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Etapa de pipeline no encontrada"
        )

    # Crear negocio
    db_deal = DealDBModel(
        id=uuid4(),
        contact_id=body.contact_id,
        stage_id=body.stage_id,
        assigned_agent_id=body.assigned_agent_id,
        title=body.title.strip(),
        amount=body.amount
    )
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)

    contact_brief = ContactBriefResponse(
        id=contact.id,
        first_name=contact.first_name,
        last_name=contact.last_name,
        phone_number=contact.phone_number
    )

    return DealResponse(
        id=db_deal.id,
        title=db_deal.title,
        amount=float(db_deal.amount) if db_deal.amount is not None else 0.0,
        contact_id=db_deal.contact_id,
        contact=contact_brief,
        stage_id=db_deal.stage_id,
        assigned_agent_id=db_deal.assigned_agent_id,
        created_at=db_deal.created_at.isoformat(),
        updated_at=db_deal.updated_at.isoformat()
    )

# PUT /api/v1/pipeline/deals/{deal_id}/stage
@router.put("/deals/{deal_id}/stage", response_model=DealResponse)
async def move_deal_stage(deal_id: UUID, body: MoveDealRequest, db: Session = Depends(get_db_session)):
    deal = db.query(DealDBModel).filter_by(id=deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negocio no encontrado"
        )

    # Validar nueva etapa
    stage = db.query(PipelineStageDBModel).filter_by(id=body.stage_id).first()
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Etapa del pipeline de destino no encontrada"
        )

    deal.stage_id = body.stage_id
    deal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deal)

    contact = db.query(ContactDBModel).filter_by(id=deal.contact_id).first()
    contact_brief = None
    if contact:
        contact_brief = ContactBriefResponse(
            id=contact.id,
            first_name=contact.first_name,
            last_name=contact.last_name,
            phone_number=contact.phone_number
        )

    return DealResponse(
        id=deal.id,
        title=deal.title,
        amount=float(deal.amount) if deal.amount is not None else 0.0,
        contact_id=deal.contact_id,
        contact=contact_brief,
        stage_id=deal.stage_id,
        assigned_agent_id=deal.assigned_agent_id,
        created_at=deal.created_at.isoformat(),
        updated_at=deal.updated_at.isoformat()
    )

# PUT /api/v1/pipeline/deals/{deal_id}
@router.put("/deals/{deal_id}", response_model=DealResponse)
async def update_deal(deal_id: UUID, body: UpdateDealRequest, db: Session = Depends(get_db_session)):
    deal = db.query(DealDBModel).filter_by(id=deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negocio no encontrado"
        )

    if body.title is not None:
        deal.title = body.title.strip()
    if body.amount is not None:
        deal.amount = body.amount
    if body.stage_id is not None:
        # Validar etapa
        stage = db.query(PipelineStageDBModel).filter_by(id=body.stage_id).first()
        if not stage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Etapa especificada no encontrada"
            )
        deal.stage_id = body.stage_id

    deal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deal)

    contact = db.query(ContactDBModel).filter_by(id=deal.contact_id).first()
    contact_brief = None
    if contact:
        contact_brief = ContactBriefResponse(
            id=contact.id,
            first_name=contact.first_name,
            last_name=contact.last_name,
            phone_number=contact.phone_number
        )

    return DealResponse(
        id=deal.id,
        title=deal.title,
        amount=float(deal.amount) if deal.amount is not None else 0.0,
        contact_id=deal.contact_id,
        contact=contact_brief,
        stage_id=deal.stage_id,
        assigned_agent_id=deal.assigned_agent_id,
        created_at=deal.created_at.isoformat(),
        updated_at=deal.updated_at.isoformat()
    )

# DELETE /api/v1/pipeline/deals/{deal_id}
@router.delete("/deals/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal(deal_id: UUID, db: Session = Depends(get_db_session)):
    deal = db.query(DealDBModel).filter_by(id=deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negocio no encontrado"
        )
    db.delete(deal)
    db.commit()
    return None
