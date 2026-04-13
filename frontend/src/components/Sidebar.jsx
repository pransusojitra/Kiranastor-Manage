import { NavLink } from "react-router-dom";
import "../css/Sidebar.css";

function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-brand">Kirana CRM</div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={onClose}>
          Dashboard
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={onClose}>
          Products
        </NavLink>
        <NavLink to="/billing" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={onClose}>
          Billing
        </NavLink>
        <NavLink to="/receipts" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={onClose}>
          Receipts
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} onClick={onClose}>
          Reports
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
