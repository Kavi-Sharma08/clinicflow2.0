FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
# training-only packages (matplotlib/seaborn/tabulate) are not needed to serve
RUN grep -v -E "^(matplotlib|seaborn|tabulate)" requirements.txt > req-serve.txt && pip install --no-cache-dir -r req-serve.txt
COPY app ./app
COPY models ./models
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
