# Backend

FastAPI backend for the semantic search app.

## Requirements

- Python 3.11+
- `uv`

## Setup

```bash
cd backend
cp .env.example .env
uv sync
```

Set a real JWT secret in `backend/.env` before starting the app.

```env
JWT_SECRET_KEY=replace-with-a-long-random-secret-at-least-32-characters
```

## Run

Using the lightweight Python entrypoint:

```bash
cd backend
uv run python main.py
```

Direct uvicorn:

```bash
cd backend
uv run uvicorn app.main:app --reload
```

Compatibility script:

```bash
cd backend
./start.sh
```

The API listens on `http://localhost:8000` by default.

For the full local stack from the repo root:

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

For the production-style stack with nginx in front:

```bash
cp backend/.env.example backend/.env
docker compose -f docker-compose.prod.yml up -d --build
```

Create an admin explicitly when needed:

```bash
cd backend
uv run python main.py create-admin --name "Admin" --email admin@example.com --password "change-me-now"
```

## Important Environment Variables

```env
JWT_SECRET_KEY=replace-with-a-long-random-secret-at-least-32-characters
DATABASE_URL=sqlite:///./app.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
EMBEDDINGS_API_KEY=
GITHUB_TOKEN=
```

Notes:

- The default backend-only development path uses SQLite and should start without a separate database server.
- `CORS_ORIGINS` accepts a comma-separated list or a JSON array.
- In Docker development, the frontend is exposed at `http://localhost:3000`.
- Admin creation is explicit through the `create-admin` command.

## Verification

```bash
cd backend
uv run python -m compileall app main.py
uv run python -c "from app.main import app; print(app.title)"
```
