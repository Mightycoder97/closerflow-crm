import asyncio
import json
import os
from datetime import datetime, timezone
from urllib.parse import urlparse
import redis.asyncio as aioredis
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.adapters.outbound.database.postgres import SessionLocal
from src.adapters.outbound.database.models import ContactDBModel, MessageDBModel, UserDBModel, ChatbotRuleDBModel
from src.domain.entities.contact import ContactStatus
from src.config.dependencies import get_whatsapp_adapter

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
QUEUE_NAME = "meta_webhook_queue"

def mask_redis_url(url: str) -> str:
    """Enmascara credenciales en la URL de Redis para logs seguros."""
    try:
        parsed = urlparse(url)
        if parsed.password:
            masked = url.replace(f":{parsed.password}@", ":***@")
            return masked
        return url
    except Exception:
        return "redis://***"

async def process_incoming_meta_webhook(event_data: dict, db: Session, redis_client: aioredis.Redis):
    try:
        entry = event_data.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        
        # Extraer phone_number_id de los metadatos del webhook
        metadata = value.get("metadata", {})
        phone_number_id = metadata.get("phone_number_id")
        if phone_number_id:
            print(f"Webhook recibido para phone_number_id: {phone_number_id}")
        
        messages_list = value.get("messages", [])
        contacts_list = value.get("contacts", [])
        
        if messages_list and contacts_list:
            meta_msg = messages_list[0]
            meta_contact = contacts_list[0]
            
            phone = meta_contact.get("wa_id")
            name = meta_contact.get("profile", {}).get("name", "Cliente Nuevo")
            content = meta_msg.get("text", {}).get("body", "")
            meta_msg_id = meta_msg.get("id")
            
            business_profile_id = db.execute(text("SELECT id FROM business_profiles LIMIT 1")).scalar()
            if not business_profile_id:
                print("Worker Error: No hay ningún business_profile registrado en Supabase.")
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
                
                # Actualizar el timestamp de modificación del contacto para ordenamiento
                contact.updated_at = datetime.now(timezone.utc)
                
                db.commit()
                db.refresh(db_msg)
                print(f"Mensaje guardado en worker: {content}")
                
                # --- NUEVO: Publicar el mensaje en Redis Pub/Sub para que FastAPI lo envíe al Frontend ---
                event_payload = {
                    "type": "NEW_MESSAGE",
                    "payload": {
                        "id": str(db_msg.id),
                        "contact_id": str(contact.id),
                        "direction": db_msg.direction,
                        "content": db_msg.content,
                        "message_type": db_msg.message_type,
                        "meta_message_id": db_msg.meta_message_id,
                        "created_at": db_msg.created_at.isoformat()
                    }
                }
                await redis_client.publish("ws_broadcast", json.dumps(event_payload))
                print(f"Mensaje publicado a ws_broadcast para tiempo real.")

                # --- NUEVO: Procesar reglas de Chatbot Auto-Response ---
                active_rules = db.query(ChatbotRuleDBModel).filter_by(
                    business_profile_id=business_profile_id,
                    is_active=True
                ).all()

                # Buscar coincidencia (case-insensitive substring match)
                matched_rule = None
                content_lower = content.lower().strip()
                for rule in active_rules:
                    if rule.trigger_keyword.lower() in content_lower:
                        matched_rule = rule
                        break

                if matched_rule:
                    print(f"Chatbot Match: La palabra clave '{matched_rule.trigger_keyword}' coincide con el mensaje '{content}'")
                    try:
                        # Enviar auto-respuesta vía WhatsApp
                        whatsapp_adapter = get_whatsapp_adapter()
                        wa_response = await whatsapp_adapter.send_text_message(
                            to_phone=phone,
                            message=matched_rule.response_content,
                        )
                        
                        meta_msg_id = None
                        if wa_response and "messages" in wa_response:
                            messages_list = wa_response["messages"]
                            if messages_list:
                                meta_msg_id = messages_list[0].get("id")

                        # Guardar la respuesta automática en la base de datos
                        db_reply = MessageDBModel(
                            contact_id=contact.id,
                            direction="OUTBOUND",
                            content=matched_rule.response_content,
                            message_type="TEXT",
                            meta_message_id=meta_msg_id,
                        )
                        db.add(db_reply)
                        db.commit()
                        db.refresh(db_reply)
                        print(f"Auto-respuesta guardada en base de datos: {matched_rule.response_content}")

                        # Publicar evento OUTBOUND_MESSAGE a Redis Pub/Sub para actualizar el inbox en tiempo real
                        event_payload_reply = {
                            "type": "OUTBOUND_MESSAGE",
                            "payload": {
                                "id": str(db_reply.id),
                                "contact_id": str(contact.id),
                                "direction": db_reply.direction,
                                "content": db_reply.content,
                                "message_type": db_reply.message_type,
                                "meta_message_id": db_reply.meta_message_id,
                                "created_at": db_reply.created_at.isoformat()
                            }
                        }
                        await redis_client.publish("ws_broadcast", json.dumps(event_payload_reply))
                    except Exception as ex:
                        print(f"Error procesando auto-respuesta del chatbot: {ex}")
                
            # 3. Asignación Round Robin (Simulada para test de pauta)
            agent = db.query(UserDBModel).filter_by(role="agent", status="active").first()
            if agent:
                print(f"Lead {phone} asignado al agente: {agent.email}")
                
    except Exception as e:
        print(f"Error procesando webhook en worker: {e}")

async def start_worker():
    print(f"Escuchando cola de Redis en {mask_redis_url(REDIS_URL)}...")
    redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
    backoff_seconds = 2
    max_backoff_seconds = 60
    while True:
        try:
            result = await redis_client.blpop(QUEUE_NAME, timeout=5)
            if result:
                _, event_data_str = result
                event_data = json.loads(event_data_str)
                print("Evento recuperado de Redis.")
                
                db = SessionLocal()
                try:
                    await process_incoming_meta_webhook(event_data, db, redis_client)
                finally:
                    db.close()
                
                # Reset backoff on success
                backoff_seconds = 2
        except (asyncio.TimeoutError, redis.exceptions.TimeoutError):
            # Ignorar el timeout normal cuando la cola está vacía para no llenar logs
            continue
        except Exception as e:
            print(f"Error de conexión o lectura en worker: {e}. Reintentando en {backoff_seconds}s...")
            await asyncio.sleep(backoff_seconds)
            backoff_seconds = min(backoff_seconds * 2, max_backoff_seconds)

if __name__ == "__main__":
    asyncio.run(start_worker())
