import { bytesToSize } from "../../engine";
import { SUPPORTED_FILE_ACCEPT } from "../../constants/app";

export function DocumentLibrary({ documents, selectedId, setSelectedId, setPage, setAction, removeDoc, inputRef, addFiles, setConfirmClear }) {
  return (
    <aside className="library">
      <div className="library-head">
        <b>OPEN DOCUMENTS</b>
        <button onClick={() => inputRef.current?.click()}>＋ Add</button>
      </div>
      <input
        ref={inputRef}
        hidden
        type="file"
        multiple
        accept={SUPPORTED_FILE_ACCEPT}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="doc-list">
        {documents.map((document) => (
          <button
            className={`doc ${selectedId === document.id ? "selected" : ""}`}
            key={document.id}
            onClick={() => {
              setSelectedId(document.id);
              setPage(1);
              setAction(null);
            }}
          >
            {document.thumbnail ? <img src={document.thumbnail} alt="" /> : <span className="doc-file">{document.kind.toUpperCase()}</span>}
            <span>
              <b>{document.name}</b>
              <small>
                {document.kind.toUpperCase()} · {bytesToSize(document.size)}
                {document.kind === "pdf" ? ` · ${document.pageCount} pages` : ` · ${document.dimensions.width}×${document.dimensions.height}`}
              </small>
            </span>
            <i onClick={(event) => { event.stopPropagation(); removeDoc(document.id); }}>×</i>
          </button>
        ))}
      </div>

      <button className="clear" onClick={() => setConfirmClear(true)}>Clear workspace</button>
    </aside>
  );
}
