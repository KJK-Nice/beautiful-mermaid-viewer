# Railway Deployment

## Option A: Deploy with Railway CLI

From the project root:

```bash
# 1. Log in (if not already)
railway login

# 2. Create a new project (or use `railway link` for an existing one)
railway init

# 3. Deploy the frontend (--path-as-root uses frontend/ as build root)
railway up ./frontend --path-as-root

# 4. Generate a public domain
railway domain
```

For subsequent deploys:

```bash
railway up ./frontend --path-as-root
```

## Option B: Deploy from GitHub (Dashboard)

1. Push this repo to GitHub.
2. Create a new project on [Railway](https://railway.com/new).
3. Deploy from GitHub and select this repository.
4. In **Settings > General**, set **Root Directory** to `frontend`.
5. Deploy. Railpack will auto-detect Vite, build, and serve with Caddy.
6. In **Settings > Networking**, click **Generate Domain** for a public URL.

## Configuration

- **Root Directory:** `frontend` (required)
- **Build:** Auto-detected (`bun run build`)
- **Start:** Auto-detected (Caddy serves `dist`)
- **Watch Paths:** `frontend/**` (configured in `railway.json`)

## Environment Variables

None required. The app uses localStorage for persistence.
