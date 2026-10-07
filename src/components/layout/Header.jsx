export function Header({ privacyOpen, onTogglePrivacy }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo">V</div>
        <div>
          <b>VaultConvert</b>
          <small>Private document workspace</small>
        </div>
      </div>

      <button className="local" onClick={onTogglePrivacy}>
        <i /> LOCAL ONLY
      </button>

      {privacyOpen && (
        <div className="privacy-pop">
          <b>Processed in this browser</b>
          <p>
            Your document bytes are not sent to a conversion backend. Browser
            extensions, device compromise and a tampered deployment are
            outside this application's control.
          </p>
        </div>
      )}
    </header>
  );
}
