"""
Local chat LLM (Qwen2.5-3B-Instruct GGUF via llama-cpp-python) + a thin
RAG-grounded prompt template. Replaces chatbot.py's previous stub
(`process_with_rag` that just concatenated strings).
"""

import os
import threading

import config
import rag
import translate

_lock = threading.Lock()
_llm = None

LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "pa": "Punjabi"}

SYSTEM_PROMPT = (
    "You are FarmSaathi, a helpful assistant for Indian farmers. Answer "
    "clearly and practically, using the provided context when relevant. "
    "If you don't know something, say so honestly instead of guessing. "
    "Keep answers concise (a few short paragraphs at most) and avoid "
    "generic disclaimers."
)


def _ensure_model_file():
    if os.path.exists(config.LLM_MODEL_PATH):
        return
    os.makedirs(os.path.dirname(config.LLM_MODEL_PATH), exist_ok=True)
    try:
        from huggingface_hub import hf_hub_download

        downloaded = hf_hub_download(
            repo_id=config.LLM_HF_REPO,
            filename=config.LLM_HF_FILENAME,
            local_dir=os.path.dirname(config.LLM_MODEL_PATH),
        )
        if downloaded != config.LLM_MODEL_PATH:
            os.replace(downloaded, config.LLM_MODEL_PATH)
    except Exception as exc:  # pragma: no cover - network dependent
        raise RuntimeError(
            f"LLM weights not found at {config.LLM_MODEL_PATH} and automatic "
            f"download failed ({exc}). Download manually, e.g.:\n"
            f"  huggingface-cli download {config.LLM_HF_REPO} {config.LLM_HF_FILENAME} "
            f"--local-dir {os.path.dirname(config.LLM_MODEL_PATH)}"
        ) from exc


def get_llm():
    global _llm
    if _llm is None:
        with _lock:
            if _llm is None:
                _ensure_model_file()
                from llama_cpp import Llama

                _llm = Llama(
                    model_path=config.LLM_MODEL_PATH,
                    n_ctx=config.LLM_CONTEXT_SIZE,
                    n_threads=os.cpu_count(),
                    verbose=False,
                )
    return _llm


def generate_reply(message: str, language: str = "en", farmer_id: str | None = None,
                    farmer_profile_text: str | None = None) -> str:
    context = rag.retrieve_context(message, farmer_id=farmer_id)

    lang_name = LANGUAGE_NAMES.get(language, "English")
    # Qwen2.5 handles English/Hindi generation directly at good quality;
    # for languages outside that set, generate in English and machine
    # translate — more reliable than asking a 3B model to write fluent
    # Punjabi from scratch.
    generate_in = language if language in config.LLM_NATIVE_LANGUAGES else "en"
    generate_lang_name = LANGUAGE_NAMES.get(generate_in, "English")

    user_parts = []
    if farmer_profile_text:
        user_parts.append(f"Farmer profile: {farmer_profile_text}")
    if context:
        user_parts.append(f"Relevant knowledge:\n{context}")
    user_parts.append(f"Question ({generate_lang_name}): {message}")
    user_content = "\n\n".join(user_parts)

    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT} Respond in {generate_lang_name}."},
        {"role": "user", "content": user_content},
    ]

    llm = get_llm()
    completion = llm.create_chat_completion(
        messages=messages,
        max_tokens=config.LLM_MAX_NEW_TOKENS,
        temperature=0.4,
    )
    reply = completion["choices"][0]["message"]["content"].strip()

    if generate_in != language:
        reply = translate.translate(reply, target_lang=language, source_lang=generate_in)

    return reply
