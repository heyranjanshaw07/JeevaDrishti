# JeevaDrishti
> *"Empowering Microscopy with Intelligent Vision"*

JeevaDrishti is a full-stack, research-grade microscopy analysis, cellular intelligence, and benchmarking platform. It integrates a state-of-the-art interactive user interface, high-throughput asynchronous backend, a Segment Anything Model (SAM) object proposal engine, and Vision-Language Models (VLMs) for zero-shot and few-shot cell detection and classification across biomedical datasets.

---

## 1. Project Overview

In biological research, digital pathology, and clinical discovery, identifying, segmenting, and quantifying cells across diverse microscopy modalities is a vital yet demanding task. JeevaDrishti introduces a modern, automated solution bridging cutting-edge foundation models with scientific reproducibility.

- **Hybrid Inference Paradigm**: Pairs class-agnostic candidate segmentation (SAM) with multimodal semantic reasoning (VLMs).
- **Micro-OD Benchmark Engine**: Reproducible evaluation across standard datasets (BBBC, BCCD, LIVECell, NIH-3T3) using Hungarian bipartite matching and macro mF1 calculation.
- **Enterprise-Grade Architecture**: Containerized Docker stack, PostgreSQL migrations with Alembic, stateless JWT authentication, and isolated multi-tenant workspaces.
- **Interactive Visual Lab**: Real-time mask rendering, confidence threshold tuning, morphological metrics inspection, and automated PDF report generation.

---

## 2. Research Problem

Traditional deep learning models for cell detection face fundamental hurdles:
1. **Scarcity of Expert Annotations**: Delineating cell boundaries on dense whole-slide or fluorescence images requires hundreds of pathologist hours.
2. **Domain Shift & Morphology Variance**: Models trained on brightfield blood smears degrade significantly when applied to phase-contrast or fluorescent imaging.
3. **Rigid Closed-Vocabulary Constraints**: Standard object detectors cannot classify novel or rare cell phenotypes without full architectural re-training.

JeevaDrishti addresses these challenges through a generalized, foundation-model-driven approach that eliminates task-specific re-training.

---

## 3. Key Features

- **Automated Cell Segmentation**: High-precision boundary delineation leveraging Meta's SAM architecture.
- **Few-Shot Prompting Engine**: In-context learning supporting 0-shot, 1-shot, 3-shot, and 6-shot exemplar setups.
- **Microscopy Image Validation**: Automatic verification of incoming imagery using spectral analysis, entropy scoring, and aspect checks to reject non-microscopy uploads.
- **Interactive Multi-Tenant Workspace**: Role-based access control (RBAC), private project ownership, and persistent analysis history.
- **Scientific Audit Trails**: Export complete analytical findings, bounding boxes, class confidence scores, and morphological parameters into formatted reports.

---

## 4. Hybrid AI Pipeline

JeevaDrishti combines foundation segmentation with multimodal vision-language understanding in a two-stage inference cascade:

```
┌─────────────────────────┐
│     Microscopy Image    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  SAM / Object Proposals │ (Class-agnostic boundary & candidate proposal generation)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    Candidate Regions    │ (Bounding boxes, cropped RoIs, spatial coordinates)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Vision-Language Model  │ (Gemini / OpenAI zero/few-shot semantic classification)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Cell Classification   │ (Phenotype mapping, confidence scoring, prompt alignment)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    Detection Results    │ (Bipartite matched detections, overlays, metrics)
└─────────────────────────┘
```

1. **Microscopy Image Ingestion**: The raw image is validated, normalized, and preprocessed.
2. **SAM Object Proposal**: Segment Anything Model generates class-agnostic candidate mask regions.
3. **Candidate Region Extraction**: Proposal coordinates are transformed into normalized bounding boxes and localized crops.
4. **Vision-Language Model (VLM)**: Cropped regions and contextual slide metadata are dispatched to multimodal VLMs with structured prompt instructions.
5. **Cell Classification**: The model attributes biological classes and confidence scores to each candidate proposal.
6. **Detection Results**: Final detections are unified with non-maximum suppression (NMS), vectorized, and visualized.

