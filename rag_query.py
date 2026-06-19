"""
rag_query.py — Core RAG logic for the edu ai curriculum assistant.

Supports four LLM backends (set via LLM_BACKEND env var):
  "openai"     → OpenAI GPT-4o (default — best output quality)
  "nvidia"     → NVIDIA Nemotron-3-Ultra-550B via integrate.api.nvidia.com
  "anthropic"  → Anthropic claude-3-5-haiku
  "local"      → Ollama llama3 (offline fallback)

Embeddings always stay local: Ollama all-minilm at http://localhost:11434

# NEVER hardcode API keys. Set in environment:
#   OPENAI_API_KEY    — for openai backend   (recommended)
#   NVIDIA_API_KEY    — for nvidia backend
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
LLM_BACKEND = os.environ.get("LLM_BACKEND", "openai")   # openai | nvidia | anthropic | local

OLLAMA_BASE  = "http://localhost:11434"
EMBED_MODEL  = "all-minilm:latest"          # dimension must match stored vectors

# OpenAI backend (default — best output quality)
OPENAI_BASE_URL  = "https://api.openai.com/v1"
OPENAI_MODEL     = os.environ.get("OPENAI_MODEL", "gpt-4o")
# Set OPENAI_API_KEY in environment before running.
OPENAI_API_KEY   = os.environ.get("OPENAI_API_KEY", "")

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

# Non-academic chunk types to exclude before sending content to the LLM
SKIP_CHUNK_TYPES = frozenset({
    "preface", "about_book", "about_the_book", "publisher_note", "publisher_notes",
    "copyright", "index", "acknowledgement", "acknowledgment", "introduction",
    "toc", "table_of_contents", "foreword", "about this book",
})

# Text/source heuristics when chunk_type metadata is missing at ingest time
PREFACE_SIGNALS = (
    "about the book", "about this book", "preface", "publisher note",
    "publisher's note", "copyright", "acknowledgement", "acknowledgment",
    "table of contents", "foreword", "isbn", "all rights reserved",
    "published by", "printed in",
)

EXCERPT_AI_TUTOR_SYSTEM_PROMPT = """\
ROLE

You are Excerpt AI Tutor, an AI-powered adaptive learning system.

You teach students using curriculum content retrieved from the Excerpt Learning Platform.

Your job is NOT to summarize documents.

Your job is to TEACH students.

---

CONTENT PRIORITY RULE

You receive:

1. Student Profile
2. Quiz Performance
3. Retrieved Curriculum Content
4. Weak Topics
5. Bloom Level

Always use retrieved curriculum content as the primary source.

Never behave like a document analyst.

Never describe what the document contains.

Never say:

"The provided excerpt states..."
"The document explains..."
"The passage discusses..."
"The content does not contain..."

These responses are forbidden.

Instead teach the student directly.

---

CURRICULUM FILTERING RULE

Ignore content if it belongs to:

* About the Book
* Preface
* Introduction
* Publisher Notes
* Copyright Pages
* Acknowledgements
* Index
* Table of Contents

Only use:

* Chapters
* Concepts
* Definitions
* Examples
* Exercises
* Activities
* Learning Outcomes

If retrieved content is non-academic or introductory:

DO NOT explain the introduction.

Instead identify the closest curriculum topic and teach that topic.

---

TOPIC EXTRACTION RULE

Before generating a response:

Step 1:
Identify actual syllabus topic.

Examples:

If content mentions:

Fractions → Topic = Fractions
Decimals → Topic = Decimals
Algebra → Topic = Introduction to Algebra
Ratio → Topic = Ratio and Proportion
Geometry → Topic = Basic Geometry
Data → Topic = Data Handling

Step 2:
Teach the topic.

Never teach the document itself.

---

ADAPTIVE LEARNING RULES

IF quiz_score < 50

Level = FOUNDATION

Teach:

* Definition
* Simple Explanation
* Visual Understanding
* Real Life Examples
* Easy Practice

Avoid:

* Advanced Concepts
* Complex Formulae
* Competitive Questions

---

IF quiz_score BETWEEN 50 AND 70

Level = BASIC

Teach:

* Core Concepts
* Simple Applications
* Common Mistakes

Generate:

* Moderate Questions
* Guided Practice

---

IF quiz_score BETWEEN 70 AND 85

Level = INTERMEDIATE

Teach:

* Advanced Concepts
* Problem Solving
* Analytical Thinking

Generate:

* Application Questions
* Multi-step Problems

