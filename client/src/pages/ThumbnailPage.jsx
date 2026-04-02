import { useState } from 'react';

const BADGES = [
  { icon: '🤖', label: 'AI Scoring' },
  { icon: '🎯', label: 'ATS Scoring' },
  { icon: '🔍', label: 'LinkedIn Scraper' },
  { icon: '📄', label: 'Resume Match' },
];

export default function ThumbnailPage() {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="thumbnail-page">
      <div className="thumbnail-bg-gradient" />
      <div className="thumbnail-grid" />
      <div className="thumbnail-glow-left" />
      <div className="thumbnail-glow-right" />

      <div className="thumbnail-content">
        {/* Left: Text */}
        <div className="thumbnail-left">
          <div className="thumbnail-ep-badge">
            <div className="thumbnail-ep-dot" />
            <span className="thumbnail-ep-text">Episode 16</span>
          </div>

          <div className="thumbnail-headline">
            I Built an{' '}
            <span className="accent-word">AI Agent</span>
            {' '}to Apply to{' '}
            <span className="accent-word">Jobs</span>
            {' '}For Me
          </div>

          <div className="thumbnail-badges">
            {BADGES.map(b => (
              <div className="t-badge" key={b.label}>
                <span className="t-badge-icon">{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>

          <div className="thumbnail-channel">
            <div className="thumbnail-channel-dot" />
            <span className="thumbnail-channel-name">Aspyre with Abhijay</span>
          </div>
        </div>

        {/* Right: Photo */}
        <div className="thumbnail-right">
          <div className="thumbnail-photo-glow" />
          {imgError ? (
            <div className="thumbnail-photo-fallback">👤</div>
          ) : (
            <img
              src="/images/abhi.jpeg"
              alt="Abhijay"
              className="thumbnail-photo"
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
