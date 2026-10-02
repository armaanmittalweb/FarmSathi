"""Serves the voice on Modal: the image CI publishes to GHCR, scaled to zero when idle.

    modal secret create farmsaathi-voice VOICE_KEY=<the Worker's VOICE_KEY>
    modal deploy voice-space/modal_app.py

The Worker answers 503 {fallback: 'device'} while a container starts, so a cold start costs the
listener nothing but the server voice on that first answer.
"""

import modal

image = modal.Image.from_registry("ghcr.io/armaanmittalweb/farmsaathi-voice:latest").env(
    {"HF_HOME": "/home/user/hf", "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1", "PYTHONUNBUFFERED": "1"}
)
app = modal.App("farmsaathi-voice")


@app.function(image=image, cpu=2.0, memory=4096, max_containers=1, scaledown_window=180, timeout=120,
              secrets=[modal.Secret.from_name("farmsaathi-voice")])
@modal.concurrent(max_inputs=4)
@modal.asgi_app(label="farmsaathi-voice")
def web():
    import sys

    sys.path.insert(0, "/home/user/app")
    from app import create_app

    return create_app()
