"""
ingest.py — Curriculum PDF/TXT ingest pipeline for ChromaDB.

Usage:
    python ingest.py --source ./books --db ./curriculum_db

What it does:
    1. Walks all .pdf and .txt files under --source
    2. Skips preface / about-book / index pages automatically
    3. Splits each chapter into overlapping chunks
    4. Stores each chunk with rich metadata:
           class, subject, chapter, topic, chunk_type, source_file
    5. Embeds via local Ollama all-minilm (never changes)
    6. Upserts into ChromaDB collection "curriculum"

Run ONCE to build the DB, then start rag_api with uvicorn.

Environment variables (optional):
    CURRICULUM_DB   — path to Chroma DB folder   (default: ./curriculum_db)
    OLLAMA_BASE     — Ollama endpoint             (default: http://localhost:11434)
    EMBED_MODEL     — Ollama embed model          (default: all-minilm:latest)

Requirements (in requirements.txt):
    pymupdf (PyMuPDF) for PDF reading: pip install pymupdf
    chromadb, requests (already in requirements.txt)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Generator

import requests
import chromadb

# ─── Config ──────────────────────────────────────────────────────────────────
OLLAMA_BASE = os.environ.get("OLLAMA_BASE", "http://localhost:11434")
EMBED_MODEL = "all-minilm:latest"

CHUNK_SIZE    = 400   # tokens (approximate — we split by words)
CHUNK_OVERLAP = 80    # words of overlap between consecutive chunks

# ─── Sections to SKIP during ingest ──────────────────────────────────────────
SKIP_SECTIONS: frozenset[str] = frozenset({
    "about the book",
    "about this book",
    "preface",
    "acknowledgement",
    "acknowledgments",
    "acknowledgment",
    "publisher",
    "publisher's note",
    "publisher note",
    "copyright",
    "table of contents",
    "index",
    "foreword",
    "introduction",    # generic "introduction" before chapter 1
    "to the teacher",
    "to the student",
    "note to teachers",
    "note to students",
    "how to use this book",
    "isbn",
})

# Patterns in running text that signal non-academic content
SKIP_TEXT_SIGNALS: tuple[str, ...] = (
    "all rights reserved",
    "printed in india",
    "published by ncert",
    "national council of educational",
    "textbook development committee",
    "chief advisor",
    "members of the",
    "publication team",
)

# ─── Heading detectors ────────────────────────────────────────────────────────
# Matches: "Chapter 1", "CHAPTER 1", "Chapter 1:", "1. Rational Numbers"
_CHAPTER_RE = re.compile(
    r"^\s*(?:chapter\s+)?(\d{1,2})\s*[:\-–—]?\s*(.+)",
    re.IGNORECASE,
)

# Matches exercise / example headings — good chunk boundaries
_EXERCISE_RE = re.compile(
    r"^\s*(exercise|example|activity|do this|think and discuss)\s*[\d\.]",
    re.IGNORECASE,
)


# ─── Embedding ────────────────────────────────────────────────────────────────

def embed(text: str) -> list[float]:
    resp = requests.post(
        f"{OLLAMA_BASE}/api/embeddings",
        json={"model": EMBED_MODEL, "prompt": text},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["embedding"]


# ─── PDF reader ───────────────────────────────────────────────────────────────

def read_pdf_pages(path: Path) -> list[tuple[int, str]]:
    """Return [(page_number, text), ...]. Requires PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("  [WARN] PyMuPDF not installed — skipping PDF. Run: pip install pymupdf")
        return []

    doc   = fitz.open(str(path))
    pages = []
    for i, page in enumerate(doc, start=1):
        text = page.get_text("text")
        if text.strip():
            pages.append((i, text))
    doc.close()
    return pages


def read_txt_pages(path: Path) -> list[tuple[int, str]]:
    """Treat each double-newline paragraph block as a 'page'."""
    text = path.read_text(encoding="utf-8", errors="replace")
    blocks = [b.strip() for b in re.split(r"\n{2,}", text) if b.strip()]
    return [(i + 1, b) for i, b in enumerate(blocks)]


# ─── Metadata inference from filename ────────────────────────────────────────

