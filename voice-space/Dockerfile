# FarmSaathi voice: MMS-TTS and IndicConformer on CPU (served on Modal; the image also runs as a Docker Space).
FROM python:3.11-slim

# Spaces run the container as uid 1000.
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    HF_HOME=/home/user/hf \
    PYTHONUNBUFFERED=1
WORKDIR /home/user/app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user torch==2.14.0 --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir --user -r requirements.txt

COPY --chown=user app.py spoken_numbers.py download_models.py ./
# Bake the three voices (about 145 MB each) and the Hindi and Punjabi speech-to-text models (about
# 480 MB each) into the image, then forbid downloads at runtime.
RUN python download_models.py
ENV HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1

EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
