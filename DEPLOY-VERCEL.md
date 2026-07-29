# Deploying Timera to Vercel

Everything needed for a Vercel deployment is already in the repo:

| File | What it does |
| --- | --- |
| `vercel.json` | Build/install commands, clean URLs, no framework auto-detect |
| `vite.config.ts` | Switches the build to the Vercel preset when the `VERCEL` env var is present |
| `.vercelignore` | Keeps local build folders out of the upload |

## 1. Import the project

Vercel → **Add New → Project** → import this Git repository.

- **Framework preset:** Other (`vercel.json` sets `framework: null`)
- **Build command:** `npm run build` (already set)
- **Output directory:** leave **empty**

> The build produces a Vercel **Build Output API v3** folder at `.vercel/output`,
> which Vercel picks up automatically. This is why the output directory must stay
> blank — setting `dist` or `.output` is what caused the “output path not found”
> error before.

## 2. Environment variables

Add these in Vercel → Project → Settings → Environment Variables
(Production, Preview and Development):

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_PROJECT_ID
SUPABASE_SERVICE_ROLE_KEY        # server-only, needed by admin routines
LOVABLE_API_KEY                  # only if the AI concierge is used
```

The values are the same ones in the project `.env` file. The `VITE_*` ones are
inlined at build time, the rest are read at request time on the server.

## 3. Deploy

Push to the connected branch, or run `npx vercel --prod`.

## Notes

- **No 404 pages.** Any unknown URL is redirected to the home page by the router,
  so a mistyped or outdated link never leaves a visitor on a dead end.
- **Images, logo and products** all come from the database (or inline data URLs),
  so nothing depends on local files at runtime.
- **API** endpoints live under `/api/public/v1/*` and work identically on Vercel.