def infer_meta_from_filename(path: Path) -> dict:
    """
    Try to extract grade, subject from filename.
    Expected patterns (case-insensitive):
        class8_maths.pdf
        grade-6-science.txt
        NCERT_Class10_Social_Science.pdf
        maths_grade7.pdf
    Returns dict with "class" and "subject" (or empty strings if undetectable).
    """
    name = path.stem.lower().replace("-", " ").replace("_", " ")

    # Grade
    grade = ""
    m = re.search(r"(?:class|grade|std)\s*(\d{1,2})", name)
    if m:
        grade = m.group(1)
    else:
        # bare number at start like "8_maths"
        m2 = re.match(r"(\d{1,2})\b", name)
        if m2:
            grade = m2.group(1)

    # Subject — simple keyword map
    subject_map = {
        "math":    "Mathematics",
        "maths":   "Mathematics",
        "science": "Science",
        "physics": "Physics",
        "chem":    "Chemistry",
        "bio":     "Biology",
        "english": "English",
        "hindi":   "Hindi",
        "social":  "Social Science",
        "history": "History",
        "geo":     "Geography",
        "civics":  "Civics",
        "photo":   "Photography",
        "computer":"Computer Science",
    }
    subject = ""
    for kw, label in subject_map.items():
        if kw in name:
            subject = label
            break

    return {"class": grade, "subject": subject}


# ─── Chapter / section parser ─────────────────────────────────────────────────

class Section:
    def __init__(self, chapter_num: str, chapter_title: str, topic: str):
        self.chapter_num   = chapter_num
        self.chapter_title = chapter_title
        self.topic         = topic
        self.lines: list[str] = []

    @property
    def full_chapter(self) -> str:
        t = self.chapter_title.strip()
        return f"Chapter {self.chapter_num}: {t}" if self.chapter_num else t

    def text(self) -> str:
        return "\n".join(self.lines)


def parse_sections(pages: list[tuple[int, str]]) -> list[Section]:
    """
    Walk pages, detect chapter headings, and split content into Sections.
    Non-academic pages (preface etc.) are discarded at this stage.
    """
    sections: list[Section] = []
    current: Section | None = None

    def _is_skip(text: str) -> bool:
        first_line = text.strip().split("\n")[0].lower().strip()
        # exact match
        if first_line in SKIP_SECTIONS:
            return True
        # partial: heading starts with a skip word
        for skip in SKIP_SECTIONS:
            if first_line.startswith(skip):
                return True
        # in-text signals
        sample = text[:300].lower()
        return any(sig in sample for sig in SKIP_TEXT_SIGNALS)

    for _page_no, raw_text in pages:
        lines = raw_text.splitlines()

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # ── chapter heading detection ──────────────────────────────
            m = _CHAPTER_RE.match(stripped)
            if m and len(stripped) < 120:
                ch_num   = m.group(1)
                ch_title = m.group(2).strip(" :-–—")

                # Skip non-academic headings
                if ch_title.lower() in SKIP_SECTIONS or any(
                    ch_title.lower().startswith(s) for s in SKIP_SECTIONS
                ):
                    current = None
                    continue

                current = Section(ch_num, ch_title, ch_title)
                sections.append(current)
                continue

            # ── exercise / example heading → new topic within chapter ──
            if _EXERCISE_RE.match(stripped) and current:
                current.topic = stripped.title()

            # ── accumulate body text ───────────────────────────────────
            if current is not None:
                if not _is_skip(stripped):
                    current.lines.append(stripped)

    # Remove empty sections
    return [s for s in sections if s.text().strip()]


# ─── Chunker ──────────────────────────────────────────────────────────────────

