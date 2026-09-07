"""
Machine-translation fallback used when the base chat LLM is asked to reply
in a language it handles less reliably (Punjabi, currently). Uses
facebook/nllb-200-distilled-600M — open-weight, no key, ~600M params.

Uses the tokenizer/model classes directly rather than the high-level
`pipeline("translation", ...)` helper — that generic task alias was
removed in newer `transformers` releases (hit in practice: transformers
5.16.1 raised `KeyError: "Unknown task translation"`). Loading
AutoModelForSeq2SeqLM directly is the documented NLLB usage pattern and
isn't tied to the pipeline registry's task-name churn.

For higher-quality Indian-language translation specifically, swap this for
AI4Bharat's IndicTrans2 (open-source, purpose-built for Indian languages) —
it needs the extra `IndicTransToolkit` preprocessing package, which is why
NLLB is the lighter-dependency default here.
"""

import threading

import config

_lock = threading.Lock()
_model = None
_tokenizer = None


def _load():
    global _model, _tokenizer
    if _model is None:
        with _lock:
            if _model is None:
                from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

                _tokenizer = AutoTokenizer.from_pretrained(config.TRANSLATION_MODEL_NAME)
                _model = AutoModelForSeq2SeqLM.from_pretrained(config.TRANSLATION_MODEL_NAME)
    return _model, _tokenizer


def translate(text: str, target_lang: str, source_lang: str = "en") -> str:
    src = config.FLORES_LANG_CODES.get(source_lang, "eng_Latn")
    tgt = config.FLORES_LANG_CODES.get(target_lang, "eng_Latn")
    if src == tgt:
        return text

    model, tokenizer = _load()
    tokenizer.src_lang = src
    inputs = tokenizer(text, return_tensors="pt")
    generated = model.generate(
        **inputs,
        forced_bos_token_id=tokenizer.convert_tokens_to_ids(tgt),
        max_length=512,
    )
    return tokenizer.batch_decode(generated, skip_special_tokens=True)[0]
