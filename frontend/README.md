# JeevaDrishti — Frontend

> **Empowering Microscopy with Intelligent Vision**

A premium, futuristic 3D biomedical AI web application for intelligent cell detection using Vision-Language Models.

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 + Vite | Core framework |
| Tailwind CSS v3 | Styling |
| Three.js + React Three Fiber | 3D visualization |
| @react-three/drei | 3D helpers (Float, Stars, OrbitControls) |
| Framer Motion | Page transitions & animations |
| Recharts | Research charts |
| React Router v7 | Routing |
| Zustand | Global state |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── 3d/          — Three.js / R3F 3D components
│   ├── ui/          — Reusable UI components  
│   └── charts/      — Recharts visualizations
├── pages/           — Route pages
├── layouts/         — Layout wrappers
├── hooks/           — Custom React hooks
├── services/        — API service layer (FastAPI-ready)
├── store/           — Zustand state store
└── lib/             — Utilities
```

## Backend Integration

The frontend is ready to connect to a FastAPI backend.
Update `VITE_API_URL` in `.env` and remove mock implementations in `src/services/api.js`.

```env
VITE_API_URL=http://localhost:8000/api
```

## Demo Credentials

For the mock auth, **any email + password** will work.
