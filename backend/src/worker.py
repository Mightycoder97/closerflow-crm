import asyncio
import json
import os
import redis.asyncio as aioredis
from sqlalchemy.orm import Session
from src.adapters.outbound.database.postgres import SessionLocal
from src.adapters.outbound.database.models import ContactDBModel, MessageDBModel, UserDBModel
from src.domain.entities.contact import ContactStatus

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
QUEUE_NAME = "meta_webhook_queue"

async def process_incoming_meta_webhook(event_data: dict, db: Session):
    """
    Simulación de procesamiento administrativo de webhook:
    1. Descarga el mensaje o lead de Meta
    2. Lo guarda en PostgreSQL
    3. Asigna de forma Round Robin a un agente libre.
    """
    try:
        # Extraer datos de WhatsApp del Payload
        # Meta envía eventos en el formato: entry -> changes -> value -> messages
        entry = event_data.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        
        messages_list = value.get("messages", [])
        contacts_list = value.get("contacts", [])
        
        if messages_list and contacts_list:
            meta_msg = messages_list[0]
            meta_contact = contacts_list[0]
            
            phone = meta_contact.get("wa_id")
            name = meta_contact.get("profile", {}).get("name", "Cliente Nuevo")
            content = meta_msg.get("text", {}).get("body", "")
            meta_msg_id = meta_msg.get("id")
            
            # Buscar el primer perfil de negocio para simular la asignación
            # En producción se obtiene del número de WhatsApp emisor
            business_profile_id = db.execute("SELECT id FROM business_profiles LIMIT 1").scalar()
            if not business_profile_id:
                print("No hay ningún business_profile registrado. Crea uno en la base de datos.")
                return

            # 1. Buscar o Crear el Contacto
            contact = db.query(ContactDBModel).filter_by(
                business_profile_id=business_profile_id,
                phone_number=phone
            ).first()
            
            if not contact:
                contact = ContactDBModel(
                    business_profile_id=business_profile_id,
                    phone_number=phone,
                    first_name=name,
                    status=ContactStatus.NEW.value
                )
                db.add(contact)
                db.commit()
                db.refresh(contact)
                print(f"Contacto creado en worker: {phone}")

            # 2. Guardar el Mensaje
            existing_msg = db.query(MessageDBModel).filter_by(meta_message_id=meta_msg_id).first()
            if not existing_msg:
                db_msg = MessageDBModel(
                    contact_id=contact.id,
                    direction="INBOUND",
                    content=content,
                    message_type="TEXT",
                    meta_message_id=meta_msg_id
                )
                db.add(db_msg)
                db.commit()
                print(f"Mensaje guardado en worker: {content}")
                
            # 3. Lógica básica de asignación Round Robin
            # Asigna a cualquier agente activo
            agent = db.query(UserDBModel).filter_by(role="agent", status="active").first()
            if agent:
                # Comprobar si ya tiene un Deal asignado, si no, crear o asignar
                print(f"Lead {phone} asignado automáticamente al agente: {agent.email}")
                
    except Exception as e:
        print(f"Error procesando webhook en worker: {e}")

async def start_worker():
    print(f"Escuchando cola de Redis en {REDIS_URL}...")
    redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
    
    while True:
        try:
            # BLPOP espera de forma bloqueante y eficiente hasta que haya un webhook en la cola
            result = await redis_client.blpop(QUEUE_NAME, timeout=5)
            if result:
                _, event_data_str = result
                event_data = json.loads(event_data_str)
                print("Evento recuperado de Redis. Procesando tareas administrativas...")
                
                # Crear sesión de base de datos para este hilo
                db = SessionLocal()
                try:
                    await process_incoming_meta_webhook(event_data, db)
                finally:
                    db.close()
                    
        except Exception as e:
            print(f"Error de conexión o lectura en worker: {e}")
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(start_worker())
