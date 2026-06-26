# Deployment — Railway

PAXTA builds to a **static SPA** (`dist/`) and is served by [`serve`](https://www.npmjs.com/package/serve).
Railway builds with Nixpacks and runs the start command from `railway.json`.

## How it works

- **Build:** `npm run build` (`tsc -b && vite build`) → `dist/`.
- **Serve:** `npm run start` → `serve -s dist -l $PORT`. The `-s` flag enables
  SPA fallback (every route returns `index.html`); `serve` binds `0.0.0.0:$PORT`
  and Railway injects `$PORT`.
- `railway.json` pins the Nixpacks builder, the build/start commands, a `/`
  health check and an on-failure restart policy. Node is pinned via
  `engines.node` (`>=20`).

## Connect a Railway project (dashboard)

1. Railway → **New Project** → **Deploy from GitHub repo** → `timfounder/paxta`.
2. Pick the branch to deploy (e.g. `main`, or a feature branch for a preview).
3. Railway reads `railway.json`, runs `npm run build`, then `npm run start`.
4. **Settings → Networking → Generate Domain** to get a public `*.up.railway.app`
   URL, then open it in a browser to test the game.

### Or via the Railway CLI

```sh
npm i -g @railway/railway   # or: npx @railway/railway
railway login
railway link                # select the project
railway up                  # build & deploy the current branch
```

## Environment variables (all optional)

Every variable has a safe fallback, so the game deploys with **none** set.
`VITE_`-prefixed values are read at **build time** (`vite build`), so set them in
Railway *before* the build runs. For a clean production deploy:

| Variable | Recommended | Notes |
| --- | --- | --- |
| `VITE_APP_ENV` | `production` | Sets the app environment label. |
| `VITE_DEBUG` | `false` | Hides the in-game developer overlays. |
| `VITE_APP_VERSION` | e.g. `0.1.0` | Shown on the menu. |
| `VITE_TELEGRAM_BOT_USERNAME` | your bot | For deep links / share URLs. |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | — | Optional; the persistence layer is prepared but unwired. |

## Testing the deployed game

- **In a browser:** open the Railway URL directly. The whole game runs without
  Telegram; only the Telegram SDK script is absent (the wrapper fails safe).
- **In Telegram:** set the Railway HTTPS URL as your bot's Mini App / Web App URL
  via **@BotFather** (`/setmenubutton` or a Web App button), then open it from
  the chat.
