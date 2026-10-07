export const SUPPORTED_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

export const INITIAL_OPTIONS = {
  pageSize: "a4",
  fit: "contain",
  margin: "18",
  renderScale: "1.5",
  imageFormat: "jpeg",
  quality: ".92",
  compressQuality: ".88",
  compressImageQuality: ".75",
  compressImageFormat: "image/webp",
  watermark: "CONFIDENTIAL",
  watermarkOpacity: ".18",
  watermarkRotation: "35",
  pages: "",
  mergeOrder: "",
  maxWidth: "original",
  imageQuality: ".92",
  exportFormat: "image/jpeg",
};

export const emptyEdits = () => ({ order: [], deleted: [], rotations: {} });

export const emptyImage = () => ({
  rotation: 0,
  flipX: false,
  flipY: false,
  width: null,
  height: null,
  maintainAspect: true,
});

export const snapshotDocument = (document) => ({
  edits: structuredClone(document.edits),
  image: structuredClone(document.image),
});
