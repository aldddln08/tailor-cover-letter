# Tailored Cover Letter Generator (Full Stack)

A production-ready full-stack web application that generates tailored cover letters using OpenAI.

## Tech Stack

- Frontend: React + Tailwind CSS (Vite)
- Backend: Node.js + Express
- AI: OpenAI API
- Authentication: Firebase Auth (Google Sign-In)
- Storage:
  - `localStorage` for cached `name` and `skills`
  - In-memory backend usage store for daily limits

## Features Implemented

- Name, Skills, Job Description form
- Auto-fill Name and Skills from `localStorage`
- Persist Name and Skills to `localStorage` on change
- Generate Cover Letter flow through backend endpoint
- Backend-enforced daily limits:
  - Guest users: 3/day
  - Logged-in users: 5/day
- Guest identity via generated `guestId` in `localStorage`
- Google Login with Firebase
- Remaining daily generations display
- Editable generated cover letter output
- Loading state + API error handling
- Limit reached message
- Copy to Clipboard button

## Project Structure

- `frontend/` React + Tailwind client
- `backend/` Express API server

## Setup Instructions

### 1) Install Dependencies

```bash
cd frontend
npm install
cd ../backend
npm install
```

### 2) Configure Environment Variables

Create env files from examples:

- `frontend/.env` from `frontend/.env.example`
- `backend/.env` from `backend/.env.example`

Backend env (`backend/.env`):

- `PORT` API port (default `5000`)
- `FRONTEND_ORIGIN` allowed origin(s), comma-separated if multiple
- `OPENAI_API_KEY` your OpenAI API key
- `OPENAI_MODEL` optional, default `gpt-4o-mini`

Frontend env (`frontend/.env`):

- `VITE_API_BASE_URL` backend base URL (`http://localhost:5000`)
- Firebase web app values:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`

### 3) Configure Firebase Google Auth

1. Create a Firebase project.
2. In Firebase Console, add a Web App and copy config values into `frontend/.env`.
3. Enable Google provider in Authentication > Sign-in method.
4. Add `localhost` domains in Authentication authorized domains if needed.

### 4) Run the App

Start backend:

```bash
cd backend
npm run dev
```

Start frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open: `http://localhost:5173`

## API

### POST `/api/generate`

Request JSON:

```json
{
  "name": "Jane Doe",
  "skills": "React, Node.js, APIs",
  "jobDescription": "...",
  "userId": "guest-abc123-or-firebase-uid",
  "isLoggedIn": false
}
```

Responses:

- `200`: cover letter + updated usage stats
- `429`: daily limit exceeded
- `400/500`: validation or server errors

### GET `/api/usage-status`

Query params:

- `userId`
- `isLoggedIn=true|false`

Returns daily limit usage state for the user.

## Notes

- Daily usage data is in-memory and resets when server restarts.
- For persistent usage tracking, replace with MongoDB or another database.
