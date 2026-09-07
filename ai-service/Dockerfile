FROM python:3.11-slim

# tesseract-ocr: optional, only needed if you enable Soil Health Card photo
# OCR (see ai-models/README.md); harmless to include, small footprint.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
