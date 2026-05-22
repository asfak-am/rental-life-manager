# Rental Life Manager

DEMO ACCOUNT CREDENTIALS

Email:    alex@demo.com 
Password: password123 
House Code: DEMO123ABC

A simple housemate expense, rent and task manager (backend + frontend).

**Contents**
- **Overview:** Quick project summary
- **Prerequisites:** Tools you need installed
- **Repo layout:** Key folders
- **Backend:** install, env, seed, run, scripts
- **Frontend:** install, run, build
- **Seeding & Demo account:** how to populate demo data
- **Contributing & License**

**Overview**:
- **Project:** Full-stack app to manage rent, expenses, tasks and notifications for a house.
- **Stack:** Node.js + Express (backend), MongoDB, React + Vite (frontend).

**Prerequisites**:
- **Node.js**: v16+ recommended
- **npm** or **pnpm**
- **MongoDB**: a running instance (local or Atlas)

**Repository layout**
- **backend/**: Express server, API routes, models, scripts
- **frontend/**: React + Vite app
- **design/**: design assets

**Backend — setup & run**

1. Change to the backend folder and install dependencies:

```bash
cd backend
npm install
```

2. Environment variables

Create a `.env` file in `backend/` with at least:

- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — secret for signing tokens (for dev you can set any value)
- Any other environment variables referenced in `backend/config` or `server.js`.

Example `.env` (do not commit):

```text
MONGO_URI=mongodb://localhost:27017/rental-life
JWT_SECRET=dev-secret
```

3. Seed the database (demo data)

The project includes `backend/scripts/seed.js` to populate demo users, house, expenses, tasks, payments and notifications.

From the `backend/` folder run:

```bash
# seed without deleting existing data
node scripts/seed.js

# OR clear existing data then reseed
node scripts/seed.js --clean
```

Demo credentials printed by the seeder:

- Email: alex@demo.com
- Password: password123
- House Code: DEMO123ABC
- House Name: Downtown Apartment

These are defined in `backend/scripts/seed.js` and used for demo/testing purposes.

4. Run the backend in development

```bash
cd backend
npm run dev
```

Common npm scripts (backend/package.json):
- `dev` — start in dev (nodemon or similar)
- `start` — production start
- `seed` — (if present) run seeder

**Frontend — setup & run**

1. Install dependencies and start dev server:

```bash
cd frontend
npm install
npm run dev
```

2. Build for production:

```bash
npm run build
npm run preview
```

The frontend expects the backend API base URL to be available — check `frontend/src/services/api.js` for where to configure the API base URL. Common options:

- Use a `.env` in `frontend/` (e.g. `VITE_API_BASE_URL`) or
- Configure a proxy in `vite.config.js` for local development.

**Running full stack locally**

1. Start MongoDB (local or ensure Atlas URI is reachable)
2. Start backend dev server (`cd backend && npm run dev`)
3. Start frontend dev server (`cd frontend && npm run dev`)

Open the frontend URL printed by Vite (usually `http://localhost:5173`) and sign in with the demo account or register a new user.

**Seeding notes & data scope**

- The seeder generates ~12 months of rent, recurring bills, random expenses, rent payments, tasks and notifications.
- If you want to reset data, run `node scripts/seed.js --clean` from `backend/`.
- The demo account (alex@demo.com / password123) is included for convenience.

**Testing & linting**

Check `package.json` in each folder for available scripts. Typical helpful commands:

```bash
cd backend
npm test
npm run lint

cd frontend
npm test
npm run lint
```

**Deployment**

- Frontend: deploy the `frontend/dist` build to Vercel, Netlify, or any static host.
- Backend: host the Node.js app on platforms like Heroku, DigitalOcean App Platform, Railway, or a VPS. Ensure `MONGO_URI` and `JWT_SECRET` are set in production environment.

**Contributing**

Contributions are welcome. Typical workflow:

1. Fork or branch the repo
2. Implement changes and add tests where applicable
3. Open a PR describing the change

**License**

This project has no license file in this template. Add a `LICENSE` file if you want to specify terms (e.g., MIT).

**Files to inspect**
- Seeder: [backend/scripts/seed.js](backend/scripts/seed.js)
- Backend entry: [backend/server.js](backend/server.js)
- Frontend entry: [frontend/index.html](frontend/index.html)
