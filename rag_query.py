"""
rag_query.py — Core RAG logic for the Testi curriculum assistant.

Supports two LLM backends (set via LLM_BACKEND env var):
  "nvidia"     → NVIDIA Nemotron-3-Ultra-550B via integrate.api.nvidia.com  (default)
  "anthropic"  → Anthropic claude-3-5-haiku
  "local"      → Ollama llama3 (offline fallback)

Embeddings always stay local: Ollama all-minilm at http://localhost:11434

# NEVER hardcode API keys. Set in environment:
#   NVIDIA_API_KEY   — for nvidia backend
#   ANTHROPIC_API_KEY — for anthropic backend
"""

from __future__ import annotations

import json
import os
import sys
import argparse
from typing import Generator, Iterator

import requests
import chromadb

# ────────────────────────────────────────────────────────────────────────────
# Configuration
# ────────────────────────────────────────────────────────────────────────────
LLM_BACKEND = os.environ.get("LLM_BACKEND", "nvidia")   # nvidia | anthropic | local

OLLAMA_BASE  = "http://localhost:11434"
EMBED_MODEL  = "all-minilm:latest"          # dimension must match stored vectors

# NVIDIA / OpenAI-compatible endpoint
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL    = "nvidia/nemotron-3-ultra-550b-a55b"
# Set NVIDIA_API_KEY in environment before running.
NVIDIA_API_KEY  = os.environ.get("NVIDIA_API_KEY", "")

# Anthropic fallback
ANTHROPIC_MODEL = "claude-3-5-haiku-20241022"
# Set ANTHROPIC_API_KEY in environment before running.
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

BLOOM_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]

# ────────────────────────────────────────────────────────────────────────────
# DB helpers
# ────────────────────────────────────────────────────────────────────────────

def get_collection(db_path: str):
    """Open the persistent Chroma DB and return the 'curriculum' collection."""
    client = chromadb.PersistentClient(path=db_path)
    return client.get_collection("curriculum")


# ────────────────────────────────────────────────────────────────────────────
# Embedding  (local Ollama — never changed)
# ────────────────────────────────────────────────────────────────────────────

