# VaultConvert

VaultConvert is a local-first document workspace for sensitive files. It opens documents first, keeps the original file immutable, lets you edit a working state, and generates exports inside the browser.

## Screenshots

Add product screenshots here after the first production deployment.

## Supported formats

- PDF
- JPG / JPEG
- PNG
- WebP

DOCX, XLSX and PPTX are intentionally not advertised or processed.

## Core features

- PDF.js document preview and lazy page thumbnails
- Non-destructive PDF page rotation, deletion, duplication and reordering
- Per-document undo/redo/reset history
- PDF page extraction
- Multi-PDF merge with explicit ordering
- PDF → JPG/PNG packaged into a ZIP using JSZip
- Image → PDF with A4/original sizing, fit and margins
- Image rotate, flip and resize with aspect-ratio control
- JPG/PNG/WebP export
- PDF watermark embedding
- Standard PDF metadata inspection and removal
- PDF compression with an explicit warning when rasterization is used
- Multiple open documents and document tabs/library
- Responsive mobile workspace
- No document persistence in localStorage or IndexedDB

## Privacy model

Document bytes are read through the browser File API and processed with PDF.js, pdf-lib, Canvas APIs and JSZip. There is no application upload endpoint, conversion backend, analytics SDK, tracking code or document cloud storage.

This is not an absolute security guarantee. A compromised device, malicious browser extension, browser vulnerability, malicious dependency, or tampered hosting environment can access data independently of VaultConvert.

## Architecture

```text
File API
  ↓
Document state (original + non-destructive edit model)
  ↓
PDF.js / Canvas preview
  ↓
pdf-lib / Canvas / JSZip export
  ↓
Blob download
```

The original `File` is never rewritten. PDF page edits are stored as page order, deletion and rotation state and applied only during export. Image edits are stored as transform state and rendered only during preview/export.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Security considerations

See [SECURITY.md](./SECURITY.md).

## Limitations

- PDF metadata controls cover standard metadata exposed by pdf-lib, not every possible private/custom PDF object.
- Strong PDF compression rasterizes pages; selectable/searchable text may be lost.
- Very large files can still exhaust browser memory because browser PDF/image processing is memory constrained.
- PDF → images currently packages the rendered pages into a ZIP rather than creating separate browser downloads.
- Password/encryption, OCR, redaction, annotations, signatures and Office formats are not implemented.

## Future roadmap

DOCX/PPTX/XLSX, OCR, stronger PDF optimization, password encryption, crop, annotations, signatures, redaction, batch workflows and a Tauri desktop shell can be added without changing the local-first processing boundary.
