import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initialsOf } from '../utils/format';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/projects', label: 'Projects', icon: '🗂️' },
  { to: '/tasks', label: 'Tasks', icon: '✅' },
];

function NavItems({ onNavigate }) {
  return NAV_ITEMS.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <span aria-hidden="true">{item.icon}</span>
      {item.label}
    </NavLink>
  ));
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
              PM
            </span>
            <span className="hidden sm:inline">Project Manager</span>
          </NavLink>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            <NavItems />
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-slate-900">{user?.fullName}</p>
              <p className="text-xs leading-tight text-slate-500">{user?.email}</p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
              aria-hidden="true"
            >
              {initialsOf(user?.fullName)}
            </span>
            <button type="button" onClick={logout} className="btn-secondary px-3 py-1.5">
              Log out
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="animate-fade-in border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex flex-col gap-1">
              <NavItems onNavigate={() => setMenuOpen(false)} />
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
          Project Management System
        </p>
      </footer>
    </div>
  );
}
