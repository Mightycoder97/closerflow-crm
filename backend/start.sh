#!/bin/bash
# Iniciar el worker de segundo plano en modo sin búfer (unbuffered -u) para ver los logs al instante
PYTHONPATH=. python -u src/worker.py &

# Iniciar el servidor API de FastAPI en foreground
uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}
