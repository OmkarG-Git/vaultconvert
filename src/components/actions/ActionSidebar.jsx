import { ICONS } from "../../config/actions";

export function ActionSidebar({
  selected,
  actions,
  action,
  setAction,
  options,
  setOpt,
  pdfs,
  page,
  busy,
  status,
  notice,
  run,
  rotatePage,
  movePage,
  duplicatePage,
  deletePage,
  mutateSelected,
}) {
  return (
    <aside className="actions">
      <div className="actions-context">
        <div className="actions-title">{selected?.kind === "pdf" ? "PDF WORKSPACE" : "IMAGE WORKSPACE"}</div>
        <div className="context-file">
          <span>{selected?.kind.toUpperCase()}</span>
          <b>{selected?.name}</b>
        </div>
      </div>

      {actions.map(([id, title, sub]) => (
        <button key={id} className={`action ${action === id ? "active" : ""}`} onClick={() => setAction(id)}>
          <span>{ICONS[id]}</span>
          <div><b>{title}</b><small>{sub}</small></div>
          <em>›</em>
        </button>
      ))}

      {action === "edit-pages" && (
        <div className="panel page-tools">
          <button onClick={() => rotatePage(-1)}>↶ Rotate left</button>
          <button onClick={() => rotatePage(1)}>↷ Rotate right</button>
          <div className="tool-grid">
            <button onClick={() => movePage(-1)}>↑ Move up</button>
            <button onClick={() => movePage(1)}>↓ Move down</button>
            <button onClick={duplicatePage}>＋ Duplicate</button>
            <button className="danger" onClick={deletePage}>Delete page</button>
          </div>
          <small className="hint">Page {page} is selected. Changes stay in memory until you export.</small>
        </div>
      )}

      {action === "extract" && (
        <Panel>
          <label>Pages<input value={options.pages} onChange={(event) => setOpt("pages", event.target.value)} placeholder="1, 3, 5-8" /></label>
        </Panel>
      )}

      {action === "merge" && (
        <Panel>
          <label>PDF order<input value={options.mergeOrder} onChange={(event) => setOpt("mergeOrder", event.target.value)} placeholder={`1, 2, 3 · ${pdfs.length} open`} /></label>
          <small className="hint">Use the document numbers shown in the open-document list.</small>
        </Panel>
      )}

      {action === "pdf-image" && (
        <Panel>
          <label>Format<select value={options.imageFormat} onChange={(event) => setOpt("imageFormat", event.target.value)}><option value="jpeg">JPG</option><option value="png">PNG</option></select></label>
          <label>Render scale<select value={options.renderScale} onChange={(event) => setOpt("renderScale", event.target.value)}><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
        </Panel>
      )}

      {action === "watermark" && (
        <Panel>
          <label>Text<input value={options.watermark} onChange={(event) => setOpt("watermark", event.target.value)} /></label>
          <label>Opacity<input type="range" min=".05" max=".5" step=".01" value={options.watermarkOpacity} onChange={(event) => setOpt("watermarkOpacity", event.target.value)} /></label>
          <label>Rotation<input type="range" min="-90" max="90" value={options.watermarkRotation} onChange={(event) => setOpt("watermarkRotation", event.target.value)} /></label>
        </Panel>
      )}

      {action === "image-edit" && <ImageEditPanel selected={selected} mutateSelected={mutateSelected} />}

      {action === "image-pdf" && (
        <Panel>
          <label>Page size<select value={options.pageSize} onChange={(event) => setOpt("pageSize", event.target.value)}><option value="a4">A4</option><option value="auto">Original image size</option></select></label>
          <label>Fit<select value={options.fit} onChange={(event) => setOpt("fit", event.target.value)}><option value="contain">Contain</option><option value="width">Fit width</option><option value="stretch">Stretch</option></select></label>
          <label>Margin<select value={options.margin} onChange={(event) => setOpt("margin", event.target.value)}><option value="0">0 pt</option><option value="18">18 pt</option><option value="30">30 pt</option></select></label>
        </Panel>
      )}

      {action === "image-export" && (
        <Panel>
          <label>Format<select value={options.exportFormat} onChange={(event) => setOpt("exportFormat", event.target.value)}><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label>
          <label>Quality<input type="range" min=".5" max="1" step=".01" value={options.quality} onChange={(event) => setOpt("quality", event.target.value)} /></label>
        </Panel>
      )}

      {action === "compress-pdf" && (
        <Panel>
          <label>Quality<input type="range" min=".65" max="1" step=".05" value={options.compressQuality} onChange={(event) => setOpt("compressQuality", event.target.value)} /></label>
          <small className="hint">Higher quality preserves more detail but may produce a larger PDF. Pages are rasterized, so selectable text may be lost. The original remains untouched.</small>
        </Panel>
      )}

      {action === "metadata" && (
        <Panel><small className="hint">Reads standard metadata exposed by pdf-lib. It does not claim to expose every internal PDF object.</small></Panel>
      )}

      {notice?.type === "metadata" && <Metadata data={notice.data} />}
      {notice?.type && notice.type !== "metadata" && <div className={`notice ${notice.type}`}>{notice.type === "success" ? "✓" : "!"} {notice.text}</div>}
      {status && <div className="status">{status}</div>}

      {action && (
        <button className="run" disabled={busy} onClick={run}>
          {busy ? (action === "edit-pages" ? "Preparing…" : "Processing…") : action === "metadata" ? "Inspect metadata" : action === "edit-pages" ? "Download updated PDF" : "Export locally"}
          <span>↓</span>
        </button>
      )}
    </aside>
  );
}

