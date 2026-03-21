# Beautiful Mermaid Viewer

Local-first Mermaid diagram viewer with a folder tree and crisp SVG preview.

## Development

```bash
bun install
bun run dev
```

## Production build

```bash
bun run build
bun run preview
```

The build runs **TypeScript** (`tsc -b`) then **Vite via Node** with **`--configLoader native`**. That skips esbuild’s config bundling (Vite 7’s default `bundle` loader often hits **`write EPIPE`** when the project is driven by **Bun**). Config stays in **`vite.config.mjs`** (plain ESM).

## Logo

- **`public/logo.svg`** — vector logo (favicon).
