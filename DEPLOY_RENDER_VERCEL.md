# Deploying: Render (backend) + Vercel (frontend) + MongoDB Atlas (database)

Unlike the single-origin Docker/nginx setup, this architecture puts the
frontend and backend on **two different domains** (`*.vercel.app` and
`*.onrender.com`). The backend already supports this — CORS and cookies are
both driven by `CLIENT_URL` and already configured for cross-site cookies in
production (`sameSite: 'none'`, `secure: true`) — but it means every step
below matters for auth to actually work: get `CLIENT_URL` wrong and login
will silently fail with a CORS or cookie error in the browser console.

## 1. MongoDB Atlas

You already have a cluster and this connection string:

```
mongodb+srv://ranashivansh70_db_user:<db_password>@cluster0.byt7afv.mongodb.net/?appName=Cluster0
```

Two things to fix before using it — **do this yourself, don't paste the real
password into any chat**:

1. **Add a database name.** As-is, the path is empty, so the driver has
   nothing to select a database with. Insert a name before the `?`:
   ```
   mongodb+srv://ranashivansh70_db_user:<db_password>@cluster0.byt7afv.mongodb.net/task_manager?appName=Cluster0&retryWrites=true&w=majority
   ```
2. **Allow Render to connect.** Atlas → your cluster → **Network Access** →
   **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`). Render's
   free/starter plans don't have static outbound IPs, so this is the only
   practical option unless you're on a paid Render plan with static IPs.

Keep the finished URI (with the real password swapped in) somewhere private
— you'll paste it into Render's dashboard in step 3, not into git.

## 2. Push the deploy configs

Two files are now in the repo to make both platforms auto-detect the right
setup:

- **`render.yaml`** (repo root) — a Render Blueprint for the backend: Node
  runtime, `rootDir: backend`, health check at `/health`. Secrets
  (`CLIENT_URL`, `MONGODB_URI`, `JWT_SECRET`, etc.) are deliberately *not* in
  this file — you set those in Render's dashboard in step 3.
- **`frontend/vercel.json`** — rewrites every path to `index.html` so
  client-side routes (e.g. `/projects/123`) don't 404 on a hard refresh.

## 3. Deploy the backend on Render

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
   → connect your GitHub repo (`Shivanshrana1446/Task_manager_tool`). Render
   reads `render.yaml` and proposes the `task-manager-api` service — accept it.
2. Before the first deploy finishes, open the service → **Environment** and
   add these (not in `render.yaml`, so they're not sitting in git):

   | Key | Value |
   | --- | --- |
   | `MONGODB_URI` | the Atlas URI from step 1, with the real password |
   | `JWT_SECRET` | `ac60837a553d0eec2e14485145af7b9ec08e8f590b64e2d8e4262680aac1148158abeb7a8b784fb46590af9376841f047de949a715bbbcaa90d0fddd8d019c02` |
   | `JWT_REFRESH_SECRET` | `da809345a377bffab1d4f42487b90a3822a64956a22f91b71e482b0f815256922dea09bcb4dd2918d07f53b439261b63b31b79bdd770357476ec85be30f0c55d` |
   | `CLIENT_URL` | your Vercel URL — you won't have this until step 4; come back and set it after |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from [cloudinary.com](https://cloudinary.com) console — attachments/avatars won't upload without these |

   The two JWT secrets above were generated fresh just now — don't reuse
   them for anything else, and don't commit them anywhere.
3. Save, let it deploy, then note the public URL Render gives you, e.g.
   `https://task-manager-api.onrender.com`.

> **Free plan note:** Render's free web services spin down after 15 minutes
> of inactivity and take ~30–60s to wake up on the next request — the first
> request after idle will be slow. Fine for a demo; upgrade to a paid plan
> to avoid it for real usage.

## 4. Deploy the frontend on Vercel

1. [vercel.com/new](https://vercel.com/new) → import the same GitHub repo.
2. Vercel will ask for the project settings — set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (should auto-detect)
   - **Build Command** / **Output Directory**: leave the Vite defaults
3. Add environment variables (Project → Settings → Environment Variables),
   using the Render URL from step 3:

   | Key | Value |
   | --- | --- |
   | `VITE_API_BASE_URL` | `https://task-manager-api.onrender.com/api/v1` |
   | `VITE_SOCKET_URL` | `https://task-manager-api.onrender.com` |

   These are baked into the JS bundle at build time — if you change them
   later, you need a new deploy, not just a restart.
4. Deploy. Vercel gives you a URL like `https://task-manager-tool.vercel.app`.

## 5. Close the loop: point the backend at the frontend

Go back to Render → your service → **Environment** → set
`CLIENT_URL` to the exact Vercel URL from step 4 (including `https://`, no
trailing slash) → save, which triggers a redeploy. This is what makes CORS
and the cross-site refresh-token cookie work — until this matches exactly,
login will appear to succeed but immediately act logged-out (the cookie gets
rejected) or the login request itself will fail CORS.

## Verifying it worked

1. Visit the Vercel URL, open browser dev tools → Network tab.
2. Register or log in. Check the response to `/auth/login`: it should be
   `200/201`, not a CORS error in the console.
3. Refresh the page while logged in — if you're bounced back to the login
   screen, `CLIENT_URL` doesn't exactly match the Vercel URL (check for a
   missing/extra `https://`, trailing slash, or a preview-deployment URL that
   differs from production).

## Known limitation: Vercel preview deployments

`CLIENT_URL` is a single origin string — it matches your production Vercel
URL only. Vercel's per-branch/per-PR preview URLs (a different subdomain
each time) will fail CORS against this backend. That's fine for now; if you
later want previews to work too, the backend's CORS config would need to
accept a list/pattern of origins instead of one fixed string.