function Panel({ children }) {
  return <div className="panel">{children}</div>;
}

function ImageEditPanel({ selected, mutateSelected }) {
  return (
    <Panel>
      <div className="tool-grid">
        <button onClick={() => mutateSelected((document) => ({ ...document, image: { ...document.image, rotation: (document.image.rotation + 270) % 360 } }))}>↶ Rotate</button>
        <button onClick={() => mutateSelected((document) => ({ ...document, image: { ...document.image, rotation: (document.image.rotation + 90) % 360 } }))}>↷ Rotate</button>
        <button onClick={() => mutateSelected((document) => ({ ...document, image: { ...document.image, flipX: !document.image.flipX } }))}>⇋ Flip H</button>
        <button onClick={() => mutateSelected((document) => ({ ...document, image: { ...document.image, flipY: !document.image.flipY } }))}>⇵ Flip V</button>
      </div>
      <label>
        Width
        <input type="number" value={selected.image.width || selected.dimensions.width} onChange={(event) => mutateSelected((document) => {
          const width = Math.max(1, Number(event.target.value) || document.dimensions.width);
          const height = document.image.maintainAspect ? Math.round((width * document.dimensions.height) / document.dimensions.width) : document.image.height || document.dimensions.height;
          return { ...document, image: { ...document.image, width, height } };
        })} />
      </label>
      <label>
        Height
        <input type="number" value={selected.image.height || selected.dimensions.height} onChange={(event) => mutateSelected((document) => {
          const height = Math.max(1, Number(event.target.value) || document.dimensions.height);
          const width = document.image.maintainAspect ? Math.round((height * document.dimensions.width) / document.dimensions.height) : document.image.width || document.dimensions.width;
          return { ...document, image: { ...document.image, width, height } };
        })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={selected.image.maintainAspect} onChange={(event) => mutateSelected((document) => ({ ...document, image: { ...document.image, maintainAspect: event.target.checked } }))} /> Maintain aspect ratio
      </label>
    </Panel>
  );
}

function Metadata({ data }) {
  return (
    <div className="metadata">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}><span>{key}</span><b>{Array.isArray(value) ? value.join(", ") : String(value || "—")}</b></div>
      ))}
    </div>
  );
}
