# ai-service

A persistent FastAPI process that loads every open-weight model once and
serves the chat/RAG, speech, vision, and crop-recommendation endpoints the
Node backend calls. See [../ROADMAP.md](../ROADMAP.md) for the full
architecture rationale.

## Setup

Requires **Python 3.10+** (the codebase uses `X | None` union type hints).

```bash
cd ai-service
python -m venv venv
# Windows: venv\Scripts\activate    macOS/Linux: source venv/bin/activate

# CPU-only PyTorch first (much smaller download than the CUDA default):
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

`pytesseract` additionally needs the Tesseract OCR binary on your PATH if
you plan to use it (not required for the core soil/crop endpoint, which
takes typed values — see analyze-soil below).

**If `llama-cpp-python` tries to compile from source and fails** (no C++
compiler available): install it from the maintainer's prebuilt-wheel index
first, then re-run `pip install -r requirements.txt` (confirmed working —
this is how it was actually installed for this project):
```bash
pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
```

## Get the models

- **LLM**: auto-downloads on first `/chat` call (cached under
  `ai-service/models/`). To pre-fetch it manually instead:
  ```bash
  huggingface-cli download Qwen/Qwen2.5-3B-Instruct-GGUF \
      qwen2.5-3b-instruct-q4_k_m.gguf --local-dir ai-service/models
  ```
- **Embeddings / STT / TTS / translation**: auto-download from Hugging Face
  on first use via `transformers`/`sentence-transformers` (cached in the
  usual `~/.cache/huggingface` directory).
- **Vision (crop disease) + crop-recommendation models**: already trained
  and committed to the repo (`../ai-models/`) — nothing to do here. (If you
  ever retrain them yourself, every endpoint that needs a model returns a
  clear HTTP 503 with instructions if the trained file isn't there,
  instead of crashing the whole service.)

**If a download seems stuck at 0 bytes**: Hugging Face's newer "Xet"
transfer protocol can hang in some network environments (confirmed hit
this — a 2GB download sat at 0 bytes for minutes, plain HTTPS was fine at
~2MB/s once Xet was disabled). Fix:
```bash
export HF_HUB_DISABLE_XET=1        # Windows PowerShell: $env:HF_HUB_DISABLE_XET = "1"
```
before starting `uvicorn`.

## Seed the RAG knowledge base (once, after installing deps)

```bash
python seed_knowledge.py
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

Interactive API docs: http://localhost:8001/docs

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness check |
| POST | `/chat` | RAG-grounded LLM reply |
| POST | `/transcribe` | speech-to-text (multipart `audio`) |
| POST | `/speak` | text-to-speech, returns `audio/wav` bytes |
| POST | `/analyze-plant` | crop disease classification (multipart `image`) |
| POST | `/analyze-soil` | crop recommendation from N/P/K/temp/humidity/pH/rainfall |
| POST | `/rag/farmer` | upsert a farmer profile embedding |

## Notes on hardware

Everything here runs on CPU. Expect the LLM to be the slowest step
(a few seconds per reply on a modern laptop CPU at this model size); a GPU
is not required but will speed up the LLM and Whisper substantially if you
have one (install the CUDA build of `torch` and pass `n_gpu_layers` to the
`Llama(...)` call in `llm.py`).
