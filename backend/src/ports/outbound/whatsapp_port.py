from abc import ABC, abstractmethod


class WhatsAppPort(ABC):
    @abstractmethod
    async def send_text_message(self, to_phone: str, message: str) -> dict:
        pass

    @abstractmethod
    async def send_template_message(self, to_phone: str, template_name: str, language_code: str = "es") -> dict:
        pass
