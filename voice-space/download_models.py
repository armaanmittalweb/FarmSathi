"""Build step: put the three MMS-TTS voices and the two IndicConformer models into the image, so a
woken container never downloads anything."""
from huggingface_hub import snapshot_download

import os

from app import HEAR_DIR, HEAR_FILES, HEARS, VOICES

for repo in VOICES.values():
    path = snapshot_download(repo, allow_patterns=["*.json", "*.safetensors"])
    print(repo, "->", path)
# Real files in HEAR_DIR/<lang>, not cache symlinks (see HEAR_DIR in app.py).
for lang, (repo, rev) in HEARS.items():
    path = snapshot_download(repo, revision=rev, allow_patterns=HEAR_FILES, local_dir=os.path.join(HEAR_DIR, lang))
    print(repo, "->", path)
