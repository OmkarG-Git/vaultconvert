import { DocumentTabs } from "./DocumentTabs";
import { DocumentLibrary } from "./DocumentLibrary";
import { PreviewArea } from "../preview/PreviewArea";
import { ActionSidebar } from "../actions/ActionSidebar";
import { ClearWorkspaceModal } from "./ClearWorkspaceModal";

export function Workspace(props) {
  const {
    documents, selected, selectedId, setSelectedId, pdfs, page, setPage,
    action, setAction, actions, inputRef, addFiles, removeDoc, clearWorkspace,
    setConfirmClear, confirmClear, notice, status, busy, run, resetEdits, undo,
    redo, rotatePage, deletePage, duplicatePage, movePage, visiblePages,
    options, setOpt, mutateSelected,
  } = props;

  const visible = selected?.kind === "pdf" ? visiblePages(selected) : [];

  return (
    <>
      <DocumentTabs
        documents={documents}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        setPage={setPage}
        setAction={setAction}
        removeDoc={removeDoc}
        inputRef={inputRef}
      />

      <section className="workspace">
        <DocumentLibrary
          documents={documents}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          setPage={setPage}
          setAction={setAction}
          removeDoc={removeDoc}
          inputRef={inputRef}
          addFiles={addFiles}
          setConfirmClear={setConfirmClear}
        />

        <PreviewArea
          selected={selected}
          page={page}
          setPage={setPage}
          visible={visible}
          undo={undo}
          redo={redo}
          resetEdits={resetEdits}
        />

        <ActionSidebar
          selected={selected}
          actions={actions}
          action={action}
          setAction={setAction}
          options={options}
          setOpt={setOpt}
          pdfs={pdfs}
          page={page}
          busy={busy}
          status={status}
          notice={notice}
          run={run}
          rotatePage={rotatePage}
          movePage={movePage}
          duplicatePage={duplicatePage}
          deletePage={deletePage}
          mutateSelected={mutateSelected}
        />

        {confirmClear && <ClearWorkspaceModal onCancel={() => setConfirmClear(false)} onConfirm={clearWorkspace} />}
      </section>
    </>
  );
}