---

## 5. Architecture

```
[ React 18 + Vite SPA ]  <────────>  [ Nginx Reverse Proxy ]
 (Frozen Glassmorphic UI)                     │
                                              ▼
                                   [ FastAPI Backend ]
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              ▼                               ▼                               ▼
     [ PostgreSQL Database ]       [ Storage: uploads/ ]             [ Hybrid AI Engine ]
       (Alembic Migrations)          (PNG/JPG & Overlays)            ├── SAM (ViT-H/ViT-L)
                                                                     └── VLM (Gemini / OpenAI)
```

---

## 6. Zero-Shot / Few-Shot Concept (0, 1, 3, 6-Shot)

JeevaDrishti supports flexible in-context prompting strategies without updating model weights:
- **0-Shot**: Relies purely on textual prompt definitions and natural language biological descriptors.
- **1-Shot**: Supplies one prototypical exemplar per cell class within the prompt context to anchor visual features.
- **3-Shot**: Introduces three representative exemplars per class, capturing minor morphological variations.
- **6-Shot**: Delivers six diverse exemplars encompassing varying staining intensities, sizes, and focal distortions for maximal classification accuracy.

---

## 7. Supported Datasets

The platform is designed to benchmark against diverse standard datasets:
- **BBBC (Broad Bioimage Benchmark Collection)**: Synthetic and real cellular samples, fluorescent nuclei, and yeast assays.
- **BCCD**: Blood Cell Count and Detection dataset comprising red blood cells, white blood cells, and platelets.
- **LIVECell**: Large-scale label-free phase-contrast microscopy dataset containing adherent cell lines.
- **NIH-3T3**: Murine fibroblast cell lines commonly utilized in cell migration and drug toxicity studies.

---

## 8. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Three.js / React Three Fiber.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Uvicorn.
- **Database & Storage**: PostgreSQL (production), SQLite (development), local/cloud object storage.
- **AI & Computer Vision**: Segment Anything Model (SAM), PyTorch, OpenCV, Pillow, Google Gemini API, OpenAI API.
- **DevOps & Tooling**: Docker, Docker Compose, Nginx, pytest.

---

## 9. Project Structure

```
JeevaDrishti/
├── .env.example                # Safe environment variable template
├── .gitignore                  # Production exclusion rules
├── README.md                   # Core documentation
├── DEPLOYMENT.md               # Production deployment runbook
├── docker-compose.yml          # Multi-container orchestration
├── backend/
│   ├── app/
│   │   ├── api/                # API routes & versioning
│   │   ├── core/               # Configuration & security
│   │   ├── db/                 # Database session & models
│   │   ├── models/             # SQLAlchemy schemas
│   │   ├── schemas/            # Pydantic validation schemas
│   │   └── services/           # Business logic, inference, benchmark
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Pytest test suite (97 tests)
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile              # Backend container definition
├── frontend/
│   ├── src/                    # UI source code, components, pages
│   ├── public/                 # Static web assets
│   ├── package.json            # NPM dependencies & scripts
│   ├── vite.config.js          # Vite configuration
│   └── Dockerfile              # Multi-stage frontend build
├── research/                   # Research scripts & experimentation
└── ai/                         # AI pipeline interfaces
```

---

## 10. Local Setup

Ensure prerequisites are installed on your host machine:
- **Node.js**: v20.x or later
- **Python**: v3.11 or later
- **Git**

Clone the repository:
```bash
git clone https://github.com/heyranjanshaw07/JeevaDrishti.git
cd JeevaDrishti
```

---

## 11. Environment Variables

Create `.env` in the backend directory from the template:
```bash
cp .env.example backend/.env
```

