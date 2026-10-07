import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { actionsForDocument } from "../config/actions";
import {
  bytesToSize,
  canvasBlob,
  createThumbnail,
  exportPdfWithEdits,
  extractFromEdits,
  getPdfMetadata,
  getPdfPageCount,
  imageInfo,
  imageToCanvas,
  imagesToPdf,
  mergePdfs,
  removeMetadata,
  renderPdfImages,
  stripExtension,
  zipBlobs,
  compressPdf,
  downloadBlob,
} from "../engine";
import { INITIAL_OPTIONS, emptyEdits, emptyImage, snapshotDocument } from "../constants/app";
import { fileKind, imageMime } from "../utils/file";

export function useVaultWorkspace() {
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState(null);
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const inputRef = useRef(null);

  const selected = documents.find((d) => d.id === selectedId) || documents[0];
  const pdfs = useMemo(() => documents.filter((d) => d.kind === "pdf"), [documents]);
  const actions = useMemo(() => actionsForDocument(selected, pdfs.length), [selected, pdfs.length]);

  const addFiles = useCallback(async (fileList) => {
    setNotice(null);
    const incoming = [];
    const errors = [];

    for (const raw of Array.from(fileList || [])) {
      const kind = fileKind(raw);
      if (!kind) {
        const ext = raw.name.includes(".") ? raw.name.split(".").pop().toUpperCase() : "(none)";
        errors.push(`${raw.name} · .${ext} · ${raw.type || "unknown MIME"} · ${bytesToSize(raw.size)} — This file type is not currently supported.`);
        continue;
      }

      try {
        const file = kind === "image" && raw.type !== imageMime(raw)
          ? new File([raw], raw.name, { type: imageMime(raw), lastModified: raw.lastModified })
          : raw;

        const document = {
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          kind,
          dimensions: null,
          pageCount: kind === "pdf" ? await getPdfPageCount(file) : 1,
          thumbnail: null,
          edits: emptyEdits(),
          image: emptyImage(),
          history: { past: [], future: [] },
        };

        if (kind === "pdf") document.thumbnail = await createThumbnail(file, 1, 0.28);
        else {
          document.dimensions = await imageInfo(file);
          document.thumbnail = URL.createObjectURL(file);
        }
        incoming.push(document);
      } catch (error) {
        errors.push(`${raw.name}: ${error?.message || "Unable to open this file."}`);
      }
    }

    if (!incoming.length) {
      setNotice({ type: "error", text: errors.join(" ") || "No supported files were selected." });
      return;
    }

    setDocuments((current) => [...current, ...incoming]);
    setSelectedId(incoming[0].id);
    setPage(1);
    setAction(null);
    if (errors.length) setNotice({ type: "error", text: errors.join(" ") });
  }, []);

  const removeDoc = useCallback((id) => {
    setDocuments((current) => {
      const document = current.find((item) => item.id === id);
      if (document?.thumbnail) URL.revokeObjectURL(document.thumbnail);
      return current.filter((item) => item.id !== id);
    });

    setSelectedId((currentSelectedId) => {
      if (currentSelectedId !== id) return currentSelectedId;
      const index = documents.findIndex((document) => document.id === id);
      return (documents[index + 1] || documents[index - 1])?.id || null;
    });
    if (selectedId === id) {
      setPage(1);
      setAction(null);
    }
  }, [documents, selectedId]);

  const clearWorkspace = useCallback(() => {
    documents.forEach((document) => document.thumbnail && URL.revokeObjectURL(document.thumbnail));
    setDocuments([]);
    setSelectedId(null);
    setPage(1);
    setAction(null);
    setNotice(null);
    setStatus("");
    setConfirmClear(false);
  }, [documents]);

  const setOpt = useCallback((key, value) => setOptions((current) => ({ ...current, [key]: value })), []);

  const mutateWithoutHistory = useCallback((fn) => {
    setDocuments((current) => current.map((document) => (document.id === selected?.id ? fn(document) : document)));
  }, [selected?.id]);

  const mutateSelected = useCallback((fn) => {
    if (!selected) return;
    setDocuments((current) => current.map((document) => {
      if (document.id !== selected.id) return document;
      const before = snapshotDocument(document);
      const next = fn(document);
      return {
        ...next,
        history: { past: [...document.history.past, before].slice(-50), future: [] },
      };
    }));
  }, [selected]);

  const undo = useCallback(() => {
    if (!selected || !selected.history.past.length) return;
    const last = selected.history.past.at(-1);
    mutateWithoutHistory((document) => ({
      ...document,
      ...last,
      history: {
        past: document.history.past.slice(0, -1),
        future: [snapshotDocument(document), ...document.history.future].slice(0, 50),
      },
    }));
  }, [selected, mutateWithoutHistory]);

  const redo = useCallback(() => {
    if (!selected || !selected.history.future.length) return;
    const next = selected.history.future[0];
    mutateWithoutHistory((document) => ({
      ...document,
      ...next,
      history: {
        past: [...document.history.past, snapshotDocument(document)].slice(-50),
        future: document.history.future.slice(1),
      },
    }));
  }, [selected, mutateWithoutHistory]);

  const pageOrder = useCallback((document) => document.edits.order.length
    ? document.edits.order
    : Array.from({ length: document.pageCount }, (_, index) => index), []);

  const visiblePages = useCallback((document) => pageOrder(document).filter((index) => !document.edits.deleted.includes(index)), [pageOrder]);

  const activePageIndex = useCallback(() => {
    if (!selected || selected.kind !== "pdf") return 0;
    const order = selected.edits.order.length
      ? selected.edits.order
      : Array.from({ length: selected.pageCount }, (_, index) => index);
    return order[page - 1];
  }, [selected, page]);

  const rotatePage = useCallback((direction) => {
    const index = activePageIndex();
    mutateSelected((document) => ({
      ...document,
      edits: {
        ...document.edits,
        rotations: {
          ...document.edits.rotations,
          [index]: ((document.edits.rotations[index] || 0) + (direction === -1 ? 270 : 90)) % 360,
        },
      },
    }));
  }, [activePageIndex, mutateSelected]);

  const deletePage = useCallback(() => {
    if (!selected || visiblePages(selected).length <= 1) {
      setNotice({ type: "error", text: "A PDF must keep at least one page." });
      return;
    }
    const index = activePageIndex();
    mutateSelected((document) => ({
      ...document,
      edits: {
        ...document.edits,
        deleted: document.edits.deleted.includes(index) ? document.edits.deleted : [...document.edits.deleted, index],
      },
    }));
    setPage((currentPage) => Math.min(currentPage, Math.max(1, visiblePages(selected).length - 1)));
  }, [selected, visiblePages, activePageIndex, mutateSelected]);

  const duplicatePage = useCallback(() => {
    const index = activePageIndex();
    mutateSelected((document) => {
      const order = pageOrder(document);
      const position = Math.max(0, order.indexOf(index));
      order.splice(position + 1, 0, index);
      return { ...document, edits: { ...document.edits, order } };
    });
    setPage((currentPage) => currentPage + 1);
  }, [activePageIndex, mutateSelected, pageOrder]);

  const movePage = useCallback((direction) => {
    const index = activePageIndex();
    mutateSelected((document) => {
      const order = pageOrder(document);
      const position = order.indexOf(index);
      const target = position + direction;
      if (target < 0 || target >= order.length) return document;
      [order[position], order[target]] = [order[target], order[position]];
      return { ...document, edits: { ...document.edits, order } };
    });
    setPage((currentPage) => Math.max(1, currentPage + direction));
  }, [activePageIndex, mutateSelected, pageOrder]);

  const resetEdits = useCallback(() => {
    mutateSelected((document) => ({ ...document, edits: emptyEdits(), image: emptyImage() }));
    setPage(1);
    setNotice({ type: "success", text: "Edits reset. The original file remains unchanged." });
  }, [mutateSelected]);

  const success = useCallback((text) => {
    setNotice({ type: "success", text });
    setBusy(false);
  }, []);

  const run = useCallback(async () => {
    if (!selected || !action) return;
    setBusy(true);
    setNotice(null);
    setStatus("");

    try {
      if (action === "image-edit") {
        const canvas = await imageToCanvas(selected.file, selected.image);
        const blob = await canvasBlob(canvas, imageMime(selected.file), Number(options.imageQuality));
        const mime = imageMime(selected.file);
        downloadBlob(blob, `${stripExtension(selected.name)}-edited.${mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"}`);
        canvas.width = 1; canvas.height = 1;
        return success("Edited image exported locally.");
      }

      if (action === "compress-image") {
        const canvas = await imageToCanvas(selected.file, selected.image);
        const blob = await canvasBlob(canvas, options.compressImageFormat, Number(options.compressImageQuality));
        const extension = options.compressImageFormat === "image/webp" ? "webp" : "jpg";
        downloadBlob(blob, `${stripExtension(selected.name)}-compressed.${extension}`);
        canvas.width = 1; canvas.height = 1;
        return success(`Image exported · ${bytesToSize(selected.size)} → ${bytesToSize(blob.size)}.`);
      }

      if (action === "image-export") {
        const canvas = await imageToCanvas(selected.file, selected.image);
        const blob = await canvasBlob(canvas, options.exportFormat, Number(options.quality));
        downloadBlob(blob, `${stripExtension(selected.name)}.${options.exportFormat === "image/png" ? "png" : options.exportFormat === "image/webp" ? "webp" : "jpg"}`);
        canvas.width = 1; canvas.height = 1;
        return success("Image exported locally.");
      }

      if (action === "image-pdf") {
        const output = await imagesToPdf([selected.file], {
          pageSize: options.pageSize,
          fit: options.fit,
          margin: Number(options.margin),
          transforms: { [selected.name]: selected.image },
          onProgress: (current, total) => setStatus(`Building PDF · ${current}/${total}`),
        });
        downloadBlob(new Blob([output], { type: "application/pdf" }), `${stripExtension(selected.name)}.pdf`);
        return success("PDF created locally.");
      }

      if (action === "merge") {
        const ordered = options.mergeOrder
          ? options.mergeOrder.split(",").map(Number).map((index) => pdfs[index - 1]).filter(Boolean)
          : pdfs;
        if (!ordered.length) throw Error("Add at least two PDFs.");

        const editedFiles = [];
        for (let index = 0; index < ordered.length; index++) {
          setStatus(`Preparing PDF ${index + 1}/${ordered.length}`);
          const bytes = await exportPdfWithEdits(ordered[index].file, ordered[index].edits);
          editedFiles.push(new File([bytes], ordered[index].name, { type: "application/pdf" }));
        }
        const output = await mergePdfs(editedFiles, (current, total) => setStatus(`Merging PDFs · ${current}/${total}`));
        downloadBlob(new Blob([output], { type: "application/pdf" }), "merged.pdf");
        return success("Merged PDFs created locally.");
      }

      if (action === "extract") {
        const pages = String(options.pages).split(",").flatMap((part) => {
          if (!part.includes("-")) return [Number(part)];
          const [a, b] = part.split("-").map(Number);
          return Array.from({ length: Math.abs(b - a) + 1 }, (_, index) => Math.min(a, b) + index);
        }).filter((number) => Number.isInteger(number) && number >= 1 && number <= selected.pageCount);
        if (!pages.length) throw Error("Enter valid pages such as 1, 3, 5-8.");
        const output = await extractFromEdits(selected.file, selected.edits, pages);
        downloadBlob(new Blob([output], { type: "application/pdf" }), `${stripExtension(selected.name)}-extracted.pdf`);
        return success(`${pages.length} page${pages.length === 1 ? "" : "s"} extracted.`);
      }

      if (action === "pdf-image") {
        const edited = await exportPdfWithEdits(selected.file, selected.edits);
        const source = new File([edited], selected.name, { type: "application/pdf" });
        const outputs = await renderPdfImages(source, {
          scale: Number(options.renderScale),
          format: options.imageFormat === "png" ? "image/png" : "image/jpeg",
          quality: 0.92,
          onProgress: (current, total) => setStatus(`Rendering page ${current}/${total}`),
        });
        const zip = await zipBlobs(outputs);
        downloadBlob(zip, `${stripExtension(selected.name)}-images.zip`);
        return success(`${outputs.length} images packaged into a ZIP.`);
      }

      if (action === "watermark") {
        const data = await exportPdfWithEdits(selected.file, selected.edits, {
          watermark: options.watermark,
          opacity: Number(options.watermarkOpacity),
          rotation: Number(options.watermarkRotation),
        });
        downloadBlob(new Blob([data], { type: "application/pdf" }), `${stripExtension(selected.name)}-watermarked.pdf`);
        return success("Watermark embedded into the exported PDF.");
      }

      if (action === "remove-metadata") {
        const edited = await exportPdfWithEdits(selected.file, selected.edits);
        const cleaned = await removeMetadata(new File([edited], selected.name, { type: "application/pdf" }));
        downloadBlob(new Blob([cleaned], { type: "application/pdf" }), `${stripExtension(selected.name)}-clean.pdf`);
        return success("Standard PDF metadata removed.");
      }

      if (action === "metadata") {
        const data = await getPdfMetadata(selected.file);
        setNotice({ type: "metadata", data });
        return;
      }

      if (action === "compress-pdf") {
        const result = await compressPdf(selected.file, {
          mode: "strong",
          quality: Number(options.compressQuality),
          onProgress: (current, total) => setStatus(`Compressing page ${current}/${total}`),
        });
        downloadBlob(new Blob([result.data], { type: "application/pdf" }), `${stripExtension(selected.name)}-compressed.pdf`);
        return success(`Compressed PDF created · ${bytesToSize(result.data.byteLength)}.`);
      }

      const data = await exportPdfWithEdits(selected.file, selected.edits);
      downloadBlob(new Blob([data], { type: "application/pdf" }), `${stripExtension(selected.name)}-edited.pdf`);
      success("Updated PDF exported locally.");
    } catch (error) {
      setNotice({ type: "error", text: error?.message || "Operation failed. Your original file was not changed." });
    } finally {
      setBusy(false);
      setStatus("");
    }
  }, [selected, action, options, pdfs, success]);

  useEffect(() => {
    const handler = (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "o") {
        event.preventDefault();
        inputRef.current?.click();
        return;
      }
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
        return;
      }
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (selected) {
          setAction(selected.kind === "pdf" ? "edit-pages" : "image-edit");
          setTimeout(() => run(), 0);
        }
        return;
      }
      if (event.key === "Delete" && selected?.kind === "pdf" && action === "edit-pages") deletePage();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, action, run, redo, undo, deletePage]);

  return {
    documents,
    selected,
    selectedId,
    setSelectedId,
    pdfs,
    page,
    setPage,
    action,
    setAction,
    options,
    setOpt,
    actions,
    inputRef,
    addFiles,
    removeDoc,
    clearWorkspace,
    confirmClear,
    setConfirmClear,
    notice,
    status,
    busy,
    run,
    resetEdits,
    undo,
    redo,
    rotatePage,
    deletePage,
    duplicatePage,
    movePage,
    visiblePages,
    mutateSelected,
    dragging,
    setDragging,
  };
}
