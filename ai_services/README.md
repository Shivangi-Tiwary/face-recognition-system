# AI Services (Face Recognition)

This folder contains a FastAPI service that extracts face embeddings using DeepFace.

Install dependencies:

```powershell
python -m pip install -r requirements.txt
```

Start the service (development):

```powershell
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend expects this service on `http://localhost:8000` with endpoints:
- `POST /extract-embedding` (body: `{ image: <base64 data>, user_id?: <id> }`)
- `POST /compare-embeddings` (body: `{ image: <base64 data>, stored_embeddings: { userId: [numbers], ... } }`)
- `GET /health`
