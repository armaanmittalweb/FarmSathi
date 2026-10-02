"""Serves the voice on Modal: the image CI publishes to GHCR, scaled to zero when idle.

    modal secret create farmsaathi-voice VOICE_KEY=<the Worker's VOICE_KEY>
    VOICE_IMAGE_TAG=<commit sha> modal deploy voice-space/modal_app.py

The tag defaults to `latest`, which Modal caches: pass the commit CI built, or a redeploy can keep
serving the previous image.

The Worker answers 503 {fallback: 'device'} while a container starts, so a cold start costs the
listener nothing but the server voice on that first answer.
"""

import os

import modal

image = modal.Image.from_registry(f"ghcr.io/armaanmittalweb/farmsaathi-voice:{os.environ.get('VOICE_IMAGE_TAG', 'latest')}").env(
    {"HF_HOME": "/home/user/hf", "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1", "PYTHONUNBUFFERED": "1"}
)
app = modal.App("farmsaathi-voice")


@app.function(image=image, cpu=2.0, memory=6144, max_containers=1, scaledown_window=180, timeout=120,
              secrets=[modal.Secret.from_name("farmsaathi-voice")])
@modal.concurrent(max_inputs=4)
@modal.asgi_app(label="farmsaathi-voice")
def web():
    import sys

    sys.path.insert(0, "/home/user/app")
    from app import create_app

    return create_app()
