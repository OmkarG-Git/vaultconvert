import { SUPPORTED_FILE_ACCEPT } from "../../constants/app";
import { UploadIndicator } from "../layout/UploadIndicator";

export function EmptyWorkspace({
  inputRef,
  dragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
  onFiles,
  uploading,
}) {
  return (
    <>
      <section className="intro">
        <div className="eyebrow">PRIVATE DOCUMENT WORKSPACE</div>
        <h1>
          Your files.
          <br />
          <em>Your device.</em>
        </h1>
        <p>
          <b>
            Open, inspect, edit, and export — without uploading your document
            contents.
          </b>
          VaultConvert is designed for <b>small, privacy-sensitive documents</b>
          . Your files are processed directly in your browser, so their contents
          don't need to be uploaded to a server for supported operations. For
          very large files, performance can depend on your device and browser.
          If you're working with large documents, we recommend using a dedicated
          desktop application for a smoother experience.
        </p>
      </section>

      <section
        className={`empty-drop ${dragging ? "dragging" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="upload-icon">＋</div>
        {uploading ? (
          <>
            <h2>Opening your document…</h2>
            <UploadIndicator />
          </>
        ) : (
          <>
            <h2>Drop your document here</h2>
            <p>or click to browse · PDF · JPG · PNG · WebP</p>
          </>
        )}
        <button className="browse" onClick={onBrowse}>
          Open document
        </button>
        <span className="privacy-line">
          No account · no upload server · no document storage
        </span>
        <input
          ref={inputRef}
          hidden
          type="file"
          multiple
          accept={SUPPORTED_FILE_ACCEPT}
          onChange={onFiles}
        />
      </section>
    </>
  );
}