---

IF quiz_score > 85

Level = ADVANCED

Teach:

* Full Chapter Concepts
* HOTS Questions
* Olympiad Style Problems
* Real-world Applications
* Cross-topic Connections

---

WEAK TOPIC RECOVERY

If weak_topics exist:

Spend:

70% explanation on weak topics

30% on current topic

Repair misconceptions first.

Then continue learning.

---

BLOOM TAXONOMY RULE

Remember:
Definition → Remember
Explanation → Understand
Practice → Apply
Comparison → Analyze
Evaluation → Evaluate
Innovation → Create

Generate according to bloom_level.

---

RESPONSE FORMAT

Always return JSON only.

{
"student_level":"",
"topic":"",
"subtopic":"",
"explanation":"",
"example":"",
"real_life_application":"",
"practice_question":"",
"hint":"",
"next_step":"",
"difficulty":""
}

---

CRITICAL RULE

Never explain the retrieved document.

Always explain the actual academic topic.

The student wants learning content, not document analysis.

If retrieved text is poor quality, incomplete, or from introductory pages:

Infer the curriculum topic and continue teaching.

Never mention retrieval limitations to the student."""

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
            "chunk_type":  meta.get("chunk_type", ""),
        })
    return chunks


def _normalize_chunk_type(value: str) -> str:
    return value.lower().strip().replace("-", "_").replace(" ", "_")


def _detect_chunk_type(chunk: dict) -> str:
    """Resolve chunk_type from metadata, filename, or opening text."""
    meta_type = _normalize_chunk_type(chunk.get("chunk_type") or "")
    if meta_type:
        return meta_type

    source = (chunk.get("source_file") or "").lower()
    for signal in PREFACE_SIGNALS:
        slug = signal.replace(" ", "_")
        if signal in source or slug in source:
            return slug

    text_start = (chunk.get("text") or "")[:600].lower()
    for signal in PREFACE_SIGNALS:
        if signal in text_start:
            return signal.replace(" ", "_")

    return "content"


def _should_skip_chunk(chunk: dict) -> bool:
    """Return True for preface/about-book/index chunks that are not syllabus content."""
    chunk_type = _detect_chunk_type(chunk)
    if chunk_type in SKIP_CHUNK_TYPES:
        return True
    # Catch partial matches like "about_book_page"
    return any(chunk_type.startswith(skip) for skip in SKIP_CHUNK_TYPES)


def _filter_curriculum_chunks(chunks: list[dict]) -> list[dict]:
    """Remove non-academic introductory material before LLM context assembly."""
    return [c for c in chunks if not _should_skip_chunk(c)]


def student_level_from_score(score: float | None) -> str:
    """Map quiz score to adaptive teaching tier used by Excerpt AI Tutor."""
    if score is None:
        return "BASIC"
    if score < 50:
        return "FOUNDATION"
    if score <= 70:
        return "BASIC"
    if score <= 85:
        return "INTERMEDIATE"
    return "ADVANCED"


def bloom_level_from_score(score: float | None, override: str | None = None) -> str:
    if override and override in BLOOM_LEVELS:
        return override
    tier = student_level_from_score(score)
    return {
        "FOUNDATION":   "Remember",
        "BASIC":        "Understand",
        "INTERMEDIATE": "Apply",
        "ADVANCED":     "Analyze",
    }[tier]


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
    if LLM_BACKEND == "openai":
        return _call_openai(system_prompt, user_prompt, stream=False)
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
    if LLM_BACKEND == "openai":
        yield from _stream_openai(system_prompt, user_prompt)
    elif LLM_BACKEND == "nvidia":
        yield from _stream_nvidia(system_prompt, user_prompt)
    elif LLM_BACKEND == "anthropic":
        yield from _stream_anthropic(system_prompt, user_prompt)
    else:
        # local Ollama doesn't expose reasoning; wrap as plain content stream
        full = _call_local(system_prompt, user_prompt)
        yield {"type": "content", "text": full}
        yield {"type": "done"}


# ── OpenAI GPT-4o ────────────────────────────────────────────────────────────

def _call_openai(system_prompt: str, user_prompt: str, stream: bool = False):
    """Call OpenAI GPT-4o via the official SDK.
    Set OPENAI_API_KEY in environment. Never hardcode the key.
    """
    from openai import OpenAI

    client = OpenAI(base_url=OPENAI_BASE_URL, api_key=OPENAI_API_KEY)

    kwargs = dict(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.4,          # lower = more consistent teaching output
        top_p=0.95,
        max_tokens=4096,
        response_format={"type": "json_object"},  # enforce JSON output
        stream=stream,
    )

    if not stream:
        completion = client.chat.completions.create(**kwargs)
        return completion.choices[0].message.content or ""

    return client.chat.completions.create(**kwargs)


def _stream_openai(system_prompt: str, user_prompt: str) -> Generator[dict, None, None]:
    """Stream GPT-4o responses token by token."""
    # json_object mode is incompatible with streaming in some SDK versions —
    # fall back to non-streaming and yield as a single content block.
    try:
        from openai import OpenAI
        client = OpenAI(base_url=OPENAI_BASE_URL, api_key=OPENAI_API_KEY)
        stream = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.4,
            top_p=0.95,
            max_tokens=4096,
            stream=True,
        )
        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta.content:
                yield {"type": "content", "text": delta.content}
        yield {"type": "done"}
    except Exception as exc:
        # Fallback: non-streaming
        try:
            full = _call_openai(system_prompt, user_prompt, stream=False)
            yield {"type": "content", "text": full}
        except Exception as exc2:
            yield {"type": "error", "text": str(exc2)}
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
    score: float | None = None,
    topic: str | None = None,
    weak_topics: list[str] | None = None,
    bloom_level: str | None = None,
) -> tuple[str, str]:
    retrieved_content = "\n\n".join(
        f"[{c['class']} / {c['subject']} — {c['source_file']}]\n{c['text']}"
        for c in chunks
    )
    student_level = student_level_from_score(score)
    resolved_bloom = bloom_level_from_score(score, bloom_level)
    resolved_topic = (topic or question).strip()
    resolved_weak = weak_topics or []

    payload = {
        "student": {
            "grade": grade,
            "board": board,
            "level": student_level,
            "legacy_level": level,
        },
        "topic": resolved_topic,
        "retrieved_content": retrieved_content,
        "weak_topics": resolved_weak,
        "quiz_score": score if score is not None else 60,
        "bloom_level": resolved_bloom,
        "question": question,
    }

    user_prompt = (
        "Use the structured input below to teach the student. "
        "Return JSON only — no markdown fences, no preamble.\n\n"
        f"{json.dumps(payload, indent=2)}"
    )
    return EXCERPT_AI_TUTOR_SYSTEM_PROMPT, user_prompt


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

    # Over-fetch so filtering preface/about-book chunks still leaves enough syllabus content
    raw = retrieve(coll, question, k=max(k * 4, 20), where=where)
    filtered = _filter_curriculum_chunks(raw)
    return filtered[:k]


def ask_core(
    question: str,
    coll,
    class_filter: str | None = None,
    subject_filter: str | None = None,
    score: float | None = None,
    k: int = 5,
    board: str = "CBSE",
    grade: int = 7,
    topic: str | None = None,
    weak_topics: list[str] | None = None,
    bloom_level: str | None = None,
) -> dict:
    """Non-streaming ask. Returns {answer, level, sources}."""
    level  = level_from_score(score)
    chunks = _get_chunks(question, coll, class_filter, subject_filter, k)

    if not chunks:
        return {"answer": "No relevant curriculum content found.", "level": level, "sources": []}

    sys_p, usr_p = _build_ask_prompts(
        question, chunks, level, board=board, grade=grade, score=score,
        topic=topic, weak_topics=weak_topics, bloom_level=bloom_level,
    )
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
    topic: str | None = None,
    weak_topics: list[str] | None = None,
    bloom_level: str | None = None,
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

    sys_p, usr_p = _build_ask_prompts(
        question, chunks, level, board=board, grade=grade, score=score,
        topic=topic, weak_topics=weak_topics, bloom_level=bloom_level,
    )
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

    board_guidance = {
        "CBSE":        "Generate CBSE exam-style questions with clear structure and marking scheme.",
        "ICSE":        "Generate ICSE-style questions requiring analytical thinking and descriptive answers.",
        "State Board": "Generate state board exam-focused questions with local syllabus alignment.",
        "General":     "Generate balanced curriculum questions suitable for any board.",
    }.get(board, "Generate board-appropriate quiz questions.")

    system_prompt = (
        "You are an expert curriculum assessment designer. "
        "Generate quiz questions ONLY from actual chapter/syllabus content — "
        "NEVER from preface, about-the-book, copyright, index, or table-of-contents material. "
        f"Board Guidance: {board_guidance}\n\n"
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
