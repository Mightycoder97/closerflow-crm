from sqlalchemy.orm import Session
from typing import Optional
from src.ports.outbound.lead_repository_port import LeadRepositoryPort if False else object # Simple mock check
from src.domain.entities.contact import Contact, ContactStatus
from src.adapters.outbound.database.models import ContactDBModel

class PostgresLeadRepository:
    def __init__(self, db_session: Session):
        self.session = db_session

    def save(self, contact: Contact) -> Contact:
        db_model = ContactDBModel(
            id=contact.id,
            business_profile_id=contact.business_profile_id,
            first_name=contact.first_name,
            last_name=contact.last_name,
            phone_number=contact.phone_number,
            email=contact.email,
            status=contact.status.value,
            created_at=contact.created_at,
            updated_at=contact.updated_at
        )
        self.session.merge(db_model)
        self.session.commit()
        return contact

    def find_by_phone(self, business_profile_id, phone_number: str) -> Optional[Contact]:
        db_model = self.session.query(ContactDBModel).filter_by(
            business_profile_id=business_profile_id, 
            phone_number=phone_number
        ).first()
        if not db_model:
            return None
        return Contact(
            id=db_model.id,
            business_profile_id=db_model.business_profile_id,
            first_name=db_model.first_name,
            last_name=db_model.last_name,
            phone_number=db_model.phone_number,
            email=db_model.email,
            status=ContactStatus(db_model.status),
            created_at=db_model.created_at,
            updated_at=db_model.updated_at
        )

    def find_or_create_by_phone(self, business_profile_id, phone_number: str, first_name: Optional[str] = None, email: Optional[str] = None) -> Contact:
        contact = self.find_by_phone(business_profile_id, phone_number)
        if contact:
            return contact
        
        # Crear nuevo
        new_contact = Contact(
            business_profile_id=business_profile_id,
            phone_number=phone_number,
            first_name=first_name,
            email=email,
            status=ContactStatus.NEW
        )
        self.save(new_contact)
        return new_contact
