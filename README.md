<div align="center">

# Job Hunt Agent

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Anthropic](https://img.shields.io/badge/Anthropic_API-Claude-CC785C?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)

<br/>

[![LinkedIn](https://img.shields.io/badge/Source-LinkedIn%20Jobs-0A66C2?style=flat-square&logo=linkedin)](.)
[![Filter](https://img.shields.io/badge/Filter-Last%2024%20Hours-green?style=flat-square)](.)
[![ATS](https://img.shields.io/badge/Scoring-ATS%20Powered-orange?style=flat-square)](.)
[![Privacy](https://img.shields.io/badge/Resume-Never%20Leaves%20Browser-blueviolet?style=flat-square)](.)

<br/>

> **Stop manually scrolling LinkedIn. Let an AI agent find, filter, and score every job posted today — then tell you exactly how to tailor your resume.**

</div>

---

## 🚀 What Job Hunt Agent Does

This is an **end-to-end job application assistant**, not a job board wrapper.

Job Hunt Agent scrapes LinkedIn for roles posted in the **last 24 hours**, runs each listing through an **ATS scoring engine** against your resume, and surfaces specific, actionable recommendations — missing keywords, rewritten headlines, tailored summaries — so you can apply smarter, not harder.

Your resume is parsed **entirely in the browser**. It never touches the server.

---

## ✨ Features

|     | Feature | What it does |
| :-: | :------ | :----------- |
| 🔍  | **Live Job Scraping** | Scrapes LinkedIn for roles posted in the last 24 hours via Apify |
| 🎯  | **ATS Scoring** | Scores each job against your resume with a 0–100 match score |
| 🏷️  | **Match Tiers** | Classifies every role as High / Medium / Low fit at a glance |
| 📝  | **Resume Optimizer** | Identifies missing keywords, rewrites your headline and summary per role |
| 📄  | **Client-Side PDF Parsing** | Extracts resume text in-browser — zero server upload |
| 🔄  | **Cached Fallback** | Falls back to cached job data when live scraping is unavailable |
| 🧠  | **Experience Classifier** | Auto-tags each role: Internship · Entry-Level · Mid-Level · Senior · Manager+ |
| 💾  | **Token Persistence** | Apify token saved to localStorage — enter once, never again |

---

## 🤖 AI Pipeline

|     | Step | What happens |
| :-: | :--- | :----------- |
| 1️⃣  | **Scrape** | Apify runs the LinkedIn Jobs scraper across your target roles + location |
| 2️⃣  | **Filter** | Only jobs posted within the last 24 hours are kept |
| 3️⃣  | **Score** | Claude extracts the 10 most critical JD keywords and checks resume coverage |
| 4️⃣  | **Rank** | Jobs are sorted by ATS match score — highest fit first |
| 5️⃣  | **Optimize** | On demand: Claude rewrites your headline, summary, and lists keywords to add |

---

## ⚡ Quick Start

```bash
# 1. Clone
git clone https://github.com/Khushipatel27/Job-Apply.git
cd Job-Apply

# 2. Install dependencies
npm run install:all

# 3. Set your Anthropic API key
# Get yours at: https://console.anthropic.com/settings/keys
set ANTHROPIC_API_KEY=your_key_here   # Windows
export ANTHROPIC_API_KEY=your_key_here  # Mac/Linux

# 4. Run in dev mode
npm run dev
```

Frontend opens at **`http://localhost:5173`** · API runs at **`http://localhost:8080`**

---

## 🔑 API Keys Required

| Key | Where to get it | Used for |
| :-- | :-------------- | :------- |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/settings/keys) | ATS scoring + resume optimization |
| Apify Token | [console.apify.com/account/integrations](https://console.apify.com/account/integrations) | LinkedIn job scraping (enter in UI) |

> The Apify token is entered directly in the app — no `.env` needed for it. The Anthropic key is set as an environment variable before running the server.

---

## 🖥️ How to Use

1. Run the app and open `http://localhost:5173`
2. Paste your **Apify token** in the first field
3. Enter your **target job titles** (comma-separated)
4. Enter your **location** (e.g. `Remote` or `New York, NY`)
5. Drop your **resume PDF** — it parses locally in seconds
6. Hit **Find Jobs** — results are scored and ranked automatically
7. Click any job row to run the **Resume Optimizer** for that specific role

---

## 📁 Project Structure

```
Job-Apply/
├── server.js                        ← Express API server
├── package.json                     ← Root scripts (dev, build, start)
├── .env.example                     ← Environment variable template
│
├── client/                          ← React + Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                  ← Main app shell + phase state machine
│       ├── index.css                ← Global styles
│       ├── components/
│       │   ├── InputForm.jsx        ← Search configuration form
│       │   ├── ResultsTable.jsx     ← Scored job listings table
│       │   ├── OptimizePanel.jsx    ← Resume optimization panel
│       │   └── LoadingState.jsx     ← Scraping + scoring progress UI
│       ├── hooks/
│       │   └── usePdfParser.js      ← Client-side PDF text extraction
│       └── pages/
│           └── ThumbnailPage.jsx    ← Thumbnail preview page
│
└── data/
    └── cached-jobs.json             ← Fallback job data (used when Apify times out)
```

---

## 📦 Scripts

| Command | What it does |
| :------ | :----------- |
| `npm run dev` | Starts both server and Vite frontend with hot reload |
| `npm run build` | Builds the React frontend to `client/dist/` |
| `npm start` | Runs the Express server only (serves built frontend) |
| `npm run install:all` | Installs dependencies for both root and client |

---

<div align="center">

Built with ❤️ by [Khushi Patel](https://github.com/Khushipatel27)

</div>