Key variables:
- `DATABASE_URL`: Database connection string (`sqlite:///./jeevadrishti.db` for local dev).
- `JWT_SECRET_KEY`: Cryptographic secret for signing tokens.
- `VLM_API_KEY` / `GOOGLE_API_KEY`: API key for Gemini inference.
- `OPENAI_API_KEY`: Optional key for OpenAI VLM inference.
- `SAM_MODEL_PATH`: Local path to downloaded SAM checkpoint.

---

## 12. Backend Setup

```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Run migrations (if using PostgreSQL) or initialize SQLite
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --port 8000
```
The API will be available at `http://127.0.0.1:8000`.

---

## 13. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## 14. AI/ML Setup

1. **SAM Weights Checkpoint**:
   Download the Meta SAM weights (e.g. `sam_vit_h_4b8939.pth` or `sam_vit_l_0b3195.pth`) from the official [Segment Anything repository](https://github.com/facebookresearch/segment-anything).
   Set `SAM_MODEL_PATH` in `backend/.env` to the absolute file path of the downloaded weights.
2. **VLM Keys**:
   Acquire an API key from Google AI Studio (Gemini) or OpenAI and assign it to `GOOGLE_API_KEY` or `OPENAI_API_KEY`.

---

## 15. Dataset Setup

Micro-OD and evaluation benchmarks are kept external to keep the codebase lean:
1. Download standard benchmark datasets (such as BCCD, LIVECell, or BBBC).
2. Place them into a local `datasets/` folder or configure `MICRO_OD_PATH` in `backend/.env`.
3. The benchmark loader reads image pairs and associated annotation `.jsonl` files dynamically.

---

## 16. Running the Application

For a complete local execution:
1. Start the FastAPI backend on port 8000.
2. Start the Vite frontend on port 5173.
3. Open `http://localhost:5173` in your browser.
4. Register an account or log in, upload a microscopy image, select detection classes, and trigger automated analysis.

Alternatively, launch via Docker Compose:
```bash
docker compose up -d --build
```

---

## 17. Testing

Run the comprehensive backend test suite:
```bash
cd backend
python -m pytest
```
*Current test suite: 97 passed tests covering unit validation, image verification, benchmark logic, and end-to-end pipelines.*

Verify the frontend build:
```bash
cd frontend
npm run build
```

---

## 18. Benchmarking

JeevaDrishti provides a dedicated benchmark execution service:
- Evaluates candidate proposals against ground-truth bounding boxes.
- Computes Intersection-over-Union (IoU) matrices.
- Solves optimal bipartite matching via Hungarian algorithm.
- Outputs precision, recall, and macro mF1 across zero-shot and few-shot splits.

---

## 19. API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health status |
| `POST` | `/api/v1/auth/register` | Register new user account |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT token |
| `POST` | `/api/v1/analysis/upload` | Upload microscopy image for validation |
| `POST` | `/api/v1/analysis/detect` | Execute hybrid SAM + VLM inference |
| `GET` | `/api/v1/analysis/{id}` | Fetch analysis results and overlays |
| `POST` | `/api/v1/benchmark/run` | Trigger evaluation on selected benchmark dataset |
| `GET` | `/docs` | Interactive OpenAPI / Swagger UI |

---

## 20. Research Disclaimer

> **IMPORTANT**: JeevaDrishti is developed strictly as a research and decision-support exploration platform. It is **NOT** a certified medical device and is **NOT** intended for clinical diagnosis, patient management, or treatment decisions. All algorithmic outputs should be critically evaluated by qualified researchers and professionals.

---

## 21. Future Scope

- **Active Learning Loops**: Enabling human-in-the-loop refinement where pathologists can correct masks to update few-shot prompt libraries in real time.
- **Whole Slide Imaging (WSI)**: Gigapixel pyramid tiling support for large tissue section analysis.
- **Edge Deployment**: Quantized SAM (MobileSAM / FastSAM) inference for point-of-care mobile microscopes.
- **3D Confocal Volumetric Reconstruction**: Multi-z-stack segmentation and cellular morphology analysis.
