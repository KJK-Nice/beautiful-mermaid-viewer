# Railway Deployment

## Deploy with Railway CLI

From the project root:

```bash
# 1. Log in (if not already)
railway login

# 2. Create a new project (or use `railway link` for an existing one)
railway init

# 3. Deploy
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
4. Deploy. Railpack will auto-detect Vite, build, and serve with Caddy.
5. In **Settings > Networking**, click **Generate Domain** for a public URL.

## Configuration

- **Build:** `bun install && bun run build` (configured in `railway.json`)
- **Start:** Auto-detected (Caddy serves `dist`)

## Environment Variables

None required. The app uses localStorage for persistence.
