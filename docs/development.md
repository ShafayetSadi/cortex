# Development Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Database and Migrations](#database-and-migrations)
- [API Overview](#api-overview)
- [RAG Pipeline](#rag-pipeline)
- [Common Development Tasks](#common-development-tasks)
- [Docker Deployment](#docker-deployment)

---

## Prerequisites

| Tool                             | Version | Purpose                  |
| -------------------------------- | ------- | ------------------------ |
| Python                           | 3.14+   | Backend runtime          |
| [uv](https://docs.astral.sh/uv/) | latest  | Python package manager   |
| Node.js                          | 22+     | Frontend build toolchain |
| npm                              | 10+     | Frontend package manager |
| PostgreSQL                       | 15+     | Database (or Docker)     |

---

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic settings — reads from .env
│   │   │   ├── database.py      # SQLAlchemy engine & session
│   │   │   ├── embeddings.py    # Embedding API client
│   │   │   ├── html_sanitizer.py
│   │   │   ├── pdf.py           # PDF text extraction
│   │   │   ├── rag.py           # LLM answer generation
│   │   │   └── security.py      # JWT creation & password hashing
│   │   ├── models/
│   │   │   ├── user.py          # User SQLAlchemy model
│   │   │   └── document.py      # Document SQLAlchemy model
│   │   ├── routers/
│   │   │   ├── auth.py          # POST /api/auth/login, /register
│   │   │   ├── documents.py     # Document CRUD + public Q&A
│   │   │   └── users.py         # User management (admin)
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── deps.py              # FastAPI dependencies (auth guards)
│   │   └── main.py              # App factory, middleware, lifespan
│   ├── alembic/
│   │   ├── env.py               # Alembic config — pulls DATABASE_URL from settings
│   │   └── versions/            # Migration files
│   ├── main.py                  # Entry point: `serve` and `create-admin` commands
│   ├── pyproject.toml
│   └── .env                     # Local secrets (not committed)
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Axios instance with JWT interceptor
│   │   ├── context/             # React contexts: Auth, Toast, Theme
│   │   ├── pages/               # Route-level components
│   │   ├── components/          # Shared UI components
│   │   └── layout/              # Header, Sidebar, Footer, Layout
│   ├── nginx.conf               # Used in Docker: serves SPA + proxies /api
│   └── Dockerfile
├── docker-compose.yml         # Development stack: db + backend + frontend
├── docker-compose.prod.yml    # Production stack: nginx + db + backend + frontend
└── docs/
```

---

## Local Setup

### Backend

```bash
cd backend
cp .env.example .env      # fill in required values (see Environment Variables below)
uv sync                   # installs dependencies into .venv
uv run python main.py     # starts the server on http://localhost:8000
```

Migrations run automatically on startup via the FastAPI lifespan hook. The
interactive API docs are available at `http://localhost:8000/docs`.

**Create the first admin user:**

```bash
uv run python main.py create-admin \
  --name "Admin" \
  --email admin@example.com \
  --password yourpassword
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # starts Vite dev server on http://localhost:5173
```

Create a `.env.local` in `frontend/` to point at the local backend:

```env
VITE_API_URL=http://localhost:8000
```

---

## Environment Variables

All backend settings live in `backend/.env`. The full reference:

### Required

| Variable            | Description                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `JWT_SECRET_KEY`    | Secret used to sign JWTs. Must be at least 32 characters. Generate with `openssl rand -hex 32`. |
| `DATABASE_URL`      | Defaults to `sqlite:///./app.db` for backend-only development. Use a PostgreSQL URL when running against Postgres. |
| `POSTGRES_PASSWORD` | Password for the `db` service in Docker Compose. Must match the password in the Docker/Postgres `DATABASE_URL`. |

### AI / RAG Pipeline

| Variable              | Default                                 | Description                                                                             |
| --------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| `EMBEDDINGS_API_KEY`  | —                                       | API key for the embeddings provider. Also accepted as `GITHUB_TOKEN` for GitHub Models. |
| `EMBEDDINGS_MODEL`    | `text-embedding-3-small`                | Model used to embed document text and questions.                                        |
| `EMBEDDINGS_BASE_URL` | `https://models.inference.ai.azure.com` | Base URL for the embeddings API (OpenAI-compatible).                                    |
| `SUMMARY_MODEL`       | `gpt-4o-mini`                           | Model used to generate answers from retrieved context.                                  |
| `LLM_BASE_URL`        | `https://api.openai.com/v1`             | Base URL for the chat completions API (OpenAI-compatible).                              |

The pipeline accepts any OpenAI-compatible API. To use a local model via Ollama, set:

```env
LLM_BASE_URL=http://localhost:11434/v1
EMBEDDINGS_BASE_URL=http://localhost:11434/v1
EMBEDDINGS_API_KEY=ollama
```

### Optional

| Variable                      | Default                     | Description                                                                                           |
| ----------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60`                        | JWT lifetime in minutes.                                                                              |
| `CORS_ORIGINS`                | `http://localhost:5173,...` | Comma-separated list of allowed frontend origins. Not needed when using the Docker nginx proxy setup. |
| `GITHUB_TOKEN`                | —                           | Alternative to `EMBEDDINGS_API_KEY` when using GitHub Models.                                         |

---

## Database and Migrations

### How migrations work

Alembic migrations run automatically every time the backend starts (`run_migrations()` in `main.py`). The `alembic/env.py` reads `DATABASE_URL` from app settings — there is no hard-coded URL in `alembic.ini`.

### Creating a new migration

After changing a model in `app/models/`, generate a migration:

```bash
cd backend
uv run alembic revision --autogenerate -m "describe your change"
```

Review the generated file in `alembic/versions/` before committing — autogenerate is not always perfect (it misses check constraints, custom indexes, etc.).

### Running migrations manually

```bash
uv run alembic upgrade head      # apply all pending migrations
uv run alembic downgrade -1      # roll back the last migration
uv run alembic current           # show the current revision
uv run alembic history           # list all revisions
```

### Adding a new model

1. Create `app/models/your_model.py` and define the SQLAlchemy class extending `Base`.
2. Import it in `app/models/__init__.py` so Alembic's `env.py` picks it up for autogenerate.
3. Run `uv run alembic revision --autogenerate -m "add your_model"`.

---

## API Overview

### Authentication

The API uses Bearer token authentication. Include the token in every authenticated request:

```text
Authorization: Bearer <token>
```

Tokens are obtained from `POST /api/auth/login` or `POST /api/auth/register` and expire after `ACCESS_TOKEN_EXPIRE_MINUTES` minutes.

### Role system

Two roles exist: `admin` and `user`. Enforced via FastAPI dependencies in `app/deps.py`:

| Dependency         | Effect                                          |
| ------------------ | ----------------------------------------------- |
| `get_current_user` | Requires a valid JWT; returns the `User` object |
| `require_admin`    | Requires a valid JWT with `role == "admin"`     |

### Endpoint reference

**Auth** — public

| Method | Path                 | Description                    |
| ------ | -------------------- | ------------------------------ |
| `POST` | `/api/auth/register` | Create an account, returns JWT |
| `POST` | `/api/auth/login`    | Sign in, returns JWT           |

**Users** — admin only (except `/me`)

| Method   | Path              | Description                                 |
| -------- | ----------------- | ------------------------------------------- |
| `GET`    | `/api/users/me`   | Current user's profile                      |
| `GET`    | `/api/users/`     | List all users                              |
| `POST`   | `/api/users/`     | Create a user                               |
| `PUT`    | `/api/users/{id}` | Update a user (name, email, role, password) |
| `DELETE` | `/api/users/{id}` | Delete a user (cannot delete yourself)      |

**Documents** — authenticated

| Method   | Path                  | Description                                   |
| -------- | --------------------- | --------------------------------------------- |
| `GET`    | `/api/documents/`     | List documents (all for admin, own for users) |
| `POST`   | `/api/documents/`     | Upload a PDF document                         |
| `PUT`    | `/api/documents/{id}` | Update title or replace PDF                   |
| `DELETE` | `/api/documents/{id}` | Delete a document                             |

**Public** — no auth required

| Method | Path                         | Description                               |
| ------ | ---------------------------- | ----------------------------------------- |
| `GET`  | `/api/public/documents/`     | List all documents with author info       |
| `GET`  | `/api/public/documents/{id}` | Get a single document                     |
| `POST` | `/api/public/ask`            | Ask a question against the knowledge base |

### Adding a new router

1. Create `app/routers/your_router.py` with an `APIRouter`.
2. Register it in `app/main.py`:
   ```python
   from app.routers import your_router
   app.include_router(your_router.router)
   ```

---

## RAG Pipeline

The question-answering flow in `POST /api/public/ask`:

```text
1. Embed the question        → app/core/embeddings.py → generate_embedding()
2. Load all documents with embeddings from the database
3. Score each document       → cosine similarity (computed in Python)
4. Filter by threshold       → default 0.3, configurable per request
5. Take top_k documents      → default 5
6. Pass to LLM               → app/core/rag.py → answer_question()
7. Return answer + sources
```

`AskRequest` parameters:

| Field       | Default  | Description                                           |
| ----------- | -------- | ----------------------------------------------------- |
| `question`  | required | The question to answer                                |
| `threshold` | `0.3`    | Minimum cosine similarity score to include a document |
| `top_k`     | `5`      | Maximum number of documents to pass as context        |

Documents without an embedding (e.g. when `EMBEDDINGS_API_KEY` was not set at upload time) are silently skipped during retrieval.

---

## Common Development Tasks

**Reset the database:**

```bash
cd backend
uv run alembic downgrade base   # drops all tables
uv run alembic upgrade head     # recreates them
```

**Regenerate the lockfile after changing dependencies:**

```bash
cd backend
uv sync
```

**Rebuild the frontend for production:**

```bash
cd frontend
npm run build    # output goes to dist/
npm run preview  # preview the production build locally
```

**Check backend health:**

```bash
curl http://localhost:8000/health
# {"status":"ok","database":"ok"}
```

---

## Docker Deployment

Use the default compose file for development. It starts PostgreSQL, the FastAPI
backend, and the Vite frontend with live-reload-friendly settings.

```bash
# 1. Configure the environment
cp backend/.env.example backend/.env
# Edit backend/.env — set JWT_SECRET_KEY, POSTGRES_PASSWORD, and your AI API keys

# 2. Build and start
docker compose up --build

# 3. Create the first admin
docker compose exec backend uv run python main.py create-admin \
  --name "Admin" --email admin@example.com --password yourpassword
```

The frontend will be available at `http://localhost:3000` and the backend at
`http://localhost:8000`.

For a production-style local smoke test with nginx in front:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

That flow serves the application at `http://localhost`.

### Service layout

```
Browser → nginx (port 80)
             ├── /api/*    → backend:8000  (proxied, no CORS needed)
             ├── /health   → backend:8000
             └── /*        → React SPA (static files)
```

The backend is not exposed to the host — only nginx is. PostgreSQL data persists in the `db_data` Docker volume.

### Useful Docker commands

```bash
docker compose logs -f backend          # stream backend logs
docker compose exec backend uv run alembic current   # check migration state
docker compose restart backend          # restart after a code change
docker compose down -v                  # stop and delete all data (destructive)
```
