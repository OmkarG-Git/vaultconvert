export const PDF_ACTIONS = [
  ["edit-pages", "Edit pages", "Rotate, delete, duplicate, reorder"],
  ["extract", "Extract pages", "Create a new PDF from selected pages"],
  ["merge", "Merge PDFs", "Combine open PDFs in your chosen order"],
  ["pdf-image", "Export images", "PDF → JPG / PNG / ZIP"],
  ["watermark", "Watermark", "Embed text into the exported PDF"],
  ["metadata", "Inspect metadata", "Review standard PDF metadata"],
  ["remove-metadata", "Remove metadata", "Clear standard metadata fields"],
  ["compress-pdf", "Compress PDF", "Create a smaller local copy"],
];

export const IMAGE_ACTIONS = [
  ["image-edit", "Edit image", "Rotate, flip and resize non-destructively"],
  ["image-pdf", "Convert to PDF", "Create a PDF locally"],
  ["image-export", "Export image", "JPG, PNG or WebP"],
];

export const ICONS = {
  "edit-pages": "▦", extract: "⌘", merge: "⊕", "pdf-image": "▤",
  watermark: "◇", metadata: "ⓘ", "remove-metadata": "⌫", "compress-pdf": "◒",
  "image-edit": "✦", "image-pdf": "▣", "image-export": "⇩",
};

export function actionsForDocument(selected, pdfCount = 0) {
  if (!selected) return [];
  if (selected.kind === "image") return IMAGE_ACTIONS;
  return PDF_ACTIONS.filter(([id]) => id !== "merge" || pdfCount >= 2);
}
