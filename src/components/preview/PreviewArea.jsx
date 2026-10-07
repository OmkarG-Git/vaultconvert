import { bytesToSize } from "../../engine";
import { DocumentCanvas, PageStrip } from "./DocumentCanvas";

export function PreviewArea({ selected, page, setPage, visible, undo, redo, resetEdits }) {
  return (
    <section className="preview-area">
      <div className="preview-head">
        <div>
          <b>{selected?.name}</b>
          <small>
            {selected?.kind === "pdf"
              ? `PDF · ${selected.pageCount} pages · ${bytesToSize(selected.size)}`
              : `${selected?.file.type || "IMAGE"} · ${selected?.dimensions.width} × ${selected?.dimensions.height} px · ${bytesToSize(selected.size)}`}
          </small>
        </div>
        {selected?.kind === "pdf" && (
          <div className="page-nav">
            <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>‹</button>
            <span>Page {page} / {visible.length}</span>
            <button disabled={page >= visible.length} onClick={() => setPage((current) => current + 1)}>›</button>
          </div>
        )}
      </div>

      <DocumentCanvas selected={selected} page={page} visible={visible} />
      {selected?.kind === "pdf" && <PageStrip selected={selected} visible={visible} page={page} setPage={setPage} />}

      <div className="preview-foot">
        <span>{selected?.kind === "pdf" ? "PDF preview · edits are non-destructive" : "Image preview · edits are non-destructive"}</span>
        <div className="history">
          <button disabled={!selected?.history?.past?.length} onClick={undo}>Undo</button>
          <button disabled={!selected?.history?.future?.length} onClick={redo}>Redo</button>
          <button onClick={resetEdits}>Reset</button>
        </div>
      </div>
    </section>
  );
}
