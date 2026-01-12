'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/zamowienia', label: 'OMS', icon: '📦' },
    { href: '/magazyny', label: 'WMS', icon: '🏭' },
    { href: '/mes', label: 'MES', icon: '⚙️' },
    { href: '/crm', label: 'CRM', icon: '👥' },
    { href: '/agent', label: 'Asystent AI', icon: '🤖' },
  ];

  // Podziel na 2 linie na mobile
  const topRowItems = navItems.slice(0, 4); // Dashboard, Zamowienia, Magazyny, MES
  const bottomRowItems = navItems.slice(4);  // CRM, Agent AI

  const renderNavItem = (item) => {
    const isActive = pathname === item.href ||
      (item.href === '/zamowienia' && pathname.startsWith('/zamowienia')) ||
      (item.href === '/magazyny' && pathname.startsWith('/magazyny')) ||
      (item.href === '/mes' && pathname.startsWith('/mes')) ||
      (item.href === '/agent' && pathname.startsWith('/agent'));
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
          isActive
            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span className="text-lg sm:text-base">{item.icon}</span>
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-1 sm:px-6">
        {/* Desktop: jedna linia */}
        <div className="hidden sm:flex items-center">
          {navItems.map(renderNavItem)}
          <button
            onClick={handleLogout}
            className="flex flex-row items-center justify-center gap-1.5 py-3 px-2 text-sm font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Wyloguj"
          >
            <span className="text-base">🚪</span>
            <span>Wyloguj</span>
          </button>
        </div>

        {/* Mobile: dwie linie */}
        <div className="sm:hidden">
          <div className="flex items-center border-b border-gray-100">
            {topRowItems.map(renderNavItem)}
          </div>
          <div className="flex items-center">
            {bottomRowItems.map(renderNavItem)}
            <button
              onClick={handleLogout}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Wyloguj"
            >
              <span className="text-lg">🚪</span>
              <span>Wyloguj</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
