export function DocumentTabs({ documents, selectedId, setSelectedId, setPage, setAction, removeDoc, inputRef }) {
  return (
    <div className="document-tabs">
      {documents.map((document) => (
        <button
          key={document.id}
          className={selectedId === document.id ? "current" : ""}
          onClick={() => {
            setSelectedId(document.id);
            setPage(1);
            setAction(null);
          }}
        >
          <span>{document.name}</span>
          <i onClick={(event) => { event.stopPropagation(); removeDoc(document.id); }}>×</i>
        </button>
      ))}
      <button className="add-tab" onClick={() => inputRef.current?.click()}>＋ Add file</button>
    </div>
  );
}
