import { useState } from "react";
import { Header } from "./components/layout/Header";
import { TrustFooter } from "./components/layout/TrustFooter";
import { EmptyWorkspace } from "./components/empty/EmptyWorkspace";
import { Workspace } from "./components/workspace/Workspace";
import { useVaultWorkspace } from "./hooks/useVaultWorkspace";

export default function App() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const workspace = useVaultWorkspace();
  const {
    documents,
    inputRef,
    dragging,
    setDragging,
    addFiles,
  } = workspace;

  const handleFiles = (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  return (
    <div className="app">
      <Header privacyOpen={privacyOpen} onTogglePrivacy={() => setPrivacyOpen((value) => !value)} />

      <main>
        {!documents.length ? (
          <EmptyWorkspace
            inputRef={inputRef}
            dragging={dragging}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onBrowse={() => inputRef.current?.click()}
            onFiles={handleFiles}
          />
        ) : (
          <Workspace {...workspace} />
        )}

        <TrustFooter />
      </main>
    </div>
  );
}
