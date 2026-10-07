export function ClearWorkspaceModal({ onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <b>Clear workspace?</b>
        <p>
          This removes the current documents and edit state from the
          application memory. Your original files on disk are not modified.
        </p>
        <div>
          <button onClick={onCancel}>Cancel</button>
          <button className="danger-fill" onClick={onConfirm}>Clear workspace</button>
        </div>
      </div>
    </div>
  );
}
