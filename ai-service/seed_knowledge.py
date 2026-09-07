"""
One-time (re-runnable) script that embeds the curated government-schemes
dataset and general farming knowledge into the `agri_knowledge` ChromaDB
collection, so the chatbot's RAG layer (rag.py) can ground answers in them.

Usage:
    cd ai-service
    python seed_knowledge.py
"""

import json

import config
import rag


def seed_schemes():
    with open(config.SCHEMES_JSON_PATH, encoding="utf-8") as f:
        schemes = json.load(f)

    for scheme in schemes:
        text = (
            f"{scheme['name']['en']}: {scheme['summary']['en']} "
            f"Eligibility: {scheme['eligibility']} How to apply: {scheme['how_to_apply']}"
        )
        rag.upsert_knowledge(
            "agri_knowledge", doc_id=f"scheme-{scheme['id']}", text=text,
            metadata={"type": "scheme", "category": scheme["category"]},
        )
    print(f"Seeded {len(schemes)} government schemes.")


def seed_agri_knowledge():
    with open(config.AGRI_KNOWLEDGE_JSON_PATH, encoding="utf-8") as f:
        docs = json.load(f)

    for doc in docs:
        rag.upsert_knowledge(
            "agri_knowledge", doc_id=doc["id"], text=doc["text"], metadata={"type": "tip"}
        )
    print(f"Seeded {len(docs)} general farming knowledge entries.")


if __name__ == "__main__":
    seed_schemes()
    seed_agri_knowledge()
    print("Done. The chatbot can now ground answers in this knowledge base.")