def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping word windows."""
    words  = text.split()
    chunks = []
    start  = 0
    while start < len(words):
        end = start + size
        chunks.append(" ".join(words[start:end]))
        start += size - overlap
        if start >= len(words):
            break
    return [c.strip() for c in chunks if c.strip()]


# ─── Stable chunk ID ──────────────────────────────────────────────────────────

def chunk_id(source_file: str, chapter: str, chunk_index: int) -> str:
    raw = f"{source_file}::{chapter}::{chunk_index}"
    return hashlib.md5(raw.encode()).hexdigest()


# ─── Main ingest ──────────────────────────────────────────────────────────────

def ingest_file(
    path: Path,
    collection,
    default_class: str = "",
    default_subject: str = "",
    batch_size: int = 50,
) -> int:
    """Process one file. Returns number of chunks upserted."""
    print(f"\n{'='*60}")
    print(f"  Ingesting: {path.name}")

    # ── Read pages ──────────────────────────────────────────────────
    if path.suffix.lower() == ".pdf":
        pages = read_pdf_pages(path)
    else:
        pages = read_txt_pages(path)

    if not pages:
        print("  [SKIP] No readable content.")
        return 0

    # ── Infer meta from filename ─────────────────────────────────────
    file_meta = infer_meta_from_filename(path)
    grade   = file_meta["class"]   or default_class
    subject = file_meta["subject"] or default_subject

    # ── Parse into chapter sections ──────────────────────────────────
    sections = parse_sections(pages)
    if not sections:
        print("  [WARN] No chapter sections found — check file structure.")
        return 0

    print(f"  Grade={grade or '?'}  Subject={subject or '?'}  Chapters={len(sections)}")

    # ── Chunk + embed + upsert in batches ────────────────────────────
    ids, embeddings, docs, metas = [], [], [], []
    total = 0

    for section in sections:
        body = section.text()
        raw_chunks = chunk_text(body)

        for ci, text in enumerate(raw_chunks):
            cid = chunk_id(path.name, section.full_chapter, ci)
            try:
                emb = embed(text)
            except Exception as e:
                print(f"  [EMBED ERROR] {e}")
                continue

            ids.append(cid)
            embeddings.append(emb)
            docs.append(text)
            metas.append({
                "source_file": path.name,
                "class":       grade.upper() if grade else "",
                "subject":     subject.upper() if subject else "",
                "chapter":     section.full_chapter,
                "topic":       section.topic,
                "chunk_type":  "content",        # guaranteed academic content
                "chunk_index": ci,
            })

            # Flush batch
            if len(ids) >= batch_size:
                collection.upsert(ids=ids, embeddings=embeddings, documents=docs, metadatas=metas)
                total += len(ids)
                print(f"    upserted {total} chunks…")
                ids, embeddings, docs, metas = [], [], [], []

    # Final partial batch
    if ids:
        collection.upsert(ids=ids, embeddings=embeddings, documents=docs, metadatas=metas)
        total += len(ids)

    print(f"  Done — {total} chunks ingested from {len(sections)} sections.")
    return total


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ingest curriculum PDFs/TXTs into ChromaDB — skips preface/index/about-book pages"
    )
    parser.add_argument(
        "--source", "-s",
        default=os.environ.get("CURRICULUM_SOURCE", "./books"),
        help="Folder containing .pdf / .txt curriculum files  (default: ./books)",
    )
    parser.add_argument(
        "--db", "-d",
        default=os.environ.get("CURRICULUM_DB", "./curriculum_db"),
        help="ChromaDB folder path  (default: ./curriculum_db)",
    )
    parser.add_argument("--class",   dest="grade",   default="", help="Override grade for all files (e.g. 8)")
    parser.add_argument("--subject", dest="subject",  default="", help="Override subject for all files")
    parser.add_argument("--reset",   action="store_true",  help="Drop and recreate the collection before ingest")
    args = parser.parse_args()

    source_dir = Path(args.source)
    if not source_dir.exists():
        print(f"[ERROR] Source directory not found: {source_dir}")
        print("  Create it and put your PDF/TXT curriculum files inside.")
        sys.exit(1)

    # ── Open / create ChromaDB ────────────────────────────────────────
    client = chromadb.PersistentClient(path=args.db)

    if args.reset:
        try:
            client.delete_collection("curriculum")
            print("[reset] Deleted existing 'curriculum' collection.")
        except Exception:
            pass

    collection = client.get_or_create_collection(
        "curriculum",
        metadata={"hnsw:space": "cosine"},
    )
    print(f"[startup] ChromaDB at {args.db} — collection 'curriculum' has {collection.count()} chunks")

    # ── Walk source directory ─────────────────────────────────────────
    files = sorted([
        p for p in source_dir.rglob("*")
        if p.suffix.lower() in {".pdf", ".txt"} and p.is_file()
    ])

    if not files:
        print(f"[ERROR] No .pdf or .txt files found in: {source_dir}")
        sys.exit(1)

    print(f"\n[ingest] Found {len(files)} files to process\n")

    grand_total = 0
    for f in files:
        grand_total += ingest_file(f, collection, default_class=args.grade, default_subject=args.subject)

    print(f"\n{'='*60}")
    print(f"INGEST COMPLETE — {grand_total} total chunks in ChromaDB")
    print(f"Collection now has: {collection.count()} chunks")
    print(f"\nNext step: start the API server:")
    print(f"  NVIDIA_API_KEY=nvapi-... uvicorn app:app --host 0.0.0.0 --port 8090")


if __name__ == "__main__":
    main()
