import httpx
import logging
from src.ports.outbound.whatsapp_port import WhatsAppPort

logger = logging.getLogger(__name__)

WHATSAPP_API_VERSION = "v21.0"
WHATSAPP_API_BASE_URL = f"https://graph.facebook.com/{WHATSAPP_API_VERSION}"


class MetaWhatsAppAdapter(WhatsAppPort):
    def __init__(self, access_token: str, phone_number_id: str):
        self._access_token = access_token
        self._phone_number_id = phone_number_id
        self._base_url = f"{WHATSAPP_API_BASE_URL}/{phone_number_id}/messages"
        self._headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

    async def send_text_message(self, to_phone: str, message: str) -> dict:
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "text",
            "text": {"body": message},
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    self._base_url,
                    headers=self._headers,
                    json=payload,
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"Mensaje de texto enviado a {to_phone}")
                return result
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"Error HTTP al enviar mensaje a {to_phone}: "
                    f"status={e.response.status_code}, body={e.response.text}"
                )
                raise
            except httpx.RequestError as e:
                logger.error(f"Error de conexión al enviar mensaje a {to_phone}: {e}")
                raise

    async def send_template_message(self, to_phone: str, template_name: str, language_code: str = "es") -> dict:
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language_code},
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    self._base_url,
                    headers=self._headers,
                    json=payload,
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"Template '{template_name}' enviado a {to_phone}")
                return result
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"Error HTTP al enviar template a {to_phone}: "
                    f"status={e.response.status_code}, body={e.response.text}"
                )
                raise
            except httpx.RequestError as e:
                logger.error(f"Error de conexión al enviar template a {to_phone}: {e}")
                raise
