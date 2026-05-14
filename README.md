# Veelo

Veelo is a curtain visualizer that turns a photo of your room into a render of your curtains in place. The user uploads a room photo, marks the four corners of the window, picks a curtain type, wings, and fabric, and Veelo composes the curtain into the scene using Google Gemini image generation.

> Status: MVP / proof-of-concept. Hebrew (RTL) UI. Mobile-friendly PWA target.

## Stack

- **Frontend:** React 18 + Vite (`frontend/`)
- **Backend:** FastAPI (`backend/`), Python 3.9+
- **Image model:** Google Gemini 2.5/3.x Flash Image, via `google-genai`

## Repo layou t

```
.
├── backend/         # FastAPI server (server.py), catalog, run script, .env
├── frontend/        # Vite + React app (Capture / Configure / Catalog / Results / Admin)
├── assets/          # Sample images used in dev/testing
└── docs/            # Product spec (PRD) and design references
```

## Prerequisites

- Python 3.9 or newer
- Node.js 18 or newer
- A Google Gemini API key — get one free at https://aistudio.google.com/apikey

## Quick start

Backend (terminal 1):

```bash
cd backend
cp .env.example .env          # then edit .env and set GEMINI_API_KEY
./run.sh                      # creates .venv on first run, installs deps, starts server on :8000
```

Frontend (terminal 2):

```bash
cd frontend
npm install
npm run dev                   # vite dev server on :5173, with --host enabled
```

Open <http://localhost:5173>.

## Mobile / on-device testing

The frontend `dev` script uses `vite --host`, so any phone on the same Wi-Fi network can hit the dev server directly. Vite prints the LAN URL on startup (look for `Network: http://192.168.x.x:5173`).

Backend API calls are proxied by Vite to `localhost:8000`, so the backend must run on the same machine as the dev server. If you'd rather hit a remote backend, expose it with a tunnel (e.g. `cloudflared tunnel --url http://localhost:8000`) and either change `vite.config.js` or wire a `VITE_API_BASE` env var.

For HTTPS on the phone (required for the camera in some browsers), wrap the dev server with a tunnel such as `cloudflared` or `ngrok`.

### Install as a PWA (recommended on phones)

Mobile Safari and Chrome each leave ~80–150 px of screen real estate to their own URL bar and toolbar — which is painful on a curtain-comparison UI. Installing Veelo to the home screen reclaims that space and gives the app a true full-screen, near-native feel.

- **iPhone (Safari):** Open Veelo → tap the **Share** icon → **Add to Home Screen** → **Add**. Launch from the new home-screen icon — no URL bar, no Safari toolbar.
- **Android (Chrome):** Open Veelo → tap the ⋮ menu → **Install app** (or **Add to Home screen**). Same outcome.

The app advertises itself as installable via `frontend/public/manifest.json` and the `<link rel="apple-touch-icon">` + `apple-mobile-web-app-*` meta tags in `index.html`. Standalone mode is wired with `env(safe-area-inset-*)` padding on `#root`, so content respects the iPhone notch and home indicator.

## Environment variables

| Var               | Where           | Required | Notes                                        |
| ----------------- | --------------- | -------- | -------------------------------------------- |
| `GEMINI_API_KEY`  | `backend/.env`  | yes      | Google Gemini API key. See `.env.example`.   |

## How the rendering works (in brief)

Gemini does not accept a mask input, so spatial constraint is enforced via an *anchor-dot* overlay: a thin magenta outline of the user's quadrilateral plus four prominent magenta dots placed exactly on identifiable scene features (window-frame corners, floor edge, etc.). The `/analyze` endpoint asks Gemini to label what each dot is sitting on, and that labelling is fed back into the generation prompt so the model anchors the curtain to those landmarks before removing the magenta.

## License

TBD.
