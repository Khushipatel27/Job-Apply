import { useState, useMemo } from 'react';

const EXP_LEVELS = ['All', 'Internship', 'Entry-Level', 'Mid-Level', 'Senior', 'Manager+'];

function AtsBadge({ score }) {
  if (score === null || score === undefined) {
    return <span className="ats-badge pending">Scoring…</span>;
  }
  const tier = score >= 72 ? 'high' : score >= 42 ? 'medium' : 'low';
  return (
    <span className={`ats-badge ${tier}`}>
      {score}%
    </span>
  );
}

function ExpBadge({ level }) {
  const cls = {
    'Senior': 'senior',
    'Mid-Level': 'mid',
    'Entry-Level': 'entry',
    'Internship': 'intern',
    'Manager+': 'manager',
  }[level] || 'mid';
  return <span className={`exp-badge ${cls}`}>{level}</span>;
}

export default function ResultsTable({ jobs, source, progress, onOptimize, optimizingId }) {
  const [sortCol, setSortCol] = useState('ats_score');
  const [sortDir, setSortDir] = useState('desc');
  const [expFilter, setExpFilter] = useState('All');
  const [minScore, setMinScore] = useState(0);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir(col === 'ats_score' ? 'desc' : 'asc');
    }
  };

  const sortIcon = (col) => {
    if (sortCol !== col) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const filtered = useMemo(() => {
    return jobs.filter(job => {
      if (expFilter !== 'All' && job.experienceLevel !== expFilter) return false;
      if (job.ats_score !== null && job.ats_score !== undefined && job.ats_score < minScore) return false;
      return true;
    });
  }, [jobs, expFilter, minScore]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortCol];
      let bv = b[sortCol];
      if (sortCol === 'ats_score') {
        av = av ?? -1;
        bv = bv ?? -1;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const scoredCount = jobs.filter(j => j.ats_score !== null && j.ats_score !== undefined).length;

  return (
    <div>
      <div className="results-header">
        <div>
          <span className="results-title">
            Job Results{' '}
            <span className="results-count">
              {sorted.length} of {jobs.length} jobs
              {scoredCount < jobs.length && ` · ${scoredCount} scored`}
            </span>
          </span>
          {source && (
            <span
              className={`source-badge ${source}`}
              style={{ marginLeft: 12, verticalAlign: 'middle' }}
            >
              {source === 'live' ? '🟢 Live' : '🟡 Demo data'}
            </span>
          )}
        </div>

        <div className="results-filters">
          {progress && (
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
              {progress}<span className="loading-dots" />
            </span>
          )}

          <select value={expFilter} onChange={e => setExpFilter(e.target.value)}>
            {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <select
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
          >
            <option value={0}>Min ATS: Any</option>
            <option value={42}>Min ATS: 42+</option>
            <option value={60}>Min ATS: 60+</option>
            <option value={72}>Min ATS: 72+ (High)</option>
            <option value={85}>Min ATS: 85+</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        {sorted.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <div>No jobs match your current filters</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} className={sortCol === 'title' ? 'sorted' : ''}>
                  Job Title {sortIcon('title')}
                </th>
                <th onClick={() => handleSort('company')} className={sortCol === 'company' ? 'sorted' : ''}>
                  Company {sortIcon('company')}
                </th>
                <th onClick={() => handleSort('location')} className={sortCol === 'location' ? 'sorted' : ''}>
                  Location {sortIcon('location')}
                </th>
                <th onClick={() => handleSort('ats_score')} className={sortCol === 'ats_score' ? 'sorted' : ''}>
                  ATS Score {sortIcon('ats_score')}
                </th>
                <th onClick={() => handleSort('experienceLevel')} className={sortCol === 'experienceLevel' ? 'sorted' : ''}>
                  Level {sortIcon('experienceLevel')}
                </th>
                <th onClick={() => handleSort('postedAt')} className={sortCol === 'postedAt' ? 'sorted' : ''}>
                  Posted {sortIcon('postedAt')}
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(job => (
                <tr key={job.id}>
                  <td className="job-title-cell">
                    <a
                      href={job.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="job-title-link"
                    >
                      {job.title}
                    </a>
                  </td>
                  <td className="company-cell">{job.company}</td>
                  <td className="location-cell">{job.location}</td>
                  <td><AtsBadge score={job.ats_score} /></td>
                  <td><ExpBadge level={job.experienceLevel} /></td>
                  <td className="posted-cell">{job.postedAt}</td>
                  <td>
                    <button
                      className="btn btn-optimize"
                      onClick={() => onOptimize(job)}
                      disabled={optimizingId === job.id}
                    >
                      {optimizingId === job.id ? 'Loading…' : '✨ Optimize'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
