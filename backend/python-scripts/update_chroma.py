import sys
import json

def update_chroma_db(farmer_profile):
    # In real version, vectorize and store in ChromaDB
    print("Updating ChromaDB with:", farmer_profile)

if __name__ == "__main__":
    try:
        farmer_data = json.loads(sys.argv[1])
        update_chroma_db(farmer_data)
        sys.exit(0)
    except Exception as e:
        print("Error:", e)
        sys.exit(1)
