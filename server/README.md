# Momentum API (server)

Express + Mongoose REST API for the Momentum goal tracker (Goals -> Milestones -> Tasks ->
Subtasks). JWT auth, server-side progress rollups, and streak/heatmap activity tracking.

## Tech stack

Express 4, Mongoose 8, bcryptjs, jsonwebtoken, cors, dotenv, morgan. See `src/` for the full
layout:

```
src/
  models/       Mongoose schemas (User, Goal, Milestone, Task, Subtask, Activity)
  routes/       Express routers, one per resource
  middleware/
    auth.js     requireAuth - verifies the JWT, sets req.userId
  lib/
    rollup.js   progress recompute chain (task -> milestone -> goal) + on-track/status calc
    today.js    streak / 70-day heatmap / Today-screen payload
  app.js        express app, middleware, route mounting
  server.js     entrypoint - connects mongoose, then app.listen
```

## Local run

1. `cd server`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in the values (see below):
   ```
   cp .env.example .env
   ```
4. `npm run dev` (nodemon, auto-restarts on file change) or `npm start` for a plain `node` run.

The API listens on `PORT` (default `4000`) and serves everything under `/api` (e.g.
`http://localhost:4000/api/health`).

## Environment variables

| Var | Meaning |
|---|---|
| `MONGODB_URI` | Full MongoDB connection string (Atlas or local). Required - the server refuses to start without it. |
| `JWT_SECRET` | Any long random string used to sign/verify auth tokens. |
| `PORT` | Port the Express server listens on. Defaults to `4000`. |
| `CLIENT_ORIGIN` | The one origin CORS allows (the deployed/dev client URL), e.g. `http://localhost:5173`. |

## MongoDB Atlas free-tier setup

1. Create an account at https://www.mongodb.com/cloud/atlas and start a new **free (M0)
   Shared)** cluster.
2. **Database Access** -> Add New Database User: pick a username/password (autogenerate is
   fine) with "Read and write to any database" - save these credentials.
3. **Network Access** -> Add IP Address -> `0.0.0.0/0` ("Allow access from anywhere"). This is
   the simplest option for a small personal project; tighten it later if you care about that
   surface.
4. **Database** -> Connect -> "Drivers" -> copy the connection string, which looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
5. Insert your real username/password, and add a database name before the `?`, e.g.
   `.../momentum?retryWrites=...`. Put the whole string in `MONGODB_URI` in `.env`.

## Deploying to Render

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In the Render dashboard: **New -> Web Service**, connect the repo.
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the three environment variables under **Environment**:
   - `MONGODB_URI` - your Atlas connection string
   - `JWT_SECRET` - a long random string
   - `CLIENT_ORIGIN` - the deployed client's URL (e.g. your Vercel URL)
   - (`PORT` is set automatically by Render - no need to add it)
5. Deploy. Once live, the client's `VITE_API_URL` should point at
   `https://<your-render-service>.onrender.com/api`.

## Design notes (progress rollup, status, streaks)

- **Progress is always server-computed, never trusted from the client.** Task progress is
  derived from its subtasks (or the binary `completed` flag if it has none); Milestone/Goal
  progress are weighted rollups computed with MongoDB aggregation pipelines (`$group`,
  weighted `$sum`) rather than pulled into Node and reduced in JS, and cached on the document
  so list views don't need to recompute on every read.
- **On-track/behind + daily target** are computed on every read of `/goals` and `/goals/:id`
  (never persisted) from `startDate`/`dueDate`/cached `progress`.
- **Streak/heatmap**: a Task flipping `completed` false->true increments today's `Activity`
  count; flipping true->false only decrements it if that happened the same calendar day (so
  undoing an old completion doesn't rewrite history). `streak` walks backwards from today (or
  yesterday if today has no activity yet) while each day's count is > 0. The 70-day heatmap
  returns raw `{date, count}` pairs; the documented count->level bucketing for display is
  `0 -> level 0`, `1 -> level 1`, `2-3 -> level 2`, `4-5 -> level 3`, `6+ -> level 4`.
- Every protected route is scoped to `req.userId` from the verified JWT - no route ever trusts
  a `userId` supplied in the request body.
