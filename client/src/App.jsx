import { useState, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import InputForm from './components/InputForm';
import LoadingState from './components/LoadingState';
import ResultsTable from './components/ResultsTable';
import OptimizePanel from './components/OptimizePanel';
import ThumbnailPage from './pages/ThumbnailPage';

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function JobHuntApp() {
  const [phase, setPhase] = useState('form');      // 'form' | 'scraping' | 'results'
  const [progress, setProgress] = useState('');
  const [jobs, setJobs] = useState([]);
  const [source, setSource] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [apifyToken, setApifyToken] = useState('');
  const [scoringProgress, setScoringProgress] = useState('');

  // Optimize panel state
  const [panelJob, setPanelJob] = useState(null);
  const [panelData, setPanelData] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [optimizingId, setOptimizingId] = useState(null);

  const handleSearch = useCallback(async ({ roles, location, apifyToken: token, resumeText: resume }) => {
    setResumeText(resume);
    setApifyToken(token);
    setPhase('scraping');
    setProgress('Connecting to LinkedIn via Apify…');

    try {
      // 1. Scrape LinkedIn jobs
      const scrapeRes = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles, location, apifyToken: token }),
      });

      if (!scrapeRes.ok) {
        const errData = await scrapeRes.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${scrapeRes.status}`);
      }

      const { jobs: rawJobs, source: src, warning } = await scrapeRes.json();
      if (warning) console.warn('[search-jobs]', warning);

      setSource(src);
      setProgress(`Found ${rawJobs.length} jobs${src === 'cache' ? ' (demo data)' : ''}. Starting ATS scoring…`);

      // 2. Pre-populate jobs table (no scores yet)
      const initialJobs = rawJobs.map(j => ({
        ...j,
        ats_score: null,
        match_tier: null,
        missing_keywords: [],
      }));
      setJobs(initialJobs);
      setPhase('results');

      // 3. Score in batches of 5
      for (let i = 0; i < rawJobs.length; i += BATCH_SIZE) {
        const batch = rawJobs.slice(i, i + BATCH_SIZE);
        const end = Math.min(i + BATCH_SIZE, rawJobs.length);
        setScoringProgress(`Scoring ${i + 1}–${end} of ${rawJobs.length}`);

        await Promise.all(
          batch.map(async (job) => {
            try {
              const scoreRes = await fetch('/api/score-ats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  resumeText: resume,
                  jobTitle: job.title,
                  jobSnippet: job.description,
                }),
              });
              const scoreData = await scoreRes.json();
              setJobs(prev =>
                prev.map(j =>
                  j.id === job.id
                    ? { ...j, ats_score: scoreData.ats_score, match_tier: scoreData.match_tier, missing_keywords: scoreData.top_missing_keywords || [] }
                    : j
                )
              );
            } catch {
              // silently skip failed score
            }
          })
        );

        if (i + BATCH_SIZE < rawJobs.length) {
          await sleep(BATCH_DELAY_MS);
        }
      }

      setScoringProgress('');
    } catch (err) {
      console.error(err);
      setProgress('Error: ' + err.message);
      setPhase('form');
    }
  }, []);

  const handleOptimize = useCallback(async (job) => {
    setPanelJob(job);
    setPanelData(null);
    setPanelLoading(true);
    setOptimizingId(job.id);

    try {
      // Try to fetch full JD first
      let jobDescription = job.description;
      if (job.url && apifyToken) {
        try {
          const jdRes = await fetch('/api/fetch-jd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: job.url, apifyToken }),
          });
          if (jdRes.ok) {
            const { content } = await jdRes.json();
            if (content && content.length > 100) jobDescription = content;
          }
        } catch {
          // Use snippet as fallback
        }
      }

      const optRes = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          jobTitle: job.title,
        }),
      });

      if (!optRes.ok) throw new Error(`Server error ${optRes.status}`);
      const data = await optRes.json();
      setPanelData(data);
    } catch (err) {
      console.error('[optimize-resume]', err);
      setPanelData(null);
    } finally {
      setPanelLoading(false);
      setOptimizingId(null);
    }
  }, [resumeText, apifyToken]);

  const closePanel = () => {
    setPanelJob(null);
    setPanelData(null);
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">🎯</div>
          Job Hunt <span className="logo-dot">Agent</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {phase === 'results' && (
            <button
              className="btn btn-ghost"
              onClick={() => { setPhase('form'); setJobs([]); setSource(null); }}
            >
              ← New Search
            </button>
          )}
          <span className="header-badge">AI · ATS</span>
        </div>
      </header>

      <main className="app-main">
        {phase === 'form' && (
          <>
            <div className="hero">
              <div className="hero-eyebrow">✨ AI-Powered Job Search</div>
              <h1 className="hero-title">
                Find & Score Jobs{' '}
                <span className="gradient">Posted Today</span>
              </h1>
              <p className="hero-subtitle">
                Scrape LinkedIn for jobs posted in the last 24 hours, automatically score
                each posting against your resume using AI, and get specific
                optimization recommendations — all in minutes.
              </p>
              <div className="hero-features">
                {['LinkedIn Scraping', '24-Hour Filter', 'ATS Scoring', 'Resume Optimizer', 'Zero Data Storage'].map(f => (
                  <span className="feature-pill" key={f}>
                    <span className="feature-pill-dot" />
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <InputForm onSearch={handleSearch} isLoading={phase !== 'form'} />
          </>
        )}

        {phase === 'scraping' && <LoadingState progress={progress} />}

        {phase === 'results' && (
          <ResultsTable
            jobs={jobs}
            source={source}
            progress={scoringProgress}
            onOptimize={handleOptimize}
            optimizingId={optimizingId}
          />
        )}
      </main>

      {panelJob && (
        <OptimizePanel
          job={panelJob}
          data={panelData}
          loading={panelLoading}
          onClose={closePanel}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<JobHuntApp />} />
      <Route path="/thumbnail" element={<ThumbnailPage />} />
    </Routes>
  );
}
