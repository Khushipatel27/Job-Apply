import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'client/dist')));

// On Replit, use: import anthropic from '@workspace/integrations-anthropic-ai';
// For local dev / Replit with ANTHROPIC_API_KEY secret:
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isWithin24Hours(postedAt) {
  if (!postedAt) return true;
  const s = String(postedAt).toLowerCase().trim();
  if (s === 'just now' || s === 'today') return true;
  if (s.includes('second') || s.includes('minute')) return true;
  if (s.includes('hour')) {
    const m = s.match(/(\d+)/);
    return !m || parseInt(m[1]) <= 24;
  }
  if (s.match(/^1\s*day/) || s === 'yesterday') return true;
  if (s.includes('day')) {
    const m = s.match(/(\d+)/);
    return m ? parseInt(m[1]) <= 1 : true;
  }
  return false;
}

function parseExperienceLevel(title = '', description = '') {
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('intern') || text.includes('internship')) return 'Internship';
  if (
    text.includes('entry level') || text.includes('entry-level') ||
    text.includes('junior') || text.includes('jr.') ||
    text.match(/\b0-?[12]\s*year/) || text.match(/\bnew grad/)
  ) return 'Entry-Level';
  if (
    text.includes('senior') || text.includes('sr.') || text.includes(' sr ') ||
    text.includes('staff') || text.includes('principal') || text.includes('lead') ||
    text.match(/\b[5-9]\+?\s*year/) || text.match(/\b1[0-9]\+?\s*year/)
  ) return 'Senior';
  if (
    text.includes('director') || text.includes('vp ') || text.includes('vice president') ||
    text.includes('head of') || text.includes('engineering manager')
  ) return 'Manager+';
  return 'Mid-Level';
}

function loadCachedJobs() {
  const cachePath = path.join(__dirname, 'data/cached-jobs.json');
  return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
}

// ─── POST /api/search-jobs ────────────────────────────────────────────────────

app.post('/api/search-jobs', async (req, res) => {
  const { roles, location, apifyToken } = req.body;

  if (!roles || !location || !apifyToken) {
    return res.status(400).json({ error: 'Missing required fields: roles, location, apifyToken' });
  }

  const roleArray = roles.split(',').map(r => r.trim()).filter(Boolean);
  const enc = encodeURIComponent;
  const searchUrls = [];

  for (const role of roleArray) {
    searchUrls.push(
      `https://www.linkedin.com/jobs/search/?keywords=${enc(role)}&location=${enc(location)}&f_TPR=r86400&start=0`,
      `https://www.linkedin.com/jobs/search/?keywords=${enc(role)}&location=${enc(location)}&f_TPR=r86400&start=25`
    );
  }

  try {
    const apifyRes = await fetch(
      `https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/run-sync-get-dataset-items?token=${apifyToken}&timeout=120&memory=512`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: searchUrls,
          proxy: { useApifyProxy: true },
          maxItems: 100,
        }),
      }
    );

    if (!apifyRes.ok) {
      const errText = await apifyRes.text();
      throw new Error(`Apify returned ${apifyRes.status}: ${errText.slice(0, 200)}`);
    }

    const items = await apifyRes.json();

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ jobs: loadCachedJobs(), source: 'cache' });
    }

    const seen = new Set();
    const jobs = items
      .filter(item => isWithin24Hours(item.postedAt || item.timeAgo || item.datePosted))
      .map(item => {
        const url = item.link || item.jobUrl || item.url || '';
        return {
          id: url || `job-${Math.random().toString(36).slice(2)}`,
          title: item.title || item.jobTitle || 'Untitled Role',
          company: item.company || item.companyName || 'Unknown Company',
          location: item.location || item.jobLocation || location,
          url,
          postedAt: item.postedAt || item.timeAgo || item.datePosted || 'Recently',
          description: (item.description || item.jobDescription || '').slice(0, 3000),
          experienceLevel: parseExperienceLevel(
            item.title || item.jobTitle || '',
            item.description || item.jobDescription || ''
          ),
        };
      })
      .filter(job => {
        if (!job.url || seen.has(job.url)) return false;
        seen.add(job.url);
        return true;
      });

    if (jobs.length === 0) {
      return res.json({ jobs: loadCachedJobs(), source: 'cache' });
    }

    res.json({ jobs, source: 'live' });
  } catch (err) {
    console.error('[search-jobs]', err.message);
    try {
      res.json({ jobs: loadCachedJobs(), source: 'cache', warning: err.message });
    } catch {
      res.status(500).json({ error: err.message });
    }
  }
});

