import "../css/Topbar.css";

function Topbar({ onToggleSidebar }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="topbar-menu-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
          <span className="topbar-menu-icon" />
        </button>
        <h1 className="topbar-title">Kirana Store Owner Panel</h1>
      </div>
      <span className="topbar-badge">Owner Use Only</span>
    </header>
  );
}

export default Topbar;
