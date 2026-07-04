#!/bin/bash
# Iniciar el worker de segundo plano en background
python src/worker.py &

# Iniciar el servidor API de FastAPI en foreground (puerto dinámico de Render)
uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}
