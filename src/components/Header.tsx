import { Link, useLocation } from 'react-router-dom';
import { History, Home, Settings } from 'lucide-react';

const NAV = [
  { to: '/', label: '首页', icon: Home },
  { to: '/history', label: '历史', icon: History },
  { to: '/settings', label: '设置', icon: Settings },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-[var(--border-color)] bg-[var(--bg-primary)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight">
          BFI-2
        </Link>
        <nav className="flex items-center gap-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
                  active
                    ? 'bg-[var(--bg-alt)] text-[var(--text-inverse)]'
                    : 'hover:bg-[var(--bg-card)]'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
