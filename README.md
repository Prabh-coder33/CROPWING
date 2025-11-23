# Nexus Workspace (Smart AI)

## Project Overview

This repository contains a simple full-stack demo called "Nexus Workspace" — a frontend single-page UI (static files) and an Express + MongoDB backend that provides authentication, user profiles, courses, ideas, and a lightweight AI assistant placeholder.

Structure
- `backend/` — Node/Express server (`index.js`) with MongoDB models and API routes.
- `smart ai/` — Frontend static app (`index.html`, `script.js`, `style.css`).

API base URL (used by the frontend): `http://localhost:5000/api`

## Prerequisites

- Node.js (v16+ recommended)
- npm (comes with Node.js)
- MongoDB (local or remote) — the backend defaults to `mongodb://localhost:27017/workspace-ai` if not set via environment variables

## Environment

Create a `.env` file inside `backend/` (same folder as `index.js`) with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/workspace-ai
JWT_SECRET=your-secret-key
```

Replace `MONGODB_URI` with your Atlas/remote URI if needed.

## Install & Run Backend

Open a terminal and run:

```powershell
cd 'C:\Users\navjo\Downloads\New folder (2)\New folder (2)\backend'
npm install
npm start
```

The backend `start` script runs `node index.js`. The server will listen on the port from `PORT` (defaults to `5000` in the code).

The server expects a MongoDB connection. If it cannot connect, you will see an error in the terminal.

## Run Frontend

The frontend is static. Open `smart ai/index.html` in your browser (double-click or use `Live Server`/simple static server). The frontend expects the API at `http://localhost:5000/api` by default — change `API_URL` in `smart ai/script.js` if your backend runs on a different host/port.

## Notes

- Authentication: The frontend stores JWT in `localStorage` and sends it as `Authorization: Bearer <token>` to protected endpoints.
- If you want to change the API URL without editing `script.js`, use a small proxy developer server or start the backend on the same host/port via a reverse proxy.

## Contributing / Updating Remote

To commit and push changes locally:

```powershell
cd 'C:\Users\navjo\Downloads\New folder (2)\New folder (2)'
git add README.md
git commit -m "Add README"
git push
```

If `git push` fails because no remote is configured, add your GitHub remote:

```powershell
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

Replace `<your-username>` and `<your-repo>` with your repository details.

---
If you want, I can also:
- Create a `.env.example` in `backend/`.
- Add a short `how-to-run.txt` or update the existing file with these steps.
- Configure a GitHub Actions workflow to run a basic lint or test.

Happy to do the next step — tell me which option you prefer.

