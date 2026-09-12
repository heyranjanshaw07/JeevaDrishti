# JeevaDrishti — Production Deployment Runbook

This document provides a comprehensive operational guide for deploying JeevaDrishti into production environments (bare-metal VPS, containerized Docker, or managed cloud infrastructure).

---

## 1. System Architecture

```
                                  [ Internet / Users ]
                                            │
                                            ▼
                           [ Nginx Reverse Proxy (Port 80/443) ]
                                ├── SSL/TLS Termination
                                ├── Gzip Compression & Security Headers
                                ├── Static File Serving (React SPA)
                                └── /api/ Proxy Pass
                                            │
                        ┌───────────────────┴───────────────────┐
                        │                                       │
                        ▼                                       ▼
            [ FastAPI Production Server ]           [ Static Storage ]
              (Uvicorn Multi-Worker)                  (uploads/ directory)
                        │                                       ▲
                        ├───────────────────────────────────────┘
                        ▼
            [ PostgreSQL Database (16+) ]
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
  [ SAM Model Weights ]      [ Vision-Language Models ]
    (Local Checkpoint)         (Gemini / OpenAI API)
```

---

## 2. Prerequisites

### Software Requirements
- **Operating System**: Linux (Ubuntu 22.04 LTS / Debian 12 recommended) or Windows Server
- **Python**: 3.11+
- **Node.js**: 20+ LTS & npm
- **Database**: PostgreSQL 15+ (or SQLite for evaluation/demo instances)
- **Web Server**: Nginx (for bare-metal setups) or Docker & Docker Compose

### Hardware Sizing
- **Minimal (API & Remote VLM only)**: 2 vCPU, 4 GB RAM, 20 GB SSD.
- **Recommended (Local SAM ViT-H Inference)**: 8 vCPU (or 1 NVIDIA GPU with 16GB+ VRAM), 16 GB RAM, 50 GB SSD.

---

## 3. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `ENVIRONMENT` | string | `production` | Deployment mode (`production` or `development`). |
| `DEBUG` | boolean | `false` | Disable in production to prevent stack trace leaks. |
| `LOG_LEVEL` | string | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `API_V1_PREFIX` | string | `/api/v1` | API version routing prefix. |
| `DATABASE_URL` | string | `postgresql://...` | Connection URI for PostgreSQL (or SQLite). |
| `CORS_ORIGINS` | string | — | Comma-separated list of allowed frontend origins (no `*` in prod). |
| `UPLOAD_DIR` | string | `uploads` | Directory for uploaded microscopy images and overlays. |
| `MAX_UPLOAD_SIZE_MB` | integer | `20` | Maximum allowable upload file size. |
| `JWT_SECRET_KEY` | string | — | Cryptographically random secret key (minimum 32 bytes). |
| `JWT_ALGORITHM` | string | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | integer | `60` | JWT validity duration in minutes. |
| `SAM_MODEL_PATH` | string | — | Path to SAM checkpoint (`sam_vit_h_4b8939.pth`). |
| `SAM_MODEL_TYPE` | string | `vit_h` | SAM architecture variant (`vit_h`, `vit_l`, `vit_b`). |
| `MAX_LIVE_CANDIDATES` | integer | `15` | Maximum proposals classified in interactive mode. |
| `VLM_PROVIDER` | string | `gemini` | Vision-language provider (`gemini` or `openai`). |
| `VLM_MODEL` | string | `gemini-2.5-flash` | VLM model identifier. |
| `VLM_API_KEY` | string | — | API key for the chosen VLM provider. |
| `GOOGLE_API_KEY` | string | — | Google Gemini API key (fallback for VLM_API_KEY). |
| `MICRO_OD_PATH` | string | — | Path to Micro-OD dataset root (for B7 benchmarking). |
| `MAX_BENCHMARK_CANDIDATES`| integer | `200` | Uncapped proposals for benchmark evaluations. |
| `BENCHMARK_IOU_THRESHOLD` | float | `0.50` | Standard IoU matching threshold (COCO AP@0.50). |

