# VaultConvert Architecture

VaultConvert is a local-first React/Vite document workspace. The refactor keeps document-processing logic separate from presentation so individual UI areas can be changed without editing the entire application.

## Structure

```text
src/
├── App.jsx                         # Application composition only
├── main.jsx                        # Vite/React entry point
├── config/
│   └── actions.js                  # Available document actions + icons
├── constants/
│   └── app.js                      # Default options and document state factories
├── hooks/
│   └── useVaultWorkspace.js        # Workspace state, history and operations
├── utils/
│   └── file.js                     # File type/MIME helpers
├── components/
│   ├── actions/
│   │   └── ActionSidebar.jsx       # Action selection and action-specific controls
│   ├── empty/
│   │   └── EmptyWorkspace.jsx      # Initial upload/drop screen
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── TrustFooter.jsx
│   ├── preview/
│   │   ├── DocumentCanvas.jsx       # Main document rendering + page thumbnails
│   │   └── PreviewArea.jsx          # Preview header, navigation and history controls
│   └── workspace/
│       ├── Workspace.jsx            # Workspace composition
│       ├── DocumentTabs.jsx
│       ├── DocumentLibrary.jsx
│       └── ClearWorkspaceModal.jsx
├── engine.js                       # PDF/image processing and export engine
└── styles.css                      # Existing application styles
```

## Responsibility boundaries

- `App.jsx` should remain a composition layer. Avoid adding conversion logic here.
- `useVaultWorkspace.js` owns workspace state and document operations.
- `components/` contains presentation and user interaction components.
- `engine.js` contains browser-side document processing. It does not render React UI.
- `constants/` and `utils/` contain reusable, non-UI helpers.

## Development

Install dependencies and build the generated production output with:

```bash
npm install
npm run build
```

The `dist/` directory is intentionally not committed in this refactored source package because it is generated output. Run `npm run build` before deployment.
