import hmac
import hashlib
import os
from fastapi import APIRouter, Request, Query, Header, HTTPException, status, Depends
from src.ports.outbound.event_queue_port import EventQueuePort
from src.config.dependencies import get_event_queue_adapter

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

META_VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN", "mi_token_secreto_de_validacion_123")
META_APP_SECRET = os.getenv("META_APP_SECRET", "mi_app_secret_de_facebook")

@router.get("/meta")
async def verify_meta_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_challenge: int = Query(..., alias="hub.challenge"),
    hub_verify_token: str = Query(..., alias="hub.verify_token")
):
    if hub_mode == "subscribe" and hub_verify_token == META_VERIFY_TOKEN:
        return hub_challenge
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification token mismatch or invalid mode"
    )

@router.post("/meta")
async def receive_meta_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None, alias="X-Hub-Signature-256"),
    queue_adapter: EventQueuePort = Depends(get_event_queue_adapter)
):
    body_bytes = await request.body()
    
    # Si META_APP_SECRET es de prueba y no viene firma, podemos saltarlo en testing local
    if META_APP_SECRET != "mi_app_secret_de_facebook":
        if not x_hub_signature_256:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing signature header"
            )
            
        signature_parts = x_hub_signature_256.split("=")
        if len(signature_parts) != 2 or signature_parts[0] != "sha256":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature format"
            )
            
        expected_signature = signature_parts[1]
        computed_signature = hmac.new(
            key=META_APP_SECRET.encode("utf-8"),
            msg=body_bytes,
            digestmod=hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(computed_signature, expected_signature):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Signature validation failed"
            )

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )

    await queue_adapter.enqueue_meta_event(payload)
    return {"status": "event_queued"}
