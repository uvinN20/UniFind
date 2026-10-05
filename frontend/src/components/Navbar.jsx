import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
    <rect x="4" y="2" width="24" height="28" rx="6" fill="#FFD23F" stroke="#0F1B2D" strokeWidth="2.5" />
    <circle cx="16" cy="9" r="3" fill="#F2F4F8" stroke="#0F1B2D" strokeWidth="2" />
    <path d="M10 19h12M10 24h7" stroke="#0F1B2D" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={close}>
          <Logo />
          <span>UniFind</span>
        </Link>

        <button
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          Menu
        </button>

        <nav id="main-nav" className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/items" onClick={close}>
            Browse reports
          </NavLink>
          {user && (
            <NavLink to="/dashboard" onClick={close}>
              My dashboard
            </NavLink>
          )}
          {user && user.role === 'admin' && (
            <NavLink to="/admin" onClick={close}>
              Admin
            </NavLink>
          )}
          <Link to="/report" className="btn btn-primary btn-sm" onClick={close}>
            Report an item
          </Link>
          {user ? (
            <>
              <NavLink to="/profile" onClick={close}>
                {user.name.split(' ')[0]}
              </NavLink>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>
                Log in
              </NavLink>
              <Link to="/register" className="btn btn-ghost btn-sm" onClick={close}>
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
