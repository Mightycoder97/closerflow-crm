import hmac
import hashlib
import os
import logging
from fastapi import APIRouter, Request, Query, Header, HTTPException, status, Depends
from src.ports.outbound.event_queue_port import EventQueuePort
from src.config.dependencies import get_event_queue_adapter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

META_VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN", "").strip().replace('"', '').replace("'", "")
raw_secret = os.getenv("META_APP_SECRET", "")
META_APP_SECRET = raw_secret.strip().replace('"', '').replace("'", "")
BYPASS_SIGNATURE_VERIFICATION = os.getenv("BYPASS_SIGNATURE_VERIFICATION", "false").lower() == "true"

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
    
    if BYPASS_SIGNATURE_VERIFICATION:
        logger.info("Verificación de firma omitida (BYPASS_SIGNATURE_VERIFICATION=true)")
    elif not META_APP_SECRET:
        # META_APP_SECRET no está configurado — permitir en desarrollo con advertencia
        logger.warning(
            "META_APP_SECRET no está configurado. "
            "Permitiendo webhook sin validación de firma (modo desarrollo)."
        )
    else:
        # Validación completa de firma
        if not x_hub_signature_256:
            logger.error(
                "Validación de firma fallida: encabezado X-Hub-Signature-256 ausente. "
                f"META_APP_SECRET configurado: True, "
                f"Encabezado de firma presente: False"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing signature header"
            )
            
        signature_parts = x_hub_signature_256.split("=")
        if len(signature_parts) != 2 or signature_parts[0] != "sha256":
            logger.error(
                f"Formato de firma inválido: {x_hub_signature_256[:20]}..."
            )
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
            logger.error(
                "Validación de firma fallida: la firma no coincide. "
                f"META_APP_SECRET configurado: True, "
                f"Encabezado de firma presente: True"
            )
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
