# Security model

## Local processing boundary

VaultConvert has no application server for document conversion. Selected files remain in browser memory while PDF.js, pdf-lib, Canvas APIs and JSZip process them.

The application does not intentionally:

- upload document contents
- call a document conversion API
- use analytics or session replay
- persist document bytes in localStorage or IndexedDB
- use a database or cloud document store

Object URLs created for previews and downloads are revoked after use or when a document is removed.

## Important limitations

Local-first is an architecture choice, not a guarantee that the user's machine is secure. A compromised OS, malicious extension, browser vulnerability, malicious dependency, or modified deployment can access sensitive information.

PDF.js and other browser dependencies are third-party code and should be pinned/audited for production deployments.

Standard metadata removal uses the metadata fields exposed by pdf-lib. It should not be described as forensic removal of every possible PDF object, XMP packet, attachment, incremental update, or embedded resource.

Strong PDF compression rasterizes pages. This can remove selectable/searchable text and other document semantics, so the UI explicitly warns about the tradeoff.

## Deployment guidance

For a public deployment:

1. Serve only over HTTPS.
2. Use a strict Content Security Policy appropriate for the PDF.js worker and Vite deployment.
3. Self-host static assets when practical.
4. Do not add analytics, third-party document processors, remote fonts, or upload SDKs without reviewing the privacy model.
5. Pin and audit dependencies before release.

For highly sensitive workflows, a self-hosted static build or offline desktop package provides stronger control over the deployment boundary.