def embed_query(text: str) -> list[float]:
    """Embed *text* using local Ollama all-minilm.
    Embeddings MUST stay local — do not change this model or endpoint.
    """
    resp = requests.post(
        f"{OLLAMA_BASE}/api/embeddings",
        json={"model": EMBED_MODEL, "prompt": text},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["embedding"]


# ────────────────────────────────────────────────────────────────────────────
# Retrieval
# ────────────────────────────────────────────────────────────────────────────

def retrieve(coll, query: str, k: int = 5, where: dict | None = None) -> list[dict]:
    """
    Retrieve top-k chunks matching *query*.
    Single filter: pass bare dict. Multiple: wrap in {"$and": [...]}.
    Stored metadata values are UPPERCASE — callers must uppercase filters.
    """
    embedding = embed_query(query)
    kwargs: dict = {"query_embeddings": [embedding], "n_results": k}
    if where:
        kwargs["where"] = where

    results = coll.query(**kwargs)
    chunks = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        chunks.append({
            "text":        doc,
            "source_file": meta.get("source_file", ""),
            "class":       meta.get("class", ""),
            "subject":     meta.get("subject", ""),
            "chunk":       meta.get("chunk", 0),
        })
    return chunks


# ────────────────────────────────────────────────────────────────────────────
# Level tiering
# ────────────────────────────────────────────────────────────────────────────

def level_from_score(score: float | None) -> str:
    """Map 0-100 score → beginner / intermediate / advanced. None → intermediate."""
    if score is None:  return "intermediate"
    if score < 50:     return "beginner"
    if score <= 80:    return "intermediate"
    return "advanced"


_LEVEL_ANSWER_INSTRUCTIONS = {
    "beginner": (
        "Explain in very simple language a young learner can follow. "
        "Use short sentences. Define every term you use. "
        "Give one concrete everyday example. Avoid jargon. Keep the answer brief."
    ),
    "intermediate": (
        "Give a clear explanation with correct terminology, briefly defined. "
        "Include reasoning (why / how), not just facts. Keep it moderately detailed."
    ),
    "advanced": (
        "Give a precise, technical explanation. Assume strong fundamentals. "
        "Include nuance, edge cases, and connections to related concepts."
    ),
}

_LEVEL_QUIZ_BLOOM = {
    "beginner":     ["Remember", "Understand"],
    "intermediate": ["Understand", "Apply", "Analyze"],
    "advanced":     ["Analyze", "Evaluate", "Create"],
}


# ────────────────────────────────────────────────────────────────────────────
# LLM backends
# ────────────────────────────────────────────────────────────────────────────

def call_llm(system_prompt: str, user_prompt: str) -> str:
    """Non-streaming LLM call. Returns the full response text."""
    if LLM_BACKEND == "nvidia":
        return _call_nvidia(system_prompt, user_prompt, stream=False)
    if LLM_BACKEND == "anthropic":
        return _call_anthropic(system_prompt, user_prompt)
    return _call_local(system_prompt, user_prompt)


def stream_llm(
    system_prompt: str,
    user_prompt: str,
) -> Generator[dict, None, None]:
    """
    Streaming LLM call.

    Yields dicts:
        {"type": "reasoning", "text": "..."}   — thinking tokens (nvidia only)
        {"type": "content",   "text": "..."}   — answer tokens
        {"type": "done"}                        — stream finished
    """
    if LLM_BACKEND == "nvidia":
        yield from _stream_nvidia(system_prompt, user_prompt)
    elif LLM_BACKEND == "anthropic":
        yield from _stream_anthropic(system_prompt, user_prompt)
    else:
        # local Ollama doesn't expose reasoning; wrap as plain content stream
        full = _call_local(system_prompt, user_prompt)
        yield {"type": "content", "text": full}
        yield {"type": "done"}


# ── NVIDIA Nemotron ──────────────────────────────────────────────────────────

def _call_nvidia(system_prompt: str, user_prompt: str, stream: bool = False):
    """Call NVIDIA via the OpenAI-compatible SDK."""
    from openai import OpenAI  # pip install openai

    client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=NVIDIA_API_KEY)

    kwargs = dict(
        model=NVIDIA_MODEL,
        messages=[
            {"role": "system",  "content": system_prompt},
            {"role": "user",    "content": user_prompt},
        ],
        temperature=0.6,
        top_p=0.95,
        max_tokens=4096,
        extra_body={
            "chat_template_kwargs": {"enable_thinking": True},
            "reasoning_budget": 4096,
        },
        stream=stream,
    )

    if not stream:
        completion = client.chat.completions.create(**kwargs)
        return completion.choices[0].message.content or ""

    return client.chat.completions.create(**kwargs)


def _stream_nvidia(system_prompt: str, user_prompt: str) -> Generator[dict, None, None]:
    """Stream Nemotron responses, separating reasoning_content from content."""
    stream = _call_nvidia(system_prompt, user_prompt, stream=True)
    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta

        # Reasoning/thinking tokens
        reasoning = getattr(delta, "reasoning_content", None)
        if reasoning:
            yield {"type": "reasoning", "text": reasoning}

        # Answer tokens
        if delta.content:
            yield {"type": "content", "text": delta.content}

    yield {"type": "done"}


# ── Anthropic ────────────────────────────────────────────────────────────────

