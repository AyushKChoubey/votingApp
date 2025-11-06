# VoteBooth — Secure Voting Application

Short summary
--------------
VoteBooth is a production-ready full‑stack voting application that enables booth creation, join-by-code, secure authentication (email/password + Google OAuth), real-time vote aggregation, and an admin dashboard for analytics and management. The frontend is a Vite-powered React app and the backend is an Express API backed by MongoDB Atlas.

Live
----
- Frontend (Vercel): https://voting-app-rose.vercel.app
- Backend API (Render): https://votingapp-pz34.onrender.com/api/health

Resume-ready blurb
------------------
Built a full-stack, production-ready voting platform using React + Vite, Express.js, and MongoDB. Implemented JWT and Google OAuth2 authentication, MongoDB-backed sessions, role-based admin features, real-time vote aggregation, and deployed a split architecture (frontend on Vercel, backend on Render). Focused on secure authentication, reliable session storage, and clear devops for repeatable deployment.

Key features
------------
- Secure authentication: email/password + Google OAuth2, JWT tokens
- Booth management: create, update, delete booths; join via access codes
- Voting: cast votes, prevent duplicate votes, configurable options
- Real-time results and participation statistics
- Admin dashboard: manage booths, view analytics, export results
- Production-grade session storage using MongoDB (connect-mongo)
- CORS and OAuth ready for production domains

Repository structure (relevant)
------------------------------
```
votingApp/
├── client/        # React (Vite) frontend (deploy to Vercel)
├── server/        # Express API backend (deploy to Render)
└── README.md
```

Tech stack
----------
- Frontend: React (Vite), Tailwind CSS, React Router, React Query, Axios
- Backend: Node.js, Express, MongoDB Atlas, Mongoose, JWT, Passport.js (Google OAuth2), bcrypt, connect-mongo
- Deployment: Vercel (frontend), Render (backend)

Quickstart (developer)
----------------------
1. Clone repo
	```bash
	git clone https://github.com/AyushKChoubey/votingApp.git
	cd votingApp
	```
2. Install dependencies
	```bash
	# root helper installs both sides if available
	npm run install:all || (cd server && npm install && cd ../client && npm install)
	```
3. Configure environment
	- Copy `server/.env` or `server/.env.example` and set production/dev values.
	- Copy `client/.env` for development and `client/.env.production` for Vercel.

Server example (server/.env for local development)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/votingApp
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Client example (client/.env)
```env
VITE_API_URL=http://localhost:5000
```

Run locally
-----------
```bash
# start server
cd server && npm run dev
# start client in a separate terminal
cd client && npm run dev
```

Build & deploy notes
--------------------
- Frontend: build with `cd client && npm run build` and deploy the `dist` to Vercel. Set `VITE_API_URL` in Vercel Environment Variables to your Render API URL (https://votingapp-pz34.onrender.com).
- Backend: deploy server to Render. Set Render Environment Variables (production): `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `SESSION_SECRET`, `CLIENT_URL=https://voting-app-rose.vercel.app`, `ALLOWED_ORIGINS=https://voting-app-rose.vercel.app`, `GOOGLE_CALLBACK_URL=https://votingapp-pz34.onrender.com/api/auth/google/callback`.

OAuth / Google setup checklist
-----------------------------
1. In Google Cloud Console > APIs & Services > Credentials, edit the OAuth 2.0 Client ID.
2. Add these to **Authorized JavaScript origins**:
	- `https://voting-app-rose.vercel.app`
	- `https://votingapp-pz34.onrender.com`
	- keep `http://localhost:5173` for development
3. Add these to **Authorized redirect URIs**:
	- `https://votingapp-pz34.onrender.com/api/auth/google/callback`
	- `http://localhost:5000/api/auth/google/callback` (dev)

Minimal API overview (high level)
---------------------------------
- `GET /api/health` — health/status
- `POST /api/auth/register` — register
- `POST /api/auth/login` — login (returns JWT)
- `GET /api/auth/google` and `/api/auth/google/callback` — Google OAuth flow
- `GET/POST /api/booth` — create/list booths
- `POST /api/booth/:id/vote` — cast vote
- `GET /api/booth/:id/results` — results

Testing and verification
------------------------
- Health: `GET /api/health`
- OAuth: ensure Google OAuth redirect URIs and authorized origins include both Render and Vercel URLs
- CORS: set `ALLOWED_ORIGINS` on Render to `https://voting-app-rose.vercel.app`

Why this README is resume-ready
--------------------------------
- Concise project summary and measurable accomplishments
- Clear tech stack and architecture to showcase skills
- Deployment and production notes showing devops knowledge

Keywords & metadata (for resume/SEO)
-----------------------------------
Voting app, React, Vite, Express, Node.js, MongoDB, Mongoose, JWT, OAuth2, Passport.js, Google OAuth, Tailwind CSS, Vercel, Render, connect-mongo, real-time analytics, admin dashboard

Contributing
------------
Contributions are welcome. Fork, create a feature branch, add tests, and open a pull request. Keep changes scoped, document any config changes, and ensure local builds pass.

License & author
----------------
MIT License

Author: Ayush K Choubey — https://github.com/AyushKChoubey

Contact / Demo
--------------
Frontend: https://voting-app-rose.vercel.app
API: https://votingapp-pz34.onrender.com/api/health

---