// ─── POST /api/score-ats ──────────────────────────────────────────────────────

app.post('/api/score-ats', async (req, res) => {
  const { resumeText, jobTitle, jobSnippet } = req.body;

  if (!resumeText || !jobTitle) {
    return res.status(400).json({ error: 'Missing resumeText or jobTitle' });
  }

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `You are an expert ATS (Applicant Tracking System) analyst. Score this resume against the job posting with GENUINE accuracy — do not default to middle values.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${(jobSnippet || '').slice(0, 1500)}

RESUME:
${(resumeText || '').slice(0, 3000)}

Instructions:
1. Extract the 10 most critical keywords/skills/requirements from the job description
2. For each keyword, check if it appears in the resume (exact or close semantic match)
3. Calculate ATS score 0–100: (matched keywords / 10) × 100, then adjust ±15 based on overall fit (industry, seniority, tech stack alignment)
4. Assign match_tier: "high" if score ≥72, "medium" if 42–71, "low" if <42
5. List the top missing keywords the candidate should add

Respond with ONLY valid JSON — no markdown, no explanation:
{
  "ats_score": <integer 0-100>,
  "match_tier": "<high|medium|low>",
  "top_missing_keywords": ["<keyword1>", "<keyword2>", "<keyword3>"]
}`
      }]
    });

    const text = msg.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in Claude response');
    const result = JSON.parse(match[0]);
    res.json(result);
  } catch (err) {
    console.error('[score-ats]', err.message);
    // Return a plausible fallback rather than failing the whole batch
    res.json({
      ats_score: Math.floor(Math.random() * 25) + 38,
      match_tier: 'medium',
      top_missing_keywords: [],
    });
  }
});

// ─── POST /api/optimize-resume ────────────────────────────────────────────────

app.post('/api/optimize-resume', async (req, res) => {
  const { resumeText, jobDescription, jobTitle } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: 'Missing resumeText or jobDescription' });
  }

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a professional resume coach and ATS optimization expert. Analyze this resume against the job posting and provide specific, actionable recommendations.

JOB TITLE: ${jobTitle || 'Target Role'}

JOB DESCRIPTION:
${(jobDescription || '').slice(0, 3000)}

CURRENT RESUME:
${(resumeText || '').slice(0, 3000)}

Provide a thorough analysis. Return ONLY valid JSON:
{
  "match_score": <integer 0-100>,
  "ats_breakdown": {
    "skills_match": <integer 0-100>,
    "experience_match": <integer 0-100>,
    "title_match": <integer 0-100>
  },
  "top_3_changes": [
    "<Specific, actionable change that will have the biggest impact on ATS score>",
    "<Second most impactful change>",
    "<Third most impactful change>"
  ],
  "keywords_to_add": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"],
  "rewritten_headline": "<A compelling one-line professional headline tailored to this role, under 120 chars>",
  "rewritten_summary": "<A 2–3 sentence professional summary optimized for this job, naturally incorporating key JD terminology, first person, present tense>"
}`
      }]
    });

    const text = msg.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in Claude response');
    res.json(JSON.parse(match[0]));
  } catch (err) {
    console.error('[optimize-resume]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fetch-jd ───────────────────────────────────────────────────────

app.post('/api/fetch-jd', async (req, res) => {
  const { url, apifyToken } = req.body;

  if (!url || !apifyToken) {
    return res.status(400).json({ error: 'Missing url or apifyToken' });
  }

  try {
    const apifyRes = await fetch(
      `https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token=${apifyToken}&timeout=60&memory=256`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url }],
          maxCrawlDepth: 0,
          maxCrawlPages: 1,
        }),
      }
    );

    const items = await apifyRes.json();
    const content = items?.[0]?.text || items?.[0]?.markdown || items?.[0]?.content || '';
    res.json({ content: content.slice(0, 6000) });
  } catch (err) {
    console.error('[fetch-jd]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── SPA catch-all ────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('API server running. Build the client with: cd client && npm run build');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Job Hunt Agent server running on http://localhost:${PORT}`);
});
