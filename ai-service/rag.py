"""
RAG layer: ChromaDB PersistentClient + a multilingual sentence-transformer.

Fixes the deprecated `chromadb.Client(Settings(persist_directory=...))` API
used in the old backend/chroma-db scripts — modern chromadb uses
`PersistentClient(path=...)` directly.
"""

import threading
from functools import lru_cache

import chromadb

import config

_embedder_lock = threading.Lock()
_embedder = None


def get_embedder():
    """Lazily loads the multilingual embedding model (loaded once, reused)."""
    global _embedder
    if _embedder is None:
        with _embedder_lock:
            if _embedder is None:
                from sentence_transformers import SentenceTransformer

                _embedder = SentenceTransformer(config.EMBEDDING_MODEL_NAME)
    return _embedder


@lru_cache(maxsize=1)
def get_client():
    return chromadb.PersistentClient(path=config.CHROMA_DB_PATH)


def _collection(name: str):
    return get_client().get_or_create_collection(name)


def _embed(texts, is_query: bool):
    # E5 models expect a "query: " / "passage: " instruction prefix.
    prefix = "query: " if is_query else "passage: "
    model = get_embedder()
    return model.encode([prefix + t for t in texts], normalize_embeddings=True).tolist()


def upsert_farmer(farmer: dict):
    """Embed a farmer profile dict into the farmer_profiles collection."""
    farmer_id = str(farmer.get("id") or farmer.get("_id"))
    if not farmer_id or farmer_id == "None":
        raise ValueError("farmer dict must include an 'id'")

    text = ", ".join(f"{k}: {v}" for k, v in farmer.items() if v and k not in ("id", "_id"))
    if not text:
        text = f"Farmer {farmer_id}, no profile details yet."

    embedding = _embed([text], is_query=False)[0]
    _collection("farmer_profiles").upsert(documents=[text], embeddings=[embedding], ids=[farmer_id])
    return {"status": "ok", "farmer_id": farmer_id}


def upsert_knowledge(collection_name: str, doc_id: str, text: str, metadata: dict | None = None):
    """Generic upsert used by seed_knowledge.py for schemes + agri tips."""
    embedding = _embed([text], is_query=False)[0]
    _collection(collection_name).upsert(
        documents=[text], embeddings=[embedding], ids=[doc_id], metadatas=[metadata or {}]
    )


def retrieve_context(query: str, farmer_id: str | None = None, top_k: int = config.RAG_TOP_K) -> str:
    """
    Pulls the most relevant agri-knowledge chunks (schemes + farming tips)
    plus the requesting farmer's own profile, and returns them as a single
    text block ready to drop into the LLM prompt.
    """
    query_embedding = _embed([query], is_query=True)[0]
    chunks = []

    try:
        knowledge = _collection("agri_knowledge").query(query_embeddings=[query_embedding], n_results=top_k)
        docs = knowledge.get("documents", [[]])[0]
        chunks.extend(docs)
    except Exception:
        pass  # collection may not be seeded yet — degrade gracefully

    if farmer_id:
        try:
            profile = _collection("farmer_profiles").get(ids=[farmer_id])
            docs = profile.get("documents") or []
            if docs:
                chunks.append(f"Farmer profile: {docs[0]}")
        except Exception:
            pass

    return "\n".join(f"- {c}" for c in chunks) if chunks else ""
