# How to Run the College Fee Portal

This project is divided into two parts:
1.  **Backend** (Node.js/Express) - Runs on Port 5000
2.  **Frontend** (React/Vite) - Runs on Port 5173

## ❌ Common Mistake (The Error You Are Seeing)
Running `npm run dev` in `C:\college-fee-portal` causes:
`npm ERR! enoent Could not read package.json`

This happens because the root folder does not have a `package.json`. You must go into the `frontend` or `backend` folders first.

## ✅ Correct Steps to Run

### Step 1: Start Backend (Terminal 1)
Open a terminal and run:
```powershell
cd c:\college-fee-portal\backend
npm install  # Only needed once
node server.js
```
*You should see: "Server running on port 5000"*

### Step 2: Start Frontend (Terminal 2)
Open a **NEW** terminal and run:
```powershell
cd c:\college-fee-portal\frontend
npm install  # Only needed once
npm run dev
```
*You should see: "Local: http://localhost:5173/"*

### Step 3: Open in Browser
Go to [http://localhost:5173/login](http://localhost:5173/login)

**Credentials:**
- **Email:** `admin@college.com`
- **Password:** `adminpassword`
