"""Build step: put the three MMS-TTS voices and the two IndicConformer models into the image, so a
woken container never downloads anything."""
from huggingface_hub import snapshot_download

from app import HEAR_FILES, HEARS, VOICES

for repo in VOICES.values():
    path = snapshot_download(repo, allow_patterns=["*.json", "*.safetensors"])
    print(repo, "->", path)
for repo, rev in HEARS.values():
    path = snapshot_download(repo, revision=rev, allow_patterns=HEAR_FILES)
    print(repo, "->", path)
