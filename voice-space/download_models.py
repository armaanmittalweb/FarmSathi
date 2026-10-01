"""Build step: put the three MMS-TTS voices into the image, so a woken Space never downloads them."""
from huggingface_hub import snapshot_download

from app import VOICES

for repo in VOICES.values():
    path = snapshot_download(repo, allow_patterns=["*.json", "*.safetensors"])
    print(repo, "->", path)
