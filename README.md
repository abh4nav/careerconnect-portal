# CareerConnect — Placement Management Portal

A full-stack portfolio project for campus placements. This starter includes a React dashboard and an Express API with demo data, so you can run it locally before adding a database and authentication.

## Features in this starter
- Placement dashboard with summary statistics
- Searchable job/internship listings
- Apply to a listing and track application status
- Add a placement opportunity through the API
- REST API with basic input validation
- Responsive UI

## Requirements
- Node.js 20+ and npm

## Run locally
Open two terminals.

### 1. Start the API
```bash
cd server
npm install
npm run dev
```
API runs at http://localhost:5000.

### 2. Start the frontend
```bash
cd client
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173).

## API endpoints
- `GET /api/health` — health check
- `GET /api/jobs` — list jobs (optional `?search=`)
- `POST /api/jobs` — create a job
- `GET /api/applications` — list applications
- `POST /api/applications` — apply to a job
- `PATCH /api/applications/:id` — update application status

## Important next steps before putting it on a resume
This is a learning starter, not a production-ready deployment. The demo API stores data in memory, so data resets when the server restarts. Add PostgreSQL + Prisma, authentication with hashed passwords, role-based access (student/placement officer/recruiter), tests, and deployment before describing those features on your resume. Never claim features you have not implemented.
