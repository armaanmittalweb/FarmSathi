import chromadb
from chromadb.config import Settings

chroma_client = chromadb.Client(Settings(
    persist_directory="./chroma_db",  # Save to disk
    anonymized_telemetry=False
))

# Create or get collection
collection = chroma_client.get_or_create_collection(name="farmer_profiles")
print("ChromaDB collection ready.")
