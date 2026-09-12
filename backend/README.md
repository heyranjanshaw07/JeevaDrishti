# JeevaDrishti — Backend Architecture (Phases B1 – B5)

Backend API for **JeevaDrishti** (*"Empowering Microscopy with Intelligent Vision"*), supporting intelligent microscopy analysis, research benchmarking, dataset exploration, and adaptive vision-language cell detection.

---

## 1. Overview

- **Phase B1**: Establishes clean, service-oriented FastAPI foundation, CORS, SQLite/SQLAlchemy 2.x abstraction, storage directory configuration, and health endpoints.
- **Phase B2**: Implements secure stateless authentication, bcrypt password hashing, JWT bearer tokens, role-based authorization (`researcher` vs `admin`), and active-user validation.
- **Phase B3**: Implements secure microscopy image upload (PNG, JPG, JPEG) with Pillow validation, safe server-side file management, and microscopy analysis tracking (0, 1, 3, 6 shots across supported datasets).
- **Phase B4**: Implements Dataset Explorer catalog, verified dataset statistics, cell classes, safe image pagination, and Benchmark configuration/summary/results APIs with real evaluation storage (status: `not_evaluated`).
- **Phase B5**: Implements the AI/ML integration engine (SAM object proposals, candidate region extraction, provider-independent VLM classification, in-context few-shot support, canonical alias normalization, overlay rendering, and analysis execution).
- **AI Model Status**: Weights and API key configuration dependent (controlled unavailability errors `AI_MODEL_UNAVAILABLE` and `VLM_NOT_CONFIGURED` returned honestly when unconfigured; never fakes detections).
- **Frontend Status**: FROZEN (preserved without modifications).

---

## 2. Technology Stack

- **Runtime**: Python 3.11+
- **Framework**: FastAPI
- **ASGI Server**: Uvicorn
- **Data Validation & Settings**: Pydantic v2 & `pydantic-settings`
- **ORM & Database**: SQLAlchemy 2.x (SQLite for development, PostgreSQL-ready)
- **Image Processing & Validation**: Pillow (PIL)
- **Multipart Form Data**: `python-multipart`
- **Security & Cryptography**: `bcrypt` (salted password hashing) & `pyjwt` (HS256 JWT tokens)
- **Environment Management**: `python-dotenv`
- **Testing**: `pytest`, `httpx`, & FastAPI `TestClient`

---

