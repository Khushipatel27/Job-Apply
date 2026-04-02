import { useEffect } from 'react';

function ScoreRing({ score, size = 72 }) {
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const color = score >= 72 ? 'var(--green)' : score >= 42 ? 'var(--yellow)' : 'var(--red)';
  const fill = (score / 100) * circ;

  return (
    <div className="score-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="score-ring-value">{score}</div>
    </div>
  );
}

function BreakdownScore({ score }) {
  const color = score >= 72 ? 'var(--green)' : score >= 42 ? 'var(--yellow)' : 'var(--red)';
  return <div className="breakdown-score" style={{ color }}>{score}</div>;
}

export default function OptimizePanel({ job, data, loading, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="side-panel" role="dialog" aria-modal="true">
        <div className="panel-header">
          <div>
            <div className="panel-title">Resume Optimization</div>
            <div className="panel-subtitle">
              {job.title} · {job.company}
            </div>
          </div>
          <button className="panel-close" onClick={onClose} aria-label="Close panel">✕</button>
        </div>

        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner" />
            <div style={{ fontSize: 14, color: 'var(--text-2)' }}>
              Analyzing your resume<span className="loading-dots" />
            </div>
          </div>
        ) : data ? (
          <div className="panel-body">

            {/* Overall score */}
            <div className="overall-score">
              <ScoreRing score={data.match_score} />
              <div>
                <div className="score-ring-label">Overall Match Score</div>
                <div className="score-ring-sub">
                  {data.match_score >= 72
                    ? 'Strong match — you should apply!'
                    : data.match_score >= 42
                    ? 'Moderate match — optimize before applying'
                    : 'Weak match — significant gaps to address'}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="panel-section">
              <div className="panel-section-title">ATS Score Breakdown</div>
              <div className="breakdown-grid">
                <div className="breakdown-card">
                  <BreakdownScore score={data.ats_breakdown?.skills_match ?? 0} />
                  <div className="breakdown-label">Skills</div>
                </div>
                <div className="breakdown-card">
                  <BreakdownScore score={data.ats_breakdown?.experience_match ?? 0} />
                  <div className="breakdown-label">Experience</div>
                </div>
                <div className="breakdown-card">
                  <BreakdownScore score={data.ats_breakdown?.title_match ?? 0} />
                  <div className="breakdown-label">Title</div>
                </div>
              </div>
            </div>

            {/* Top 3 changes */}
            <div className="panel-section">
              <div className="panel-section-title">Top 3 Resume Changes</div>
              <div className="changes-list">
                {(data.top_3_changes || []).map((change, i) => (
                  <div className="change-item" key={i}>
                    <div className="change-number">{i + 1}</div>
                    <div>{change}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords to add */}
            {data.keywords_to_add?.length > 0 && (
              <div className="panel-section">
                <div className="panel-section-title">Keywords to Add</div>
                <div className="keywords-wrap">
                  {data.keywords_to_add.map((kw, i) => (
                    <span className="keyword-chip" key={i}>{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Rewritten headline */}
            {data.rewritten_headline && (
              <div className="panel-section">
                <div className="panel-section-title">Rewritten Headline</div>
                <div className="text-block headline-text">{data.rewritten_headline}</div>
              </div>
            )}

            {/* Rewritten summary */}
            {data.rewritten_summary && (
              <div className="panel-section">
                <div className="panel-section-title">Rewritten Professional Summary</div>
                <div className="text-block">{data.rewritten_summary}</div>
              </div>
            )}

            <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>
              Close Panel
            </button>
          </div>
        ) : (
          <div className="panel-loading">
            <div style={{ fontSize: 32 }}>⚠️</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Failed to load optimization data</div>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </>
  );
}
