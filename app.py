"""
app.py — Entry point for uvicorn.

This is the file uvicorn is told to run:
    uvicorn app:app --host 0.0.0.0 --port 8090

It simply re-exports the FastAPI app instance from rag_api.py.
Keeping a separate entry point means:
  - rag_api.py stays importable as a library
  - uvicorn / PM2 / gunicorn always reference one stable name: app:app
  - No circular imports

Environment variables required (set before starting):
    NVIDIA_API_KEY   — NVIDIA Nemotron API key (nvapi-...)
    CURRICULUM_DB    — absolute path to Chroma DB folder  (default: ./curriculum_db)
    CORS_ORIGINS     — comma-separated allowed origins     (default: http://localhost:3000)
    LLM_BACKEND      — nvidia | anthropic | local          (default: nvidia)
"""

import os
import sys

# ── Ensure the project root is on sys.path so rag_query / rag_api are found ──
ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# ── Import the FastAPI app — all logic lives in rag_api.py ───────────────────
from rag_api import app  # noqa: F401  re-exported for uvicorn

# ── Convenience: run directly with `python app.py` for quick local testing ───
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8090)),
        reload=False,   # set True only in dev
        workers=1,
    )
