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
  const [userPermissions, setUserPermissions] = useState([]);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [deniedModule, setDeniedModule] = useState('');
  const { darkMode, toggleDarkMode } = useTheme();

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.user?.permissions) {
          setUserPermissions(data.user.permissions);
        }
      } catch (err) {
        // Silently ignore
      }
    };
    fetchPermissions();
  }, []);

  // Fetch unread messages count for CRM PL (Allegro Dobrelegowiska + Meblebox + Shopify)
  useEffect(() => {
    const fetchUnreadCount = async () => {
      let totalUnread = 0;

      // Allegro Dobrelegowiska
      try {
        const res = await fetch('/api/allegro/messages?action=status');
        const data = await res.json();
        if (data.success && data.status?.unreadCount) {
          totalUnread += data.status.unreadCount;
        }
      } catch (err) {
        // Silently ignore
      }

      // Allegro Meblebox
      try {
        const res = await fetch('/api/allegro-meblebox/messages?action=status');
        const data = await res.json();
        if (data.success && data.status?.unreadCount) {
          totalUnread += data.status.unreadCount;
        }
      } catch (err) {
        // Silently ignore
      }

      // Shopify Dobrelegowiska (Gmail)
      try {
        const res = await fetch('/api/gmail/messages');
        const data = await res.json();
        if (data.success && data.threads) {
          totalUnread += data.threads.filter(t => t.unread).length;
        }
      } catch (err) {
        // Silently ignore
      }

      // Shopify POOMKIDS (Gmail)
      try {
        const res = await fetch('/api/gmail-poomkids/messages');
        const data = await res.json();
        if (data.success && data.threads) {
          totalUnread += data.threads.filter(t => t.unread).length;
        }
      } catch (err) {
        // Silently ignore
      }

      // Allepoduszki (Gmail)
      try {
        const res = await fetch('/api/gmail-allepoduszki/messages');
        const data = await res.json();
        if (data.success && data.threads) {
          totalUnread += data.threads.filter(t => t.unread).length;
        }
      } catch (err) {
        // Silently ignore
      }

      // poom-furniture (Gmail)
      try {
        const res = await fetch('/api/gmail-poomfurniture/messages');
        const data = await res.json();
        if (data.success && data.threads) {
          totalUnread += data.threads.filter(t => t.unread).length;
        }
      } catch (err) {
        // Silently ignore
      }

      setUnreadCount(totalUnread);
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
    { href: '/', label: 'Dashboard', icon: '📊', permission: 'dashboard' },
    { href: '/zamowienia', label: 'OMS', icon: '📦', permission: 'oms' },
    { href: '/magazyny', label: 'WMS', icon: '🏭', permission: 'wms' },
    { href: '/mes', label: 'MES', icon: '⚙️', permission: 'mes' },
    { href: '/mts', label: 'MTS', icon: '📋', permission: 'mts' },
    { href: '/dms', label: 'DMS', icon: '📄', permission: 'dms' },
    { href: '/ecom', label: 'ECOM', icon: '🖥️', permission: 'ecom' },
    { href: '/crm', label: 'CRM 🇵🇱', icon: '👥', badge: unreadCount, permission: 'crm' },
    { href: '/crm-eu', label: 'CRM 🇪🇺', icon: '👥', badge: unreadCountEU, permission: 'crm-eu' },
    { href: '/rank', label: 'RANK', icon: '📈', permission: 'rank' },
    { href: '/agent', label: 'Asystent AI', icon: '🤖', permission: 'agent' },
  ];

  // Check if user has permission for a module
  const hasPermission = (permission) => {
    if (!userPermissions.length) return true; // Loading state - allow all
    return userPermissions.includes(permission);
  };

  // Handle click on restricted module
  const handleRestrictedClick = (e, item) => {
    if (!hasPermission(item.permission)) {
      e.preventDefault();
      setDeniedModule(item.label);
      setShowAccessDenied(true);
    }
  };

  // Podziel na 2 linie na mobile
  const topRowItems = navItems.slice(0, 5); // Dashboard, Zamowienia, Magazyny, MES, MTS
  const bottomRowItems = navItems.slice(5);  // DMS, CRM, Agent AI

  const renderNavItem = (item) => {
    const isActive = pathname === item.href ||
      (item.href === '/zamowienia' && pathname.startsWith('/zamowienia')) ||
      (item.href === '/magazyny' && pathname.startsWith('/magazyny')) ||
      (item.href === '/mes' && pathname.startsWith('/mes')) ||
      (item.href === '/mts' && pathname.startsWith('/mts')) ||
      (item.href === '/dms' && pathname.startsWith('/dms')) ||
      (item.href === '/ecom' && pathname.startsWith('/ecom')) ||
      (item.href === '/crm' && pathname === '/crm') ||
      (item.href === '/crm-eu' && pathname.startsWith('/crm-eu')) ||
      (item.href === '/rank' && pathname.startsWith('/rank')) ||
      (item.href === '/agent' && pathname.startsWith('/agent'));

    const permitted = hasPermission(item.permission);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={(e) => handleRestrictedClick(e, item)}
        className={`relative flex-1 flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1 py-2 md:py-3 px-1 md:px-3 lg:px-5 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
          !permitted
            ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 cursor-not-allowed'
            : isActive
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        <span className="text-lg md:text-sm lg:text-base">{item.icon}</span>
        <span className="truncate max-w-[60px] md:max-w-none">{item.label}</span>
        {!permitted && (
          <span className="absolute top-0.5 right-0.5 md:static md:ml-1 text-red-500 dark:text-red-400 text-xs">🔒</span>
        )}
        {permitted && item.badge > 0 && (
          <span className="absolute top-1 right-1 md:static md:ml-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center bg-red-500 text-white text-[9px] md:text-[10px] font-medium rounded-full leading-none">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  // Hide navigation on login page
  if (pathname === '/login') {
    return null;
  }

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

      {/* Access Denied Modal */}
      {showAccessDenied && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowAccessDenied(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Brak dostepu</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Modul: {deniedModule}</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Nie masz uprawnien do tego modulu. Skontaktuj sie z administratorem, aby uzyskac dostep.
            </p>
            <button
              onClick={() => setShowAccessDenied(false)}
              className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
