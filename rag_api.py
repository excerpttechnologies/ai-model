"""
rag_api.py — FastAPI backend for the edu ai Student Assessment Platform.

LLM: NVIDIA Nemotron-3-Ultra-550B (streaming + reasoning) via integrate.api.nvidia.com
Embeddings: local Ollama all-minilm (never changes)

# NEVER hardcode API keys. Set in environment before running:
#   NVIDIA_API_KEY   — for the Nemotron LLM
#   CURRICULUM_DB    — path to Chroma DB (default: ./curriculum_db)
#   CORS_ORIGINS     — comma-separated allowed origins (default: http://localhost:3000)

Run:
    NVIDIA_API_KEY=nvapi-... venv/bin/uvicorn rag_api:app --host 0.0.0.0 --port 8090
"""

import json
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from rag_query import (
    get_collection,
    ask_core,
    ask_stream,
    quiz_core,
    level_from_score,
    LLM_BACKEND,
    OPENAI_MODEL,
    NVIDIA_MODEL,
)

# ────────────────────────────────────────────────────────────────────────────
# Config
# ────────────────────────────────────────────────────────────────────────────
CURRICULUM_DB = os.environ.get("CURRICULUM_DB", "./curriculum_db")

# ────────────────────────────────────────────────────────────────────────────
# Startup — open Chroma collection ONCE
# ────────────────────────────────────────────────────────────────────────────
_collection = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _collection
    try:
        _collection = get_collection(CURRICULUM_DB)
        count = _collection.count()
        active_model = OPENAI_MODEL if LLM_BACKEND == "openai" else NVIDIA_MODEL
        print(f"[startup] Chroma collection loaded — {count} chunks from {CURRICULUM_DB}")
        print(f"[startup] LLM backend: {LLM_BACKEND.upper()} / model: {active_model}")
    except Exception as e:
        print(f"[startup] WARNING: Could not load Chroma collection: {e}")
        print(f"[startup] DB path: {CURRICULUM_DB}")
        print("[startup] Run:  python ingest.py --source ./books --db ./curriculum_db")
        _collection = None
    yield


app = FastAPI(title="edu ai Curriculum RAG API", version="2.0.0", lifespan=lifespan)

# ────────────────────────────────────────────────────────────────────────────
# CORS
# ────────────────────────────────────────────────────────────────────────────
_raw_origins   = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────────────────────────────────────
# Pydantic models
# ────────────────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question:    str
    class_name:  Optional[str]        = None
    subject:     Optional[str]        = None
    score:       Optional[float]       = None
    board:       str                   = "CBSE"
    grade:       int                   = 7
    topic:       Optional[str]         = None
    weak_topics: Optional[List[str]]   = None
    bloom_level: Optional[str]         = None


class Source(BaseModel):
    source_file: str
    class_name:  str
    subject:     str


class AskResponse(BaseModel):
    answer:  str
    level:   str
    sources: list[Source]


class QuizRequest(BaseModel):
    topic:      str
    class_name: Optional[str]   = None
    subject:    Optional[str]   = None
    score:      Optional[float] = None
    board:      str             = "CBSE"
    grade:      int             = 7


class QuizQuestion(BaseModel):
    bloom:    str
    question: str


class QuizResponse(BaseModel):
    level:     str
    questions: list[QuizQuestion]


class HealthResponse(BaseModel):
    status:  str
    chunks:  int
    backend: str
    model:   str


# ────────────────────────────────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    try:
        count = _collection.count() if _collection is not None else -1
    except Exception:
        count = -1

    active_model = OPENAI_MODEL if LLM_BACKEND == "openai" else NVIDIA_MODEL
    return {
        "status":  "ok",
        "chunks":  count,
        "backend": LLM_BACKEND,
        "model":   active_model,
    }


# ── Non-streaming /ask (kept for compatibility) ──────────────────────────────

@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    if _collection is None:
        raise HTTPException(status_code=503, detail="Chroma DB not loaded — check CURRICULUM_DB path and server logs")
    if not req.question.strip():
        raise HTTPException(status_code=422, detail="question must not be empty")
    try:
        result = await run_in_threadpool(
            ask_core,
            question=req.question,
            coll=_collection,
            class_filter=req.class_name,
            subject_filter=req.subject,
            score=req.score,
            board=req.board,
            grade=req.grade,
            topic=req.topic,
            weak_topics=req.weak_topics,
            bloom_level=req.bloom_level,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RAG pipeline error: {exc}") from exc

    sources = [
        Source(source_file=s["source_file"], class_name=s["class"], subject=s["subject"])
        for s in result["sources"]
    ]
    return AskResponse(answer=result["answer"], level=result["level"], sources=sources)


# ── Streaming /ask/stream — SSE  ─────────────────────────────────────────────
#
# Each Server-Sent Event is a JSON line prefixed with "data: " and ends with "\n\n".
# Event shapes emitted:
#   {"type":"meta",      "level":"...", "sources":[...]}
#   {"type":"reasoning", "text":"..."}    ← Nemotron thinking tokens
#   {"type":"content",   "text":"..."}    ← answer tokens
#   {"type":"done"}
#
# The frontend reads these with EventSource or fetch+ReadableStream.

@app.post("/ask/stream")
async def ask_stream_endpoint(req: AskRequest):
    if _collection is None:
        raise HTTPException(status_code=503, detail="Chroma DB not loaded — check CURRICULUM_DB path and server logs")
    if not req.question.strip():
        raise HTTPException(status_code=422, detail="question must not be empty")

    async def event_generator() -> AsyncGenerator[str, None]:
        # ask_stream is a synchronous generator — run each next() in threadpool
        import asyncio

        loop = asyncio.get_event_loop()

        def _run_gen():
            """Collect all events from the sync generator and return as list."""
            return list(
                ask_stream(
                    question=req.question,
                    coll=_collection,
                    class_filter=req.class_name,
                    subject_filter=req.subject,
                    score=req.score,
                    board=req.board,
                    grade=req.grade,
                    topic=req.topic,
                    weak_topics=req.weak_topics,
                    bloom_level=req.bloom_level,
                )
            )

        try:
            events = await run_in_threadpool(_run_gen)
        except Exception as exc:
            err = json.dumps({"type": "error", "text": str(exc)})
            yield f"data: {err}\n\n"
            return

        for event in events:
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable nginx buffering
        },
    )


# ── /quiz ────────────────────────────────────────────────────────────────────

@app.post("/quiz", response_model=QuizResponse)
async def quiz(req: QuizRequest):
    if _collection is None:
        raise HTTPException(status_code=503, detail="Chroma DB not loaded — check CURRICULUM_DB path and server logs")
    if not req.topic.strip():
        raise HTTPException(status_code=422, detail="topic must not be empty")
    try:
        result = await run_in_threadpool(
            quiz_core,
            topic=req.topic,
            coll=_collection,
            class_filter=req.class_name,
            subject_filter=req.subject,
            score=req.score,
            board=req.board,
            grade=req.grade,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RAG pipeline error: {exc}") from exc

    if "error" in result and not result["questions"]:
        return QuizResponse(level=result["level"], questions=[])

    questions = [QuizQuestion(bloom=q["bloom"], question=q["question"]) for q in result["questions"]]
    return QuizResponse(level=result["level"], questions=questions)
