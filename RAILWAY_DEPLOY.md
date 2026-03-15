# Railway Deployment

This project uses **Docker** for deployment (migrated from Railpack).

## Deploy with Railway CLI

From the project root:

```bash
# 1. Log in (if not already)
railway login

# 2. Create a new project (or use `railway link` for an existing one)
railway init

# 3. Deploy (uses Dockerfile)
railway up

# 4. Generate a public domain
railway domain
```

For subsequent deploys:

```bash
railway up
```

## Deploy from GitHub (Dashboard)

1. Push this repo to GitHub.
2. Create a new project on [Railway](https://railway.com/new).
3. Deploy from GitHub and select this repository.
4. Railway will detect the `Dockerfile` and build/deploy with Docker.
5. In **Settings > Networking**, click **Generate Domain** for a public URL.

## Configuration

- **Build:** Multi-stage Docker build
  - Stage 1: Bun installs deps and runs `bun run build` (Vite)
  - Stage 2: Lightweight Node image serves `dist/` with `serve`
- **Start:** `serve -s dist -l $PORT` (Railway injects `PORT` at runtime)

## Environment Variables

None required. The app uses localStorage for persistence.

## Local Docker Build (optional)

To test the Docker build locally:

```bash
docker build -t beautiful-mermaid-viewer .
docker run -p 3000:3000 beautiful-mermaid-viewer
```

Then open http://localhost:3000
