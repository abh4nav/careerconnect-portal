# CareerConnect — Placement Portal

CareerConnect is a full-stack placement portal built to help students explore job opportunities and manage job applications. Administrators can create and edit job postings, view applicants, and manage application statuses.

## Features

### Student
- Register and log in securely.
- Browse available job opportunities.
- Apply for jobs.
- View and track submitted applications.

### Administrator
- Log in with an administrator account.
- Create new job postings.
- Edit existing job postings.
- View applicants for individual jobs.
- Review applicant details and update application statuses.

### Authentication and Security
- JWT-based authentication.
- Role-based access control for students and administrators.
- Password hashing.
- Protected API routes.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JSON Web Tokens (JWT) |

## Project Structure

```text
careerconnect-portal/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   └── index.html
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   └── auth.js
│   │   └── index.js
│   └── package.json
├── .gitignore
└── README.md
```

## Run Locally

### Prerequisites
- Node.js and npm
- A MongoDB Atlas database or another compatible MongoDB instance

### 1. Configure the backend

Open a terminal in the project root:

```bash
cd server
npm install
```

Create a `server/.env` file with the environment variables expected by the backend:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

Replace the placeholders with your own values. Never commit this file or publish its contents.

### 2. Start the backend

```bash
npm run dev
```

The backend runs on the port configured by the application, which defaults to port `5000` if configured that way.

### 3. Start the frontend

Open a second terminal from the project root:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API and database connection status |
| GET | `/api/jobs` | Retrieve job postings |
| POST | `/api/jobs` | Create a job posting (administrator) |
| PATCH | `/api/jobs/:id` | Edit a job posting (administrator) |
| POST | `/api/applications` | Submit a job application |
| GET | `/api/applications` | Retrieve applications based on the user's role |
| PATCH | `/api/applications/:id` | Update an application (administrator) |

Authentication and registration endpoints are implemented in the server authentication routes.

## Environment Variables

Configure the following on your local machine and in your hosting provider:

- `MONGODB_URI` — MongoDB connection string.
- `JWT_SECRET` — secret used to sign and verify JWTs.
- `PORT` — optional server port, depending on the deployment environment.
- `VITE_API_URL` — frontend API base URL, when configured for deployment.

Do not put secret values in source code or GitHub.

## Deployment

The intended deployment setup is:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

Live URLs will be added after deployment and testing are complete.

## Future Improvements

- Automated tests for API routes and authentication.
- Improved validation, rate limiting, and production security hardening.
- More detailed application tracking and reporting.
- Accessibility and responsive UI improvements.

## Project Status

CareerConnect is a learning and demonstration project. Its implemented features should be tested in the deployed environment before being relied on in production. Additional testing and security hardening are recommended before production use.
