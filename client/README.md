# Momentum — Client

React + Vite frontend for Momentum, a Goals → Milestones → Tasks → Subtasks tracker built to be
pinned to an iPhone home screen as a PWA. Plain CSS (no framework), `react-router-dom` for
routing, and a thin `fetch` wrapper in `src/api.js` talking to the Express API described in the
shared contract.

## Local run

```bash
cd client
npm install
cp .env.example .env      # then point VITE_API_URL at your running server
npm run dev
```

The dev server starts at `http://localhost:5173`. It expects the API server (see `../server`) to
be running at the URL in `VITE_API_URL` (default `http://localhost:4000/api`) — without it, auth
and data screens will show a "could not load" error, but the app shell (Login/Signup) always
renders on its own.

## Build

```bash
npm run build   # outputs static assets to dist/
npm run preview # serve the production build locally
```

## Deploy to Vercel

1. Push this repo to GitHub (or your git host of choice).
2. In Vercel, "Add New Project" → import the repo.
3. Set **Root Directory** to `client`.
4. Framework preset: **Vite** (auto-detected).
5. Add an environment variable `VITE_API_URL` pointing at your deployed Render API, e.g.
   `https://momentum-api.onrender.com/api`.
6. Deploy. Build command `npm run build`, output directory `dist` (Vercel's Vite preset sets
   these automatically).

## PWA / "Add to Home Screen" (iOS)

`index.html` includes the `apple-mobile-web-app-capable` meta tags and an `apple-touch-icon` link,
and `public/manifest.json` declares the app name, theme color, and icons. Icon files
(`public/icons/icon-192.png`, `public/icons/icon-512.png`) are referenced but not yet included —
another process adds them; until then they 404 harmlessly and don't affect the build or "Add to
Home Screen" functionality (iOS falls back to a screenshot-based icon). No service worker is
included in this pass by design (see the shared contract).

## Project layout

```
src/
  api.js                 fetch wrapper (VITE_API_URL, Bearer token, throws {error} messages)
  App.jsx                routes
  context/AuthContext.jsx  token/user state, login/signup/logout
  components/             shared UI (BottomSheet, GoalCard, MilestoneBlock, TaskRow, TimerButton, …)
  components/forms/       bottom-sheet create/edit forms (goal, milestone, task, subtask)
  pages/                  route screens (Login, Signup, Today, Goals, GoalDetail, Archive)
  styles/                 design tokens + global CSS (mobile-first, light/dark via prefers-color-scheme)
  utils/format.js         date/time/heatmap-level formatting helpers
```
