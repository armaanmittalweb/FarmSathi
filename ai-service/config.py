"""
Central configuration for ai-service. Every path/model choice lives here so
swapping a model (e.g. a smaller/larger LLM) never requires touching the
endpoint code. All defaults are open-weight models with no API key and no
usage fee — see ROADMAP.md for the rationale behind each choice.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent

# --- Chat LLM -----------------------------------------------------------
# Any instruction-tuned GGUF model works. Qwen2.5-3B-Instruct is the
# recommended default: small enough for CPU, strong Hindi + English quality.
# Download once (~2GB) with, e.g.:
#   huggingface-cli download Qwen/Qwen2.5-3B-Instruct-GGUF \
#       qwen2.5-3b-instruct-q4_k_m.gguf --local-dir ai-service/models
LLM_MODEL_PATH = os.getenv(
    "LLM_MODEL_PATH", str(BASE_DIR / "models" / "qwen2.5-3b-instruct-q4_k_m.gguf")
)
LLM_HF_REPO = os.getenv("LLM_HF_REPO", "Qwen/Qwen2.5-3B-Instruct-GGUF")
LLM_HF_FILENAME = os.getenv("LLM_HF_FILENAME", "qwen2.5-3b-instruct-q4_k_m.gguf")
LLM_CONTEXT_SIZE = int(os.getenv("LLM_CONTEXT_SIZE", "4096"))
LLM_MAX_NEW_TOKENS = int(os.getenv("LLM_MAX_NEW_TOKENS", "400"))

# --- Embeddings / RAG -----------------------------------------------------
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "intfloat/multilingual-e5-small")
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", str(BASE_DIR / "chroma_db"))
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "3"))

# --- Speech-to-text -------------------------------------------------------
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")  # tiny|base|small|medium
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

# --- Text-to-speech (Meta MMS-TTS, one model per language) ---------------
MMS_TTS_MODELS = {
    "en": "facebook/mms-tts-eng",
    "hi": "facebook/mms-tts-hin",
    "pa": "facebook/mms-tts-pan",
}

# --- Translation fallback (used for Punjabi generation quality) ----------
TRANSLATION_MODEL_NAME = os.getenv("TRANSLATION_MODEL_NAME", "facebook/nllb-200-distilled-600M")
FLORES_LANG_CODES = {"en": "eng_Latn", "hi": "hin_Deva", "pa": "pan_Guru"}
# Languages the base LLM is trusted to generate directly in. Anything else
# is generated in English and machine-translated (see llm.py).
LLM_NATIVE_LANGUAGES = {"en", "hi"}

# --- Vision: crop disease classifier ---------------------------------------
VISION_MODEL_PATH = os.getenv(
    "VISION_MODEL_PATH",
    str(REPO_ROOT / "ai-models" / "Crop_Disease_Prediction_Model" / "Crop_Disease_Prediction_Model.h5"),
)
VISION_CLASS_NAMES_PATH = os.getenv(
    "VISION_CLASS_NAMES_PATH",
    str(REPO_ROOT / "ai-models" / "Crop_Disease_Prediction_Model" / "class_names.json"),
)
VISION_IMG_SIZE = (224, 224)

# --- Tabular: soil/crop recommendation model -------------------------------
CROP_MODEL_PATH = os.getenv(
    "CROP_MODEL_PATH", str(REPO_ROOT / "ai-models" / "crop_recommendation_model.joblib")
)

# --- Curated knowledge seeded into the agri_knowledge collection ----------
SCHEMES_JSON_PATH = os.getenv("SCHEMES_JSON_PATH", str(REPO_ROOT / "backend" / "data" / "schemes.json"))
AGRI_KNOWLEDGE_JSON_PATH = os.getenv(
    "AGRI_KNOWLEDGE_JSON_PATH", str(BASE_DIR / "data" / "agri_knowledge.json")
)