## 3. Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI entrypoint, middleware, error handlers
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # Pydantic Settings & environment parsing
│   │   ├── logging.py           # Standardized application logging
│   │   └── security.py          # bcrypt password hashing & JWT encoding/decoding
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # User SQLAlchemy 2.x model
│   │   ├── analysis.py          # UploadedFile and Analysis SQLAlchemy models
│   │   └── benchmark.py         # BenchmarkResult SQLAlchemy model (nullable metrics)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py              # Auth & RBAC dependencies (get_current_user, require_role)
│   │   └── routes/
│   │       ├── __init__.py      # Versioned API router registry
│   │       ├── auth.py          # /api/v1/auth (register, login, me, logout, admin-check)
│   │       ├── analysis.py      # /api/v1/analysis (upload, create, get, list, delete)
│   │       ├── dataset.py       # /api/v1/datasets (catalog, detail, classes, safe images)
│   │       ├── benchmark.py     # /api/v1/benchmark (config, results, summary)
│   │       ├── health.py        # /api/v1/health endpoint
│   │       └── system.py        # /api/v1/system/status endpoint
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py              # Pydantic v2 auth request/response contracts
│   │   ├── analysis.py          # Pydantic v2 analysis & upload schemas
│   │   ├── dataset.py           # Pydantic v2 dataset summary, classes, image metadata schemas
│   │   ├── benchmark.py         # Pydantic v2 benchmark config, results, summary schemas
│   │   └── common.py            # Common API response models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py              # User registration and verification business logic
│   │   ├── storage_service.py   # Secure file upload, Pillow validation, and disk cleanup
│   │   ├── analysis_service.py  # Analysis records, status, pagination, and ownership enforcement
│   │   ├── dataset_service.py   # Dataset catalog, verified metrics, class lists, safe images
│   │   ├── benchmark_service.py # Benchmark configurations, summary, and real result retrieval
│   │   └── inference/           # Phase B5 AI/ML Engine
│   │       ├── __init__.py
│   │       ├── hybrid_engine.py # SAM proposals -> VLM classification orchestrator
│   │       ├── sam_service.py   # Lazy SAM model loading & candidate box proposals
│   │       ├── vlm_service.py   # Provider-independent VLM interface (Gemini/OpenAI/Mock)
│   │       ├── prompt_service.py# Domain prompts, alias normalization & few-shot crops
│   │       └── image_service.py # Preprocessing, patch cropping & overlay rendering
│   └── db/
│       ├── __init__.py
│       ├── base.py              # SQLAlchemy DeclarativeBase
│       └── session.py           # Engine & SessionLocal session dependency
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Isolated in-memory DB and temporary storage fixtures
│   ├── test_analysis.py         # Complete analysis & image upload test suite (14 tests)
│   ├── test_auth.py             # Complete authentication & RBAC test suite (11 tests)
│   ├── test_dataset_benchmark.py# Complete dataset & benchmark test suite (14 tests)
│   ├── test_inference.py        # AI integration, SAM/VLM, and overlay test suite (10 tests)
│   └── test_health.py           # Health and readiness test suite (3 tests)
│
├── uploads/                     # Configured file upload directory (gitignored)
├── .env.example                 # Environment template
├── .gitignore                   # Backend exclusion rules
├── requirements.txt             # Pinned backend dependencies
└── README.md                    # This documentation
```

---

## 4. Installation & Setup

### Windows (PowerShell / Command Prompt)

```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Linux / macOS

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 5. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configuration variables:
```env
APP_NAME=JeevaDrishti API
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true
API_V1_PREFIX=/api/v1
DATABASE_URL=sqlite:///./jeevadrishti.db
CORS_ORIGINS=http://localhost:5173
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=20

# JWT Authentication
JWT_SECRET_KEY=change-me-to-a-secure-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

## 6. Running the Development Server

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Interactive API documentation will be available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI Schema**: [http://127.0.0.1:8000/api/v1/openapi.json](http://127.0.0.1:8000/api/v1/openapi.json)

---

## 7. Microscopy Analysis & Upload Endpoints (Phase B3)

All analysis endpoints require a valid JWT Bearer token:
`Authorization: Bearer <access_token>`

### 7.1 Upload Microscopy Image
- **Method**: `POST /api/v1/analysis/upload`
- **Content-Type**: `multipart/form-data`
- **Supported Formats**: PNG, JPG, JPEG (up to `MAX_UPLOAD_SIZE_MB`)
- **Validation**: Strict Pillow image verification; extracts dimensions and detects corrupted files. Never trusts original client filename.
- **Response** (`201 Created`):
```json
{
  "file_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "filename": "blood_smear_specimen.png",
  "content_type": "image/png",
  "size": 184520,
  "status": "uploaded"
}
```

### 7.2 Initiate Analysis Record
- **Method**: `POST /api/v1/analysis`
- **Supported Datasets**: `Micro-OD`, `BBBC`, `BCCD`, `LIVECell`, `NIH-3T3`
- **Supported Shot Counts**: `0`, `1`, `3`, `6`
- **Request Body**:
```json
{
  "file_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "dataset": "Micro-OD",
  "shots": 3,
  "vlm_model": "default"
}
```
- **Response** (`201 Created`):
```json
{
  "analysis_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "status": "pending",
  "dataset": "Micro-OD",
  "shots": 3
}
```

### 7.3 Get Analysis Status
- **Method**: `GET /api/v1/analysis/{analysis_id}`
- **Security**: Enforces strict user ownership; returns `403 Forbidden` if another user attempts access.
- **Response** (`200 OK`):
```json
{
  "analysis_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "status": "pending",
  "dataset": "Micro-OD",
  "shots": 3,
  "vlm_model": "default",
  "created_at": "2026-09-10T10:15:30Z",
  "completed_at": null
}
```

### 7.4 List User Analysis History
- **Method**: `GET /api/v1/analysis?page=1&page_size=20`
- **Response** (`200 OK`): Returns paginated analysis items sorted newest first.
```json
{
  "items": [
    {
      "analysis_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
      "status": "pending",
      "dataset": "Micro-OD",
      "shots": 3,
      "vlm_model": "default",
      "created_at": "2026-09-10T10:15:30Z",
      "completed_at": null
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 1
}
```

### 7.5 Delete Analysis
- **Method**: `DELETE /api/v1/analysis/{analysis_id}`
- **Security**: Verifies ownership, safely drops database record, and deletes associated physical image from disk.
- **Response** (`200 OK`):
```json
{
  "message": "Analysis and associated file successfully deleted.",
  "analysis_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
}
```

---

## 8. Dataset Explorer APIs (Phase B4)

Provides verified dataset catalog metadata, cellular category classes, and safe paginated image lists.

### Supported Datasets & Verified Statistics
| Dataset | Total Images | Example Split | Test Split | Verified Test Boxes | Classes | Modality | Source Information |
|---|---|---|---|---|---|---|---|
| **Micro-OD** | 252 | 40 | 212 | 5,551 | 10 | Multi-Modal Optical | Aggregated from 4 benchmark sources |
| **BBBC** | 63 | 10 | 53 | 4,000 | 6 | Fluorescence | BBBC041 malaria stage dataset |
| **BCCD** | 63 | 10 | 53 | 952 | 3 | Blood Smear | Peripheral blood smear (RBC, WBC, Platelets) |
| **LIVECell** | 63 | 10 | 53 | 223 | 3 | Phase-Contrast | Phase-contrast live cell imaging (RatC6) |
| **NIH-3T3** | 63 | 10 | 53 | 376 | 3 | Brightfield | Mouse embryonic fibroblast cell line |

*Note: No statistics are invented. All counts match verified ground-truth dataset distributions.*

### 8.1 List Supported Datasets
- **Method**: `GET /api/v1/datasets`
- **Security**: Public read-only
- **Response** (`200 OK`): Array of all 5 supported datasets with verified statistics and modalities.

### 8.2 Get Dataset Detail
- **Method**: `GET /api/v1/datasets/{dataset_name}`
- **Parameters**: `dataset_name` (e.g., `Micro-OD`, `BBBC`, `BCCD`, `LIVECell`, `NIH-3T3`)
- **Response** (`200 OK`):
```json
{
  "id": "Micro-OD",
  "name": "Micro-OD",
  "full_name": "Micro-OD Few-Shot Optical Microscopy Benchmark",
  "description": "Standardized benchmark corpus combining diverse optical microscopy domains for few-shot and zero-shot cell detection evaluation.",
  "modality": "Multi-Modal Optical (Fluorescence, Phase-Contrast, Brightfield)",
  "total_images": 252,
  "example_images": 40,
  "test_images": 212,
  "test_boxes": 5551,
  "classes_count": 10,
  "classes": [
    "Gametocyte Cells", "Platelets", "Polygonal Cells", "Red Blood Cells",
    "Ring Cells", "Round Cells", "Schizont Cells", "Spindle Cells",
    "Trophozoite Cells", "White Blood Cells"
  ],
  "source_information": "Aggregated benchmark corpus combining BBBC, BCCD, LIVECell, and NIH-3T3",
  "source_datasets": ["BBBC", "BCCD", "LIVECell", "NIH-3T3"],
  "source_datasets_count": 4,
  "status": "verified"
}
```

### 8.3 Get Dataset Supported Cell Classes
- **Method**: `GET /api/v1/datasets/{dataset_name}/classes`
- **Response** (`200 OK`):
```json
{
  "dataset": "BCCD",
  "classes": ["Platelets", "Red Blood Cells", "White Blood Cells"],
  "total_classes": 3
}
```

### 8.4 List Dataset Images Metadata (Paginated)
- **Method**: `GET /api/v1/datasets/{dataset_name}/images?split=test&page=1&page_size=20&search=001`
- **Security**: Public read-only. **Never exposes server filesystem paths.**
- **Response** (`200 OK`):
```json
{
  "items": [
    {
      "image_id": "BloodImage_00000.jpg",
      "dataset": "BCCD",
      "split": "test",
      "filename": "BloodImage_00000.jpg",
      "size_bytes": 27263
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 53
}
```

---

## 9. Benchmark & Evaluation APIs (Phase B4)

Provides formal benchmark configuration, execution summary, and stored experiment results.

### Benchmark Parameters
- **Supported Datasets**: `Micro-OD`, `BBBC`, `BCCD`, `LIVECell`, `NIH-3T3`
- **Supported Shot Configurations**: `0`, `1`, `3`, `6`
- **Evaluation Metrics**: `mF1`, `Precision`, `Recall`, `IoU`, `Latency`, `VLM Calls`
- **Current Evaluation Status**: `not_evaluated` (No fake results are ever returned; metrics are null until real evaluation execution).

### 9.1 Get Benchmark Configuration
- **Method**: `GET /api/v1/benchmark/config`
- **Response** (`200 OK`):
```json
{
  "datasets": ["Micro-OD", "BBBC", "BCCD", "LIVECell", "NIH-3T3"],
  "shot_configs": [0, 1, 3, 6],
  "metrics": ["mF1", "Precision", "Recall", "IoU", "Latency", "VLM Calls"]
}
```

### 9.2 Get Benchmark Execution Summary
- **Method**: `GET /api/v1/benchmark/summary`
- **Response** (`200 OK`):
```json
{
  "status": "not_evaluated",
  "datasets": 4,
  "shot_configs": [0, 1, 3, 6]
}
```

### 9.3 Get Stored Benchmark Results
- **Method**: `GET /api/v1/benchmark/results?dataset=Micro-OD&shots=0`
- **Parameters**:
  - `dataset` (optional): Filter by supported dataset name. Returns `400 Bad Request` if unsupported.
  - `shots` (optional): Filter by shot configuration (`0`, `1`, `3`, `6`). Returns `400 Bad Request` if unsupported.
- **Response** (`200 OK` when no experiments evaluated):
```json
{
  "items": [],
  "total": 0,
  "status": "not_evaluated"
}
```

### 9.4 Benchmark Database Storage
- **Model**: `BenchmarkResult`
- **Columns**: `id`, `dataset`, `shots`, `mf1`, `precision`, `recall`, `iou`, `latency`, `vlm_calls`, `created_at`
- **Nullable Constraints**: All metric fields are strictly nullable to store real experiment results upon evaluation without artificial filler values.

---

## 10. AI/ML Integration Engine (Phase B5)

Implements the zero-shot & few-shot hybrid vision-language cell detection framework:

```
Microscopy Image
       ↓
Image Preprocessing & Dimension Validation
       ↓
SAM (Segment Anything Model) Object Proposals (Max Live Candidates: 15)
       ↓
Candidate Patch Cropping & Bilinear Rescaling (128×128)
       ↓
VLM Classification (Gemini / OpenAI / Mock) + In-Context Few-Shot Exemplars (0, 1, 3, 6 shots)
       ↓
Canonical Label Normalization (10 standard categories + alias regex matching)
       ↓
Final Detections [x1, y1, x2, y2, confidence, label]
       ↓
Visual Detection Overlay Rendering (Pillow high-contrast bounding boxes & labels)
```

### 10.1 Canonical Class Taxonomy & Normalization
The engine strictly normalizes cell predictions to canonical labels, rejecting background/non-cellular crops:
- **Red Blood Cells** (aliases: `RBC`, `red blood cell`, `erythrocyte`)
- **White Blood Cells** (aliases: `WBC`, `white blood cell`, `leukocyte`)
- **Platelets** (aliases: `platelet`, `thrombocyte`)
- **Ring Cells** (aliases: `ring`, `ring cell`)
- **Trophozoite Cells** (aliases: `trophozoite`)
- **Gametocyte Cells** (aliases: `gametocyte`)
- **Schizont Cells** (aliases: `schizont`)
- **Spindle Cells** (aliases: `spindle`)
- **Polygonal Cells** (aliases: `polygonal`)
- **Round Cells** (aliases: `round`)

### 10.2 Model Lifecycle & Safety
- **Lazy Loading**: SAM weights are loaded on demand and cached in a singleton service.
- **Controlled Error Reporting**:
  - `AI_MODEL_UNAVAILABLE`: Returned when SAM weights are unconfigured or not found on disk.
  - `VLM_NOT_CONFIGURED`: Returned when VLM provider credentials are missing.
  - Never fabricate fake detections, bounding boxes, or confidence constants.
- **Candidate Throttling**: Live uploads are capped to `MAX_LIVE_CANDIDATES=15` to protect latency.

### 10.3 Execution Endpoints
- `POST /api/v1/analysis/{analysis_id}/run`
  - Triggers synchronous execution of the hybrid pipeline for the specified analysis.
  - Enforces active JWT authentication and strict resource ownership.
  - Transitions analysis state: `pending` → `processing` → `completed` / `failed`.
- `GET /api/v1/analysis/{analysis_id}/results`
  - Returns complete detection bounding boxes, canonical labels, model confidences, processing status, and overlay availability.
- `GET /api/v1/analysis/{analysis_id}/overlay`
  - Serves the generated visual PNG overlay file with rendered boxes and color-coded labels.

---

## 11. Authentication Endpoints (Phase B2)

- `POST /api/v1/auth/register` — Register a new researcher account.
- `POST /api/v1/auth/login` — Authenticate and receive JWT bearer token.
- `GET /api/v1/auth/me` — Retrieve profile details of authenticated user.
- `POST /api/v1/auth/logout` — Stateless logout confirmation.
- `GET /api/v1/auth/admin-check` — Role-based access control verification.

---

## 12. System & Health Endpoints (Phase B1)

- `GET /` — Root API welcome endpoint.
- `GET /api/v1/health` — Operational health check.
- `GET /api/v1/system/status` — Architectural readiness reporting (`ai_engine: "ready"`).

---

## 13. Automated Test Suite

Run all tests:

```powershell
.\venv\Scripts\pytest
```

**Test Coverage Summary**:
- `test_analysis.py`: 14 tests (valid PNG/JPG uploads, invalid extension rejection, corrupted image detection via Pillow, oversized payload rejection, unauthenticated rejection, analysis creation, dataset & shots validation, status retrieval, ownership protection, pagination, record deletion, and disk file cleanup).
- `test_auth.py`: 11 tests (registration, duplicate rejection, login, bad password, non-existent user, missing token, valid token, inactive user restriction, bcrypt verification, role access control, logout).
- `test_dataset_benchmark.py`: 14 tests (list datasets, Micro-OD verified counts, BBBC/BCCD/LIVECell/NIH-3T3 metadata, invalid dataset 404, class lists, safe image pagination without filesystem paths, benchmark config, empty results reporting, benchmark summary, invalid shot 400 validation, and real database model storage with nullable metrics).
- `test_inference.py`: 10 tests (shot validation [0,1,3,6], dataset validation, class alias normalization, prompt generation, image preprocessing & cropping, overlay rendering, missing SAM model handling, missing VLM configuration handling, analysis ownership enforcement, and complete run/results/overlay execution flow).
- `test_health.py`: 3 tests (root, health, system status).
- **Total**: 52/52 tests PASS.

---

## 14. Current Architecture Status (B5 Complete)

- **FastAPI Core**: READY
- **API Versioning**: READY (`/api/v1/`)
- **Authentication & RBAC**: READY (JWT + bcrypt + active checks)
- **Microscopy Upload API**: READY (PNG/JPG/JPEG, max 20MB, Pillow verified)
- **Analysis Model & Workflow**: READY (Micro-OD, BBBC, BCCD, LIVECell, NIH-3T3 / 0, 1, 3, 6 shots)
- **Dataset Catalog & Explorer API**: READY (Micro-OD, BBBC, BCCD, LIVECell, NIH-3T3 verified stats)
- **Benchmark API & Storage**: READY (Config, Summary, Real Results table with nullable metrics)
- **AI/ML Integration Engine**: READY (SAM proposals + VLM classification + few-shot support + overlay rendering)
- **Model Weight Handling**: CONFIGURATION DEPENDENT (Controlled unavailability error when unconfigured)
- **Automated Tests**: 52/52 PASS
- **Frontend**: FROZEN


