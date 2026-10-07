import { useEffect, useState } from "react";
import { canvasBlob, createThumbnail, imageToCanvas, renderPdfPage } from "../../engine";

export function DocumentCanvas({ selected, page, visible }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let live = true;
    let object = "";
    if (!selected) return undefined;

    (async () => {
      try {
        if (selected.kind === "image") {
          const canvas = await imageToCanvas(selected.file, selected.image);
          const blob = await canvasBlob(canvas, selected.file.type || "image/png", 0.92);
          object = URL.createObjectURL(blob);
          canvas.width = 1;
          canvas.height = 1;
        } else {
          const sourceIndex = visible[page - 1] ?? 0;
          const rotation = selected.edits.rotations[sourceIndex] || 0;
          const { canvas } = await renderPdfPage(selected.file, sourceIndex + 1, 1.45, rotation);
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
          if (!blob) throw new Error("Unable to render preview.");
          object = URL.createObjectURL(blob);
          canvas.width = 1;
          canvas.height = 1;
        }
        if (live) setSrc(object);
        else URL.revokeObjectURL(object);
      } catch {
        if (live) setSrc("");
      }
    })();

    return () => {
      live = false;
      if (object) URL.revokeObjectURL(object);
    };
  }, [selected, page, visible]);

  return <div className="preview">{src ? <img src={src} alt="Document page preview" /> : <div className="loading">Rendering document…</div>}</div>;
}

export function PageStrip({ selected, visible, page, setPage }) {
  return (
    <div className="page-strip">
      {visible.map((index, position) => (
        <button key={`${index}-${position}`} className={page === position + 1 ? "current" : ""} onClick={() => setPage(position + 1)}>
          <Thumbnail file={selected.file} index={index} rotation={selected.edits.rotations[index] || 0} />
          <span>{position + 1}</span>
        </button>
      ))}
    </div>
  );
}

function Thumbnail({ file, index, rotation }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let live = true;
    let made = "";
    createThumbnail(file, index + 1, 0.2, rotation)
      .then((thumbnail) => {
        made = thumbnail;
        if (live) setUrl(thumbnail);
      })
      .catch(() => {});

    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [file, index, rotation]);

  return url ? <img src={url} alt={`Page ${index + 1}`} /> : <div className="thumb-loading">…</div>;
}
