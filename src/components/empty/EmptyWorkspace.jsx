import { SUPPORTED_FILE_ACCEPT } from "../../constants/app";

export function EmptyWorkspace({ inputRef, dragging, onDragOver, onDragLeave, onDrop, onBrowse, onFiles }) {
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
          Open a document, inspect it, edit it, and export it without uploading
          document contents anywhere.
        </p>
      </section>

      <section
        className={`empty-drop ${dragging ? "dragging" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="upload-icon">＋</div>
        <h2>Drop your document here</h2>
        <p>or click to browse · PDF · JPG · PNG · WebP</p>
        <button className="browse" onClick={onBrowse}>Open document</button>
        <span className="privacy-line">No account · no upload server · no document storage</span>
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