def _call_anthropic(system_prompt: str, user_prompt: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text


def _stream_anthropic(system_prompt: str, user_prompt: str) -> Generator[dict, None, None]:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    with client.messages.stream(
        model=ANTHROPIC_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield {"type": "content", "text": text}
    yield {"type": "done"}


# ── Local Ollama ─────────────────────────────────────────────────────────────

def _call_local(system_prompt: str, user_prompt: str) -> str:
    resp = requests.post(
        f"{OLLAMA_BASE}/api/generate",
        json={
            "model": "llama3",
            "system": system_prompt,
            "prompt": user_prompt,
            "stream": False,
        },
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json().get("response", "")


# ────────────────────────────────────────────────────────────────────────────
# Core ask logic — returns dict, does NOT print
# ────────────────────────────────────────────────────────────────────────────

def _build_ask_prompts(
    question: str,
    chunks: list[dict],
    level: str,
    board: str = "CBSE",
    grade: int = 7,
) -> tuple[str, str]:
    context = "\n\n".join(
        f"[{c['class']} / {c['subject']} — {c['source_file']}]\n{c['text']}"
        for c in chunks
    )
    level_instruction = _LEVEL_ANSWER_INSTRUCTIONS[level]

    # Board-specific guidance
    board_guidance = {
        "CBSE":        "Follow NCERT syllabus. Use CBSE exam-oriented language. Structure answers clearly.",
        "ICSE":        "Use deeper conceptual explanations suited for ICSE. Include analytical and descriptive depth.",
        "State Board": "Align with regional syllabus. Keep language simple and exam-focused with key repetition.",
        "General":     "Provide balanced, curriculum-neutral explanations suitable for any board.",
    }.get(board, "Provide clear, curriculum-aligned explanations.")

    system_prompt = (
        "You are ALOS — an Adaptive Learning Operating System and expert curriculum tutor.\n"
        "Your mission: deliver personalised, board-aware, grade-appropriate answers.\n\n"
        f"STUDENT PROFILE:\n"
        f"  Grade : {grade}\n"
        f"  Board : {board}\n"
        f"  Level : {level.upper()}\n\n"
        f"BOARD GUIDANCE: {board_guidance}\n\n"
        f"LEVEL INSTRUCTION: {level_instruction}\n\n"
        "GROUNDING RULE (non-negotiable):\n"
        "Answer ONLY using the provided curriculum excerpts below.\n"
        "If the excerpts do not contain the answer, say so explicitly — never invent facts.\n"
        "The level changes style and depth, NOT accuracy or grounding.\n\n"
        "RESPONSE FORMAT:\n"
        "📘 Explanation\n"
        "🔑 Key Concepts (bullet points, include formulas if applicable)\n"
        "💡 Real-life Example\n"
        "📝 Practice Hint (one follow-up question the student should think about)"
    )
    user_prompt = f"Curriculum excerpts:\n{context}\n\nStudent question: {question}"
    return system_prompt, user_prompt


def _build_sources(chunks: list[dict]) -> list[dict]:
    seen: set[tuple] = set()
    sources: list[dict] = []
    for c in chunks:
        key = (c["source_file"], c["class"], c["subject"])
        if key not in seen:
            seen.add(key)
            sources.append({"source_file": c["source_file"], "class": c["class"], "subject": c["subject"]})
    return sources


def _get_chunks(
    question: str,
    coll,
    class_filter: str | None,
    subject_filter: str | None,
    k: int,
) -> list[dict]:
    filters = []
    if class_filter:
        filters.append({"class":   {"$eq": class_filter.upper()}})
    if subject_filter:
        filters.append({"subject": {"$eq": subject_filter.upper()}})
    where = filters[0] if len(filters) == 1 else ({"$and": filters} if filters else None)
    return retrieve(coll, question, k=k, where=where)


def ask_core(
    question: str,
    coll,
    class_filter: str | None = None,
    subject_filter: str | None = None,
    score: float | None = None,
    k: int = 5,
    board: str = "CBSE",
    grade: int = 7,
) -> dict:
    """Non-streaming ask. Returns {answer, level, sources}."""
    level  = level_from_score(score)
    chunks = _get_chunks(question, coll, class_filter, subject_filter, k)

    if not chunks:
        return {"answer": "No relevant curriculum content found.", "level": level, "sources": []}

    sys_p, usr_p = _build_ask_prompts(question, chunks, level, board=board, grade=grade)
    answer = call_llm(sys_p, usr_p)
    return {"answer": answer, "level": level, "sources": _build_sources(chunks)}


def ask_stream(
    question: str,
    coll,
    class_filter: str | None = None,
    subject_filter: str | None = None,
    score: float | None = None,
    k: int = 5,
    board: str = "CBSE",
    grade: int = 7,
) -> Generator[dict, None, None]:
    """
    Streaming ask.
    Yields: {"type":"meta",      "level":str, "sources":[...]}   (first event)
            {"type":"reasoning", "text":str}                      (thinking tokens)
            {"type":"content",   "text":str}                      (answer tokens)
            {"type":"done"}
    """
    level  = level_from_score(score)
    chunks = _get_chunks(question, coll, class_filter, subject_filter, k)

    if not chunks:
        yield {"type": "meta",    "level": level, "sources": []}
        yield {"type": "content", "text": "No relevant curriculum content found."}
        yield {"type": "done"}
        return

    yield {"type": "meta", "level": level, "sources": _build_sources(chunks)}

    sys_p, usr_p = _build_ask_prompts(question, chunks, level, board=board, grade=grade)
    yield from stream_llm(sys_p, usr_p)


# ────────────────────────────────────────────────────────────────────────────
# Core quiz logic — returns dict, does NOT print
# ────────────────────────────────────────────────────────────────────────────

def quiz_core(
    topic: str,
    coll,
    class_filter: str | None = None,
    subject_filter: str | None = None,
    score: float | None = None,
    k: int = 5,
    board: str = "CBSE",
    grade: int = 7,
) -> dict:
    level  = level_from_score(score)
    bloom_levels_for_level = _LEVEL_QUIZ_BLOOM[level]
    chunks = _get_chunks(topic, coll, class_filter, subject_filter, k)

    if not chunks:
        return {"level": level, "questions": [], "error": "No relevant curriculum content found."}

    context   = "\n\n".join(f"[{c['class']} / {c['subject']}]\n{c['text']}" for c in chunks)
    bloom_list = ", ".join(bloom_levels_for_level)

    # Board-specific guidance for quiz generation
    board_guidance = {
        "CBSE":        "Generate CBSE exam-style questions with clear structure and marking scheme.",
        "ICSE":        "Generate ICSE-style questions requiring analytical thinking and descriptive answers.",
        "State Board": "Generate state board exam-focused questions with local syllabus alignment.",
        "General":     "Generate balanced curriculum questions suitable for any board.",
    }.get(board, "Generate board-appropriate quiz questions.")

    system_prompt = (
        "You are an expert curriculum assessment designer for Grade {grade} {board} students. "
        f"Board Guidance: {board_guidance}\n\n"
        "Generate quiz questions ONLY based on the provided curriculum content. "
        "Do not invent facts. Return your response as valid JSON with this exact shape:\n"
        '{"questions": [{"bloom": "<Bloom level>", "question": "<question text>"}]}\n\n'
        f"Student Profile: Grade {grade}, {board} Board, {level.upper()} Level\n"
        f"Use ONLY these Bloom levels: {bloom_list}.\n"
        "Generate at least one question per Bloom level listed above."
    )
    user_prompt = f"Curriculum content:\n{context}\n\nTopic: {topic}\n\nReturn only the JSON object."

    raw = call_llm(system_prompt, user_prompt)

    try:
        clean = raw.strip()
        if clean.startswith("```"):
            lines = clean.splitlines()
            clean = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        data = json.loads(clean)
        questions = data.get("questions", [])
    except (json.JSONDecodeError, KeyError):
        questions = [{"bloom": bloom_levels_for_level[0], "question": raw}]

    return {"level": level, "questions": questions}


# ────────────────────────────────────────────────────────────────────────────
# CLI wrapper
# ────────────────────────────────────────────────────────────────────────────

def cmd_ask(args, coll):
    result = ask_core(
        question=args.question, coll=coll,
        class_filter=args.cls, subject_filter=args.subject, score=args.score,
    )
    print(f"\n[Level: {result['level'].upper()}]\n{result['answer']}")
    print("\n--- Sources ---")
    for s in result["sources"]:
        print(f"  {s['class']} / {s['subject']} — {s['source_file']}")


def cmd_quiz(args, coll):
    result = quiz_core(
        topic=args.topic, coll=coll,
        class_filter=args.cls, subject_filter=args.subject, score=args.score,
    )
    print(f"\n[Level: {result['level'].upper()}]\n")
    for i, q in enumerate(result.get("questions", []), 1):
        print(f"Q{i} [{q['bloom']}]: {q['question']}")


def main():
    parser = argparse.ArgumentParser(description="Curriculum RAG CLI")
    parser.add_argument("--db", default=os.environ.get("CURRICULUM_DB", "./curriculum_db"))
    sub = parser.add_subparsers(dest="cmd")

    ask_p = sub.add_parser("ask")
    ask_p.add_argument("question")
    ask_p.add_argument("--class",   dest="cls",     default=None)
    ask_p.add_argument("--subject",                 default=None)
    ask_p.add_argument("--score",   type=float,     default=None)

    quiz_p = sub.add_parser("quiz")
    quiz_p.add_argument("topic")
    quiz_p.add_argument("--class",   dest="cls",    default=None)
    quiz_p.add_argument("--subject",                default=None)
    quiz_p.add_argument("--score",   type=float,    default=None)

    args = parser.parse_args()
    if not args.cmd:
        parser.print_help()
        sys.exit(1)

    coll = get_collection(args.db)
    if args.cmd == "ask":
        cmd_ask(args, coll)
    elif args.cmd == "quiz":
        cmd_quiz(args, coll)


if __name__ == "__main__":
    main()
