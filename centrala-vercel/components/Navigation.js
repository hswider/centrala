'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadCountEU, setUnreadCountEU] = useState(0);
  const { darkMode, toggleDarkMode } = useTheme();

  // Fetch unread messages count for CRM PL (Allegro)
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/allegro/messages?action=status');
        const data = await res.json();
        if (data.success && data.status?.unreadCount) {
          setUnreadCount(data.status.unreadCount);
        }
      } catch (err) {
        // Silently ignore errors
      }
    };

    fetchUnreadCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch unread messages count for CRM EU (Amazon + Kaufland)
  useEffect(() => {
    const fetchUnreadCountEU = async () => {
      let totalUnread = 0;

      // Amazon (Gmail threads)
      try {
        const amazonRes = await fetch('/api/gmail-amazon-de/messages');
        const amazonData = await amazonRes.json();
        if (amazonData.success && amazonData.threads) {
          const amazonUnread = amazonData.threads.filter(t => t.unread).length;
          totalUnread += amazonUnread;
        }
      } catch (err) {
        // Silently ignore
      }

      // Kaufland tickets
      try {
        const kauflandRes = await fetch('/api/kaufland/tickets');
        const kauflandData = await kauflandRes.json();
        if (kauflandData.success && kauflandData.tickets) {
          // Count tickets needing response (not from seller, open status)
          const kauflandUnread = kauflandData.tickets.filter(t =>
            t.status === 'opened' && !t.last_message_from_seller
          ).length;
          totalUnread += kauflandUnread;
        }
      } catch (err) {
        // Silently ignore
      }

      setUnreadCountEU(totalUnread);
    };

    fetchUnreadCountEU();
    // Refresh every 60 seconds
    const interval = setInterval(fetchUnreadCountEU, 60000);
    return () => clearInterval(interval);
  }, []);

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
    { href: '/crm', label: 'CRM 🇵🇱', icon: '👥', badge: unreadCount },
    { href: '/crm-eu', label: 'CRM 🇪🇺', icon: '👥', badge: unreadCountEU },
    { href: '/rank', label: 'RANK', icon: '📈' },
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
      (item.href === '/crm' && pathname === '/crm') ||
      (item.href === '/crm-eu' && pathname.startsWith('/crm-eu')) ||
      (item.href === '/rank' && pathname.startsWith('/rank')) ||
      (item.href === '/agent' && pathname.startsWith('/agent'));
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`relative flex-1 flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1 py-2 md:py-3 px-1 md:px-2 lg:px-3 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
          isActive
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        <span className="text-lg md:text-sm lg:text-base">{item.icon}</span>
        <span className="truncate max-w-[60px] md:max-w-none">{item.label}</span>
        {item.badge > 0 && (
          <span className="absolute top-1 right-1 md:static md:ml-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center bg-red-500 text-white text-[9px] md:text-[10px] font-medium rounded-full leading-none">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4">
        {/* Desktop: jedna linia */}
        <div className="hidden md:flex items-center justify-center">
          {navItems.map(renderNavItem)}
          <button
            onClick={toggleDarkMode}
            className="flex flex-row items-center justify-center gap-1 py-3 px-2 lg:px-3 text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors border-l border-gray-200 dark:border-gray-700"
            title={darkMode ? 'Tryb jasny' : 'Tryb ciemny'}
          >
            <span className="text-base">{darkMode ? '☀️' : '🌙'}</span>
            <span className="hidden xl:inline">{darkMode ? 'Jasny' : 'Ciemny'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex flex-row items-center justify-center gap-1 py-3 px-2 lg:px-3 text-xs lg:text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Wyloguj"
          >
            <span className="text-base">🚪</span>
            <span className="hidden lg:inline">Wyloguj</span>
          </button>
        </div>

        {/* Mobile/Tablet: dwie linie */}
        <div className="md:hidden">
          <div className="flex items-center border-b border-gray-100 dark:border-gray-700">
            {topRowItems.map(renderNavItem)}
          </div>
          <div className="flex items-center">
            {bottomRowItems.map(renderNavItem)}
            <button
              onClick={toggleDarkMode}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
              title={darkMode ? 'Tryb jasny' : 'Tryb ciemny'}
            >
              <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
              <span>{darkMode ? 'Jasny' : 'Ciemny'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
