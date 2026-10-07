import "./UploadIndicator.css";

export function UploadIndicator({ compact = false }) {
  return (
    <div className={`upload-progress${compact ? " compact" : ""}`} role="status" aria-live="polite">
      <span className="upload-spinner" aria-hidden="true" />
      <span>Opening document and preparing preview…</span>
    </div>
  );
}
