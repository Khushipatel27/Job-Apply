import { useState, useRef, useCallback } from 'react';
import { usePdfParser } from '../hooks/usePdfParser';

export default function InputForm({ onSearch, isLoading }) {
  const [apifyToken, setApifyToken] = useState(
    () => localStorage.getItem('apifyToken') || ''
  );
  const [roles, setRoles] = useState('');
  const [location, setLocation] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const { parseFile, fileName, parsing, error: pdfError, reset: resetPdf } = usePdfParser();

  const handleApifyChange = (e) => {
    setApifyToken(e.target.value);
    localStorage.setItem('apifyToken', e.target.value);
  };

  const handleFile = useCallback(async (file) => {
    const text = await parseFile(file);
    if (text) setResumeText(text);
  }, [parseFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roles.trim() || !location.trim() || !apifyToken.trim() || !resumeText) return;
    onSearch({ roles, location, apifyToken, resumeText });
  };

  const isValid = roles.trim() && location.trim() && apifyToken.trim() && resumeText && !parsing;

  return (
    <form onSubmit={handleSubmit}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Search Configuration</div>
          <div className="card-subtitle">
            Enter your credentials and job targets — your resume never leaves your browser
          </div>
        </div>

        <div className="form-grid">
          {/* Apify Token */}
          <div className="form-group">
            <label htmlFor="apify-token">Apify API Token</label>
            <input
              id="apify-token"
              type="password"
              value={apifyToken}
              onChange={handleApifyChange}
              placeholder="apify_api_xxxxx..."
              autoComplete="off"
              required
            />
            <span className="input-hint">
              Saved to localStorage. Get yours at{' '}
              <a href="https://console.apify.com/account/integrations" target="_blank" rel="noreferrer">
                console.apify.com
              </a>
            </span>
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="San Francisco, CA or Remote"
              required
            />
            <span className="input-hint">City, State or "Remote"</span>
          </div>

          {/* Job Roles - full width */}
          <div className="form-group full-width">
            <label htmlFor="roles">Job Titles</label>
            <input
              id="roles"
              type="text"
              value={roles}
              onChange={e => setRoles(e.target.value)}
              placeholder="Software Engineer, Product Manager, Data Scientist"
              required
            />
            <span className="input-hint">
              Comma-separated — each role is searched independently in parallel
            </span>
          </div>

          {/* PDF Dropzone - full width */}
          <div className="form-group full-width">
            <label>Resume (PDF)</label>
            <div
              className={`dropzone${dragOver ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />

              {parsing ? (
                <>
                  <div className="dropzone-icon">⏳</div>
                  <div className="dropzone-text">Parsing PDF…</div>
                  <div className="dropzone-subtext">Extracting text client-side</div>
                </>
              ) : resumeText ? (
                <div className="dropzone-file">
                  <span>✅</span>
                  <span>{fileName}</span>
                  <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>
                    ({resumeText.length.toLocaleString()} chars extracted)
                  </span>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ marginLeft: 8 }}
                    onClick={e => { e.stopPropagation(); resetPdf(); setResumeText(''); }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="dropzone-icon">📄</div>
                  <div className="dropzone-text">Drop your PDF resume here or click to browse</div>
                  <div className="dropzone-subtext">
                    Text is parsed locally — your resume never leaves your browser
                  </div>
                </>
              )}
            </div>
            {pdfError && (
              <span className="input-hint" style={{ color: 'var(--red)' }}>{pdfError}</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!isValid || isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-dots" style={{ display: 'inline-block' }} />
              Searching…
            </>
          ) : (
            <>
              🔍 Find Jobs Posted in the Last 24h
            </>
          )}
        </button>
      </div>
    </form>
  );
}
