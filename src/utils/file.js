export function fileKind(file) {
  const type = file.type.toLowerCase();
  const ext = file.name.toLowerCase().split(".").pop();

  if (type === "application/pdf" || ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "webp"].includes(ext) || type.startsWith("image/")) return "image";
  return null;
}

export function imageMime(file) {
  const ext = file.name.toLowerCase().split(".").pop();
  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    }[ext] || file.type
  );
}