### Frontend (`frontend/.env.production`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | API root relative to reverse proxy domain. |

---

## 4. Option A: Docker Compose Deployment (Recommended)

Docker Compose provides a reproducible, containerized production deployment with PostgreSQL, Uvicorn, and Nginx.

### 1. Clone & Prepare Environment
```bash
git clone https://github.com/YourOrg/JeevaDrishti.git
cd JeevaDrishti

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your production secrets (JWT_SECRET_KEY, VLM_API_KEY, etc.)
```

### 2. Download SAM Weights (Optional for live SAM inference)
```bash
mkdir -p models
wget -O models/sam_vit_h_4b8939.pth https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth
```

### 3. Launch Services
```bash
docker compose up -d --build
```

### 4. Apply Database Migrations
```bash
docker compose exec backend alembic upgrade head
```

### 5. Verify Running Containers
```bash
docker compose ps
curl http://localhost/api/v1/health
```

---

## 5. Option B: Bare-Metal / Standalone VPS Deployment

### 1. Backend Setup
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Production execution via Systemd service
sudo nano /etc/systemd/system/jeevadrishti-backend.service
```

Example Systemd Unit:
```ini
[Unit]
Description=JeevaDrishti FastAPI Backend
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/JeevaDrishti/backend
EnvironmentFile=/var/www/JeevaDrishti/backend/.env
ExecStart=/var/www/JeevaDrishti/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now jeevadrishti-backend
```

### 2. Frontend Setup
```bash
cd frontend
npm ci
npm run build

# Copy build artifacts to web server directory
sudo mkdir -p /var/www/jeevadrishti-frontend
sudo cp -r dist/* /var/www/jeevadrishti-frontend/
```

### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name microscopy.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name microscopy.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/microscopy.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/microscopy.yourdomain.com/privkey.pem;

    client_max_body_size 25M;

    # Frontend Single Page App
    location / {
        root /var/www/jeevadrishti-frontend;
        try_files $uri $uri/ /index.html;
    }

    # API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. Health Checks & Verification

Verify the deployment using the built-in operational endpoints:

### Health Check:
```bash
curl -X GET http://localhost/api/v1/health
```
**Response:**
```json
{
  "status": "healthy",
  "service": "jeevadrishti-backend",
  "version": "1.0.0"
}
```

### System Status:
```bash
curl -X GET http://localhost/api/v1/system/status
```

---

## 7. Security Best Practices

1. **Secrets**: Never commit `.env` or API keys. Always use host environment variables or a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault).
2. **JWT Secret**: Generate a cryptographically strong key via `python -c "import secrets; print(secrets.token_hex(32))"`.
3. **CORS Restrictions**: Explicitly list production domain origins in `CORS_ORIGINS`. Do not use wildcard `*` with `allow_credentials=True`.
4. **File Storage**: Ensure the `uploads/` directory has appropriate permissions (`chown -R www-data:www-data uploads`) and cannot execute uploaded files directly.

---

## 8. Troubleshooting

| Symptom | Cause | Resolution |
|---|---|---|
| `502 Bad Gateway` on `/api/` | Backend service not running | Check `systemctl status jeevadrishti-backend` or `docker compose logs backend`. |
| `SAM model checkpoint unavailable` | Missing `.pth` weights | Ensure `SAM_MODEL_PATH` points to a valid checkpoint on disk. |
| `VLM service is not configured` | Missing VLM API key | Ensure `VLM_API_KEY` or `GOOGLE_API_KEY` is provided in `.env`. |
| CORS errors in browser console | Origin mismatch | Update `CORS_ORIGINS` in backend `.env` to match the exact frontend URL scheme and port. |
| `Table benchmark_results has no column named...` | Outdated schema | Run `alembic upgrade head` to apply latest database migrations. |
