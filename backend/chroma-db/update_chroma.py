import sys
import json
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

model = SentenceTransformer("all-MiniLM-L6-v2")

chroma_client = chromadb.Client(Settings(
    persist_directory="./chroma_db",
    anonymized_telemetry=False
))
collection = chroma_client.get_or_create_collection("farmer_profiles")

def generate_embedding(farmer_dict):
    text = ", ".join([f"{k}: {v}" for k, v in farmer_dict.items() if v])
    embedding = model.encode(text)
    return embedding, text

if __name__ == "__main__":
    try:
        farmer = json.loads(sys.argv[1])
        farmer_id = farmer["id"]

        embedding, raw_text = generate_embedding(farmer)

        collection.add(
            documents=[raw_text],
            embeddings=[embedding],
            ids=[farmer_id]
        )

        print("Farmer added to ChromaDB.")
        sys.exit(0)

    except Exception as e:
        print("Error:", e)
        sys.exit(1)
