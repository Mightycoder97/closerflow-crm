from openai import OpenAI
from src.ports.outbound.llm_port import LLMPort, AIAnalysisResult
import json

class DeepSeekAdapter(LLMPort):
    def __init__(self, api_key: str, base_url: str):
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def analyze_chat_history(self, chat_transcript: str, niche_type: str, customized_rules: dict) -> AIAnalysisResult:
        if niche_type == "physical_goods":
            niche_prompt = (
                "Esta es una MYPE de venta masiva de importaciones (audífonos, cargadores, accesorios). "
                "Las decisiones de compra son rápidas. Objeciones típicas: Costo de envío, tiempo de entrega, garantía, stock. "
                "Las etapas del pipeline son rápidas: 'NEW' -> 'ENGAGED' -> 'DATOS_ENVIO' -> 'CERRADO'."
            )
        else: # intangibles
            niche_prompt = (
                "Esta es una MYPE que vende servicios o intangibles (cursos online, asesorías, créditos). "
                "Las decisiones requieren educación. Objeciones típicas: Métodos de pago/cuotas, validez/certificados, temario, confianza. "
                "Las etapas del pipeline son reflexivas: 'NEW' -> 'ENGAGED' -> 'PROPUESTA_ENVIADA' -> 'NEGOCIACION' -> 'CERRADO'."
            )

        custom_instructions = customized_rules.get("additional_instructions", "")

        system_message = (
            f"Eres un copiloto de ventas experto en análisis de interacciones comerciales.\n"
            f"{niche_prompt}\n"
            f"Instrucciones específicas del negocio: {custom_instructions}\n"
            f"Analiza el chat provisto y devuelve estrictamente un objeto JSON con las claves:\n"
            f"- 'summary': Resumen muy breve de la interacción.\n"
            f"- 'objections': Lista de objeciones detectadas (ej: ['precio', 'tiempo_envio']).\n"
            f"- 'suggested_stage': Etapa sugerida para el pipeline comercial acorde al nicho ('NEW', 'ENGAGED', 'PROPUESTA_ENVIADA', 'NEGOCIACION', 'CERRADO')."
        )

        response = self.client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": chat_transcript}
            ],
            response_format={"type": "json_object"}
        )
        
        data = json.loads(response.choices[0].message.content)
        return AIAnalysisResult(
            summary=data["summary"],
            detected_objections=data["objections"],
            suggested_stage=data["suggested_stage"]
        )
