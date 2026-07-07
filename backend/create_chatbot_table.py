import os
from dotenv import load_dotenv
load_dotenv()

from src.adapters.outbound.database.postgres import Base, engine
from src.adapters.outbound.database.models import ChatbotRuleDBModel, PipelineStageDBModel, DealDBModel

print("Creating database tables using SQLAlchemy Base.metadata.create_all...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
