export default function LoadingState({ progress }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <div className="loading-title">Hunting Jobs…</div>
      <div className="loading-text">
        {progress || 'Initializing'}
        <span className="loading-dots" />
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" />
      </div>
    </div>
  );
}
