// components/Navbar/Navbar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Building2, BarChart3, Settings, LogOut } from 'lucide-react'; // Import Settings icon from lucide-react
import './Navbar.css';
import { logout, getCurrentUser } from '../../services/auth.js';

export default function Navbar() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const user = getCurrentUser();

  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <header className="nav">
      <div className="nav__inner container">
        <div className="nav__brand">⚡ Smart Utilities</div>
        <nav className="nav__links">
          {user ? (
            <>
              <Link className={pathname === '/' ? 'nav__link active' : 'nav__link'} to="/">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link className={pathname === '/bills' ? 'nav__link active' : 'nav__link'} to="/bills">
                <FileText size={18} />
                <span>Bills</span>
              </Link>
              <Link className={pathname === '/branches' ? 'nav__link active' : 'nav__link'} to="/branches">
                <Building2 size={18} />
                <span>Branches</span>
              </Link>
              <Link className={pathname === '/reports' ? 'nav__link active' : 'nav__link'} to="/reports">
                <BarChart3 size={18} />
                <span>Reports</span>
              </Link>
              <Link className={pathname === '/settings' ? 'nav__link active' : 'nav__link'} to="/settings">
                <Settings size={18} />
                <span>Settings</span>
              </Link>
              <button className="nav__logout button secondary" onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <Link className={pathname === '/login' ? 'nav__link active' : 'nav__link'} to="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
