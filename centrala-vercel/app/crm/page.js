'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CRMContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('wiadomosci');

  // Allegro Dobrelegowiska state
  const [allegroAuth, setAllegroAuth] = useState({ authenticated: false, user: null, loading: true });
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Allegro Meblebox state
  const [mebleboxAuth, setMebleboxAuth] = useState({ authenticated: false, user: null, loading: true });
  const [mebleboxThreads, setMebleboxThreads] = useState([]);
  const [mebleboxThreadsLoading, setMebleboxThreadsLoading] = useState(false);
  const [mebleboxSelectedThread, setMebleboxSelectedThread] = useState(null);
  const [mebleboxThreadMessages, setMebleboxThreadMessages] = useState([]);
  const [mebleboxMessagesLoading, setMebleboxMessagesLoading] = useState(false);
  const [mebleboxReplyText, setMebleboxReplyText] = useState('');
  const [mebleboxSending, setMebleboxSending] = useState(false);
  const [mebleboxSyncing, setMebleboxSyncing] = useState(false);
  const [mebleboxSyncStatus, setMebleboxSyncStatus] = useState(null);
  const [mebleboxUnreadCount, setMebleboxUnreadCount] = useState(0);

  // Gmail (Shopify Dobrelegowiska) state
  const [gmailAuth, setGmailAuth] = useState({ authenticated: false, user: null, loading: true });
  const [gmailThreads, setGmailThreads] = useState([]);
  const [gmailThreadsLoading, setGmailThreadsLoading] = useState(false);
  const [gmailSelectedThread, setGmailSelectedThread] = useState(null);
  const [gmailThreadMessages, setGmailThreadMessages] = useState([]);
  const [gmailMessagesLoading, setGmailMessagesLoading] = useState(false);
  const [gmailReplyText, setGmailReplyText] = useState('');
  const [gmailSending, setGmailSending] = useState(false);
  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [gmailSyncStatus, setGmailSyncStatus] = useState(null);
  const [gmailUnreadCount, setGmailUnreadCount] = useState(0);

  // Gmail POOMKIDS (Shopify POOMKIDS) state
  const [poomkidsAuth, setPoomkidsAuth] = useState({ authenticated: false, user: null, loading: true });
  const [poomkidsThreads, setPoomkidsThreads] = useState([]);
  const [poomkidsThreadsLoading, setPoomkidsThreadsLoading] = useState(false);
  const [poomkidsSelectedThread, setPoomkidsSelectedThread] = useState(null);
  const [poomkidsThreadMessages, setPoomkidsThreadMessages] = useState([]);
  const [poomkidsMessagesLoading, setPoomkidsMessagesLoading] = useState(false);
  const [poomkidsReplyText, setPoomkidsReplyText] = useState('');
  const [poomkidsSending, setPoomkidsSending] = useState(false);
  const [poomkidsSyncing, setPoomkidsSyncing] = useState(false);
  const [poomkidsSyncStatus, setPoomkidsSyncStatus] = useState(null);
  const [poomkidsUnreadCount, setPoomkidsUnreadCount] = useState(0);

  const tabs = [
    { key: 'wiadomosci', label: 'Allegro Dobrelegowiska', icon: 'https://a.allegroimg.com/original/12c30c/0d4b068640de9b0daf22af9d97c5', isImage: true, badge: unreadCount, color: 'orange' },
    { key: 'meblebox', label: 'Allegro Meblebox', icon: 'https://a.allegroimg.com/original/12c30c/0d4b068640de9b0daf22af9d97c5', isImage: true, badge: mebleboxUnreadCount, color: 'orange' },
    { key: 'shopify', label: 'Shopify Dobrelegowiska', icon: '/icons/dobrelegowiska.png', isImage: true, badge: gmailUnreadCount, color: 'green' },
    { key: 'poomkids', label: 'Shopify POOMKIDS', icon: '/icons/poomkids.png', isImage: true, badge: poomkidsUnreadCount, color: 'blue' },
  ];

  // Check for success/error from OAuth callback
  useEffect(() => {
    const success = searchParams.get('allegro_success');
    const error = searchParams.get('allegro_error');
    const mebleboxSuccess = searchParams.get('meblebox_success');
    const mebleboxError = searchParams.get('meblebox_error');
    const gmailSuccess = searchParams.get('gmail_success');
    const gmailError = searchParams.get('gmail_error');

    if (success) {
      alert('Pomyslnie polaczono z Allegro Dobrelegowiska!');
      window.history.replaceState({}, '', '/crm');
      checkAllegroAuth();
    }
    if (error) {
      alert(`Blad Allegro Dobrelegowiska: ${error}`);
      window.history.replaceState({}, '', '/crm');
    }
    if (mebleboxSuccess) {
      alert('Pomyslnie polaczono z Allegro Meblebox!');
      window.history.replaceState({}, '', '/crm');
      checkMebleboxAuth();
    }
    if (mebleboxError) {
      alert(`Blad Allegro Meblebox: ${mebleboxError}`);
      window.history.replaceState({}, '', '/crm');
    }
    if (gmailSuccess) {
      alert('Pomyslnie polaczono z Gmail!');
      window.history.replaceState({}, '', '/crm');
      checkGmailAuth();
    }
    if (gmailError) {
      alert(`Blad Gmail: ${gmailError}`);
      window.history.replaceState({}, '', '/crm');
    }

    // POOMKIDS Gmail callback
    const poomkidsGmailSuccess = searchParams.get('poomkids_gmail_success');
    const poomkidsGmailError = searchParams.get('poomkids_gmail_error');
    if (poomkidsGmailSuccess) {
      alert('Pomyslnie polaczono z Gmail POOMKIDS!');
      window.history.replaceState({}, '', '/crm');
      checkPoomkidsAuth();
    }
    if (poomkidsGmailError) {
      alert(`Blad Gmail POOMKIDS: ${poomkidsGmailError}`);
      window.history.replaceState({}, '', '/crm');
    }
  }, [searchParams]);

  // Check Allegro authentication status
  const checkAllegroAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/allegro/auth');
      const data = await res.json();
      setAllegroAuth({
        authenticated: data.authenticated,
        user: data.user,
        loading: false
      });

      if (data.authenticated) {
        fetchSyncStatus();
        fetchThreads();
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setAllegroAuth({ authenticated: false, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkAllegroAuth();
  }, [checkAllegroAuth]);

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/allegro/messages?action=status');
      const data = await res.json();
      if (data.success) {
        setSyncStatus(data.status);
        setUnreadCount(data.status.unreadCount || 0);
      }
    } catch (err) {
      console.error('Sync status error:', err);
    }
  };

  // Fetch threads
  const fetchThreads = async () => {
    setThreadsLoading(true);
    try {
      const res = await fetch('/api/allegro/messages');
      const data = await res.json();
      if (data.success) {
        setThreads(data.threads || []);
      }
    } catch (err) {
      console.error('Fetch threads error:', err);
    } finally {
      setThreadsLoading(false);
    }
  };

  // Sync messages from Allegro
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/allegro/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Zsynchronizowano ${data.synced.threads} watkow i ${data.synced.messages} wiadomosci`);
        fetchThreads();
        fetchSyncStatus();
      } else {
        alert('Blad synchronizacji: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Open thread
  const openThread = async (thread) => {
    setSelectedThread(thread);
    setMessagesLoading(true);
    setThreadMessages([]);

    try {
      // Fetch messages and thread data (includes order info)
      const res = await fetch(`/api/allegro/messages/${thread.id}?refresh=true`);
      const data = await res.json();
      if (data.success) {
        setThreadMessages(data.messages || []);
        // Update selected thread with order data from API
        if (data.thread) {
          setSelectedThread(data.thread);
        }
      }

      // Mark as read
      if (!thread.read) {
        await fetch(`/api/allegro/messages/${thread.id}`, { method: 'PUT' });
        fetchThreads();
        fetchSyncStatus();
      }
    } catch (err) {
      console.error('Open thread error:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;

    setSending(true);
    try {
      const res = await fetch(`/api/allegro/messages/${selectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setReplyText('');
        // Refresh messages
        const msgRes = await fetch(`/api/allegro/messages/${selectedThread.id}`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setThreadMessages(msgData.messages || []);
        }
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // ========== MEBLEBOX FUNCTIONS ==========

  // Check Meblebox authentication status
  const checkMebleboxAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/allegro-meblebox/auth');
      const data = await res.json();
      setMebleboxAuth({
        authenticated: data.authenticated,
        user: data.user,
        loading: false
      });

      if (data.authenticated) {
        fetchMebleboxSyncStatus();
        fetchMebleboxThreads();
      }
    } catch (err) {
      console.error('Meblebox auth check error:', err);
      setMebleboxAuth({ authenticated: false, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkMebleboxAuth();
  }, [checkMebleboxAuth]);

  // Fetch Meblebox sync status
  const fetchMebleboxSyncStatus = async () => {
    try {
      const res = await fetch('/api/allegro-meblebox/messages?action=status');
      const data = await res.json();
      if (data.success) {
        setMebleboxSyncStatus(data.status);
        setMebleboxUnreadCount(data.status.unreadCount || 0);
      }
    } catch (err) {
      console.error('Meblebox sync status error:', err);
    }
  };

  // Fetch Meblebox threads
  const fetchMebleboxThreads = async () => {
    setMebleboxThreadsLoading(true);
    try {
      const res = await fetch('/api/allegro-meblebox/messages');
      const data = await res.json();
      if (data.success) {
        setMebleboxThreads(data.threads || []);
      }
    } catch (err) {
      console.error('Fetch Meblebox threads error:', err);
    } finally {
      setMebleboxThreadsLoading(false);
    }
  };

  // Sync Meblebox messages
  const handleMebleboxSync = async () => {
    setMebleboxSyncing(true);
    try {
      const res = await fetch('/api/allegro-meblebox/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Meblebox: Zsynchronizowano ${data.synced.threads} watkow i ${data.synced.messages} wiadomosci`);
        fetchMebleboxThreads();
        fetchMebleboxSyncStatus();
      } else {
        alert('Blad synchronizacji Meblebox: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setMebleboxSyncing(false);
    }
  };

  // Open Meblebox thread
  const openMebleboxThread = async (thread) => {
    setMebleboxSelectedThread(thread);
    setMebleboxMessagesLoading(true);
    setMebleboxThreadMessages([]);

    try {
      const res = await fetch(`/api/allegro-meblebox/messages/${thread.id}?refresh=true`);
      const data = await res.json();
      if (data.success) {
        setMebleboxThreadMessages(data.messages || []);
        if (data.thread) {
          setMebleboxSelectedThread(data.thread);
        }
      }

      if (!thread.read) {
        await fetch(`/api/allegro-meblebox/messages/${thread.id}`, { method: 'PUT' });
        fetchMebleboxThreads();
        fetchMebleboxSyncStatus();
      }
    } catch (err) {
      console.error('Open Meblebox thread error:', err);
    } finally {
      setMebleboxMessagesLoading(false);
    }
  };

  // Send Meblebox reply
  const handleMebleboxSendReply = async () => {
    if (!mebleboxReplyText.trim() || !mebleboxSelectedThread) return;

    setMebleboxSending(true);
    try {
      const res = await fetch(`/api/allegro-meblebox/messages/${mebleboxSelectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: mebleboxReplyText.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setMebleboxReplyText('');
        const msgRes = await fetch(`/api/allegro-meblebox/messages/${mebleboxSelectedThread.id}`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setMebleboxThreadMessages(msgData.messages || []);
        }
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setMebleboxSending(false);
    }
  };

  // ========== GMAIL (Shopify Dobrelegowiska) FUNCTIONS ==========

  // Check Gmail authentication status
  const checkGmailAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/gmail/auth');
      const data = await res.json();
      setGmailAuth({
        authenticated: data.authenticated,
        user: data.user,
        loading: false
      });

      if (data.authenticated) {
        fetchGmailSyncStatus();
        fetchGmailThreads();
      }
    } catch (err) {
      console.error('Gmail auth check error:', err);
      setGmailAuth({ authenticated: false, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkGmailAuth();
  }, [checkGmailAuth]);

  // Fetch Gmail sync status
  const fetchGmailSyncStatus = async () => {
    try {
      const res = await fetch('/api/gmail/messages?action=status');
      const data = await res.json();
      if (data.success) {
        setGmailSyncStatus(data.status);
        setGmailUnreadCount(data.status.unreadCount || 0);
      }
    } catch (err) {
      console.error('Gmail sync status error:', err);
    }
  };

  // Fetch Gmail threads
  const fetchGmailThreads = async () => {
    setGmailThreadsLoading(true);
    try {
      const res = await fetch('/api/gmail/messages');
      const data = await res.json();
      if (data.success) {
        setGmailThreads(data.threads || []);
      }
    } catch (err) {
      console.error('Gmail threads error:', err);
    } finally {
      setGmailThreadsLoading(false);
    }
  };

  // Sync Gmail
  const handleGmailSync = async () => {
    setGmailSyncing(true);
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchGmailThreads();
        fetchGmailSyncStatus();
      } else {
        alert('Blad synchronizacji: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setGmailSyncing(false);
    }
  };

  // Open Gmail thread
  const openGmailThread = async (thread) => {
    setGmailSelectedThread(thread);
    setGmailMessagesLoading(true);
    setGmailThreadMessages([]);

    try {
      const res = await fetch(`/api/gmail/messages/${thread.id}?refresh=true`);
      const data = await res.json();

      if (data.success) {
        setGmailSelectedThread(data.thread);
        setGmailThreadMessages(data.messages || []);

        // Mark as read
        if (thread.unread) {
          fetch(`/api/gmail/messages/${thread.id}`, { method: 'PUT' });
          fetchGmailSyncStatus();
          fetchGmailThreads();
        }
      }
    } catch (err) {
      console.error('Gmail open thread error:', err);
    } finally {
      setGmailMessagesLoading(false);
    }
  };

  // Send Gmail reply
  const handleGmailSendReply = async () => {
    if (!gmailReplyText.trim() || !gmailSelectedThread) return;

    setGmailSending(true);
    try {
      const res = await fetch(`/api/gmail/messages/${gmailSelectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: gmailReplyText.trim(),
          to: gmailSelectedThread.from_email,
          subject: gmailSelectedThread.subject
        })
      });
      const data = await res.json();

      if (data.success) {
        setGmailReplyText('');
        const msgRes = await fetch(`/api/gmail/messages/${gmailSelectedThread.id}?refresh=true`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setGmailThreadMessages(msgData.messages || []);
        }
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setGmailSending(false);
    }
  };

  // ========== POOMKIDS GMAIL (Shopify POOMKIDS) FUNCTIONS ==========

  // Check POOMKIDS authentication status
  const checkPoomkidsAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/gmail-poomkids/auth');
      const data = await res.json();
      setPoomkidsAuth({
        authenticated: data.authenticated,
        user: data.user,
        loading: false
      });

      if (data.authenticated) {
        fetchPoomkidsSyncStatus();
        fetchPoomkidsThreads();
      }
    } catch (err) {
      console.error('POOMKIDS auth check error:', err);
      setPoomkidsAuth({ authenticated: false, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkPoomkidsAuth();
  }, [checkPoomkidsAuth]);

  // Fetch POOMKIDS sync status
  const fetchPoomkidsSyncStatus = async () => {
    try {
      const res = await fetch('/api/gmail-poomkids/messages?action=status');
      const data = await res.json();
      if (data.success) {
        setPoomkidsSyncStatus(data.status);
        setPoomkidsUnreadCount(data.status.unreadCount || 0);
      }
    } catch (err) {
      console.error('POOMKIDS sync status error:', err);
    }
  };

  // Fetch POOMKIDS threads
  const fetchPoomkidsThreads = async () => {
    setPoomkidsThreadsLoading(true);
    try {
      const res = await fetch('/api/gmail-poomkids/messages');
      const data = await res.json();
      if (data.success) {
        setPoomkidsThreads(data.threads || []);
      }
    } catch (err) {
      console.error('POOMKIDS threads error:', err);
    } finally {
      setPoomkidsThreadsLoading(false);
    }
  };

  // Sync POOMKIDS
  const handlePoomkidsSync = async () => {
    setPoomkidsSyncing(true);
    try {
      const res = await fetch('/api/gmail-poomkids/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchPoomkidsThreads();
        fetchPoomkidsSyncStatus();
      } else {
        alert('Blad synchronizacji: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setPoomkidsSyncing(false);
    }
  };

  // Open POOMKIDS thread
  const openPoomkidsThread = async (thread) => {
    setPoomkidsSelectedThread(thread);
    setPoomkidsMessagesLoading(true);
    setPoomkidsThreadMessages([]);

    try {
      const res = await fetch(`/api/gmail-poomkids/messages/${thread.id}?refresh=true`);
      const data = await res.json();

      if (data.success) {
        setPoomkidsSelectedThread(data.thread);
        setPoomkidsThreadMessages(data.messages || []);

        // Mark as read
        if (thread.unread) {
          fetch(`/api/gmail-poomkids/messages/${thread.id}`, { method: 'PUT' });
          fetchPoomkidsSyncStatus();
          fetchPoomkidsThreads();
        }
      }
    } catch (err) {
      console.error('POOMKIDS open thread error:', err);
    } finally {
      setPoomkidsMessagesLoading(false);
    }
  };

  // Send POOMKIDS reply
  const handlePoomkidsSendReply = async () => {
    if (!poomkidsReplyText.trim() || !poomkidsSelectedThread) return;

    setPoomkidsSending(true);
    try {
      const res = await fetch(`/api/gmail-poomkids/messages/${poomkidsSelectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: poomkidsReplyText.trim(),
          to: poomkidsSelectedThread.from_email,
          subject: poomkidsSelectedThread.subject
        })
      });
      const data = await res.json();

      if (data.success) {
        setPoomkidsReplyText('');
        const msgRes = await fetch(`/api/gmail-poomkids/messages/${poomkidsSelectedThread.id}?refresh=true`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setPoomkidsThreadMessages(msgData.messages || []);
        }
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setPoomkidsSending(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Teraz';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min temu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} godz. temu`;

    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">CRM</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Zarzadzanie klientami i wiadomosciami</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 mb-4">
          <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors whitespace-nowrap px-4 ${
                  activeTab === tab.key
                    ? 'border-b-2'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                style={activeTab === tab.key ? {
                  color: tab.color === 'orange' ? '#ea580c' : tab.color === 'green' ? '#16a34a' : tab.color === 'blue' ? '#2563eb' : undefined,
                  borderColor: tab.color === 'orange' ? '#ea580c' : tab.color === 'green' ? '#16a34a' : tab.color === 'blue' ? '#2563eb' : undefined,
                  backgroundColor: tab.color === 'orange' ? '#fff7ed' : tab.color === 'green' ? '#f0fdf4' : tab.color === 'blue' ? '#eff6ff' : undefined
                } : {}}
              >
                {tab.isImage ? (
                  <img src={tab.icon} alt={tab.label} className="w-5 h-5 rounded object-cover" />
                ) : (
                  <span>{tab.icon}</span>
                )}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
          {/* Wiadomości Allegro */}
          {activeTab === 'wiadomosci' && (
            <div>
              {allegroAuth.loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
              ) : !allegroAuth.authenticated ? (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">🔗</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Polacz z Allegro</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Aby zobaczyc wiadomosci, musisz polaczyc konto Allegro</p>
                  <a
                    href="/api/allegro/auth?action=login"
                    className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                  >
                    Zaloguj przez Allegro
                  </a>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-[800px]">
                  {/* Thread list */}
                  <div className={`lg:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedThread ? 'hidden lg:flex' : ''}`}>
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">Wiadomosci</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {syncStatus?.lastSyncAt ? `Sync: ${formatDate(syncStatus.lastSyncAt)}` : 'Nie zsynchronizowano'}
                        </p>
                      </div>
                      <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {syncing ? 'Sync...' : 'Synchronizuj'}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {threadsLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
                      ) : threads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        threads.map((thread) => (
                          <button
                            key={thread.id}
                            onClick={() => openThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              selectedThread?.id === thread.id ? 'bg-blue-50' : ''
                            } ${!thread.read ? 'bg-orange-50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              {thread.interlocutor_avatar ? (
                                <img
                                  src={thread.interlocutor_avatar}
                                  alt=""
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                                  {(thread.interlocutor_login || '?')[0].toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${!thread.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {thread.interlocutor_login || 'Nieznany'}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                                    {formatDate(thread.last_message_at)}
                                  </span>
                                </div>
                                {thread.offer_title && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{thread.offer_title}</p>
                                )}
                                <div className="flex items-center gap-1 mt-1">
                                  {!thread.read && (
                                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded">
                                      Nowa
                                    </span>
                                  )}
                                  {thread.apilo_order_id && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                      Zamowienie
                                    </span>
                                  )}
                                  {!thread.apilo_order_id && thread.offer_id && (
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                      Pytanie o oferte
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message view */}
                  <div className={`lg:w-2/3 flex flex-col ${!selectedThread ? 'hidden lg:flex' : ''}`}>
                    {!selectedThread ? (
                      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <div className="text-center">
                          <span className="text-6xl">💬</span>
                          <p className="mt-2">Wybierz watek z listy</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Thread header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 flex items-center gap-3">
                          <button
                            onClick={() => setSelectedThread(null)}
                            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            ← Wstecz
                          </button>
                          {selectedThread.interlocutor_avatar ? (
                            <img
                              src={selectedThread.interlocutor_avatar}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                              {(selectedThread.interlocutor_login || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {selectedThread.interlocutor_login || 'Nieznany'}
                            </h3>
                            {selectedThread.offer_title && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedThread.offer_title}</p>
                            )}
                          </div>
                          {selectedThread.apilo_order_id ? (
                            <a
                              href={`/zamowienia/${selectedThread.apilo_order_id}`}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Zamowienie #{selectedThread.apilo_order_id}
                            </a>
                          ) : selectedThread.offer_id && (
                            <a
                              href={`https://allegro.pl/oferta/${selectedThread.offer_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                            >
                              Zobacz oferte
                            </a>
                          )}
                        </div>

                        {/* Offer info panel - when no order but has offer */}
                        {!selectedThread.apilo_order_id && selectedThread.offer_id && (
                          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="text-xs text-orange-600 font-medium">Pytanie o oferte</span>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {selectedThread.offer_title || `ID: ${selectedThread.offer_id}`}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={`https://allegro.pl/oferta/${selectedThread.offer_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-orange-600 hover:text-orange-800 underline"
                              >
                                Zobacz na Allegro
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Order info panel */}
                        {selectedThread.apilo_order_id && (
                          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="text-xs text-blue-600 font-medium">Zamowienie</span>
                                  <p className="text-sm font-semibold text-gray-900">#{selectedThread.apilo_order_id}</p>
                                </div>
                                {selectedThread.order_total && (
                                  <div>
                                    <span className="text-xs text-blue-600 font-medium">Wartosc</span>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {parseFloat(selectedThread.order_total).toFixed(2)} {selectedThread.order_currency || 'PLN'}
                                    </p>
                                  </div>
                                )}
                                {selectedThread.order_date && (
                                  <div>
                                    <span className="text-xs text-blue-600 font-medium">Data</span>
                                    <p className="text-sm text-gray-900">
                                      {new Date(selectedThread.order_date).toLocaleDateString('pl-PL')}
                                    </p>
                                  </div>
                                )}
                                {selectedThread.order_payment_status && (
                                  <div>
                                    <span className={`px-2 py-0.5 text-xs rounded ${
                                      selectedThread.order_payment_status === 'PAID'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {selectedThread.order_payment_status === 'PAID' ? 'Oplacone' : 'Nieoplacone'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {selectedThread.order_customer && (
                                <div className="text-right">
                                  <span className="text-xs text-blue-600 font-medium">Klient</span>
                                  <p className="text-sm text-gray-900">{selectedThread.order_customer.name || '-'}</p>
                                </div>
                              )}
                            </div>
                            {selectedThread.order_items && selectedThread.order_items.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <span className="text-xs text-blue-600 font-medium">Produkty:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedThread.order_items.slice(0, 3).map((item, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-white text-xs text-gray-700 rounded border">
                                      {item.name?.substring(0, 30)}{item.name?.length > 30 ? '...' : ''} x{item.quantity}
                                    </span>
                                  ))}
                                  {selectedThread.order_items.length > 3 && (
                                    <span className="px-2 py-0.5 bg-white text-xs text-gray-500 rounded border">
                                      +{selectedThread.order_items.length - 3} wiecej
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                          {messagesLoading ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Ladowanie wiadomosci...</div>
                          ) : threadMessages.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Brak wiadomosci</div>
                          ) : (
                            threadMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.sender_is_interlocutor ? 'justify-start' : 'justify-end'}`}
                              >
                                <div
                                  className={`max-w-[75%] px-4 py-2 rounded-lg ${
                                    msg.sender_is_interlocutor
                                      ? 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                  <p className={`text-xs mt-1 ${
                                    msg.sender_is_interlocutor ? 'text-gray-400' : 'text-blue-200'
                                  }`}>
                                    {formatDate(msg.sent_at)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Reply input */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <div className="flex gap-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Napisz wiadomosc..."
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendReply();
                                }
                              }}
                            />
                            <button
                              onClick={handleSendReply}
                              disabled={sending || !replyText.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {sending ? '...' : 'Wyslij'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Allegro Meblebox */}
          {activeTab === 'meblebox' && (
            <div>
              {mebleboxAuth.loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
              ) : !mebleboxAuth.authenticated ? (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">🛋️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Polacz z Allegro Meblebox</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Aby zobaczyc wiadomosci, musisz polaczyc konto Allegro Meblebox</p>
                  <a
                    href="/api/allegro-meblebox/auth?action=login"
                    className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                  >
                    Zaloguj przez Allegro
                  </a>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-[800px]">
                  {/* Thread list */}
                  <div className={`lg:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${mebleboxSelectedThread ? 'hidden lg:flex' : ''}`}>
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">Wiadomosci</h2>
                        <p className="text-xs text-gray-500">
                          {mebleboxSyncStatus?.lastSyncAt ? `Sync: ${formatDate(mebleboxSyncStatus.lastSyncAt)}` : 'Nie zsynchronizowano'}
                        </p>
                      </div>
                      <button
                        onClick={handleMebleboxSync}
                        disabled={mebleboxSyncing}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {mebleboxSyncing ? 'Sync...' : 'Synchronizuj'}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {mebleboxThreadsLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
                      ) : mebleboxThreads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        mebleboxThreads.map((thread) => (
                          <button
                            key={thread.id}
                            onClick={() => openMebleboxThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              mebleboxSelectedThread?.id === thread.id ? 'bg-blue-50' : ''
                            } ${!thread.read ? 'bg-orange-50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              {thread.interlocutor_avatar ? (
                                <img
                                  src={thread.interlocutor_avatar}
                                  alt=""
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                                  {(thread.interlocutor_login || '?')[0].toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${!thread.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {thread.interlocutor_login || 'Nieznany'}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                                    {formatDate(thread.last_message_at)}
                                  </span>
                                </div>
                                {thread.offer_title && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{thread.offer_title}</p>
                                )}
                                <div className="flex items-center gap-1 mt-1">
                                  {!thread.read && (
                                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded">
                                      Nowa
                                    </span>
                                  )}
                                  {thread.apilo_order_id && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                      Zamowienie
                                    </span>
                                  )}
                                  {!thread.apilo_order_id && thread.offer_id && (
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                      Pytanie o oferte
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message view */}
                  <div className={`lg:w-2/3 flex flex-col ${!mebleboxSelectedThread ? 'hidden lg:flex' : ''}`}>
                    {!mebleboxSelectedThread ? (
                      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <div className="text-center">
                          <span className="text-6xl">💬</span>
                          <p className="mt-2">Wybierz watek z listy</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Thread header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 flex items-center gap-3">
                          <button
                            onClick={() => setMebleboxSelectedThread(null)}
                            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            ← Wstecz
                          </button>
                          {mebleboxSelectedThread.interlocutor_avatar ? (
                            <img
                              src={mebleboxSelectedThread.interlocutor_avatar}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                              {(mebleboxSelectedThread.interlocutor_login || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {mebleboxSelectedThread.interlocutor_login || 'Nieznany'}
                            </h3>
                            {mebleboxSelectedThread.offer_title && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{mebleboxSelectedThread.offer_title}</p>
                            )}
                          </div>
                          {mebleboxSelectedThread.apilo_order_id ? (
                            <a
                              href={`/zamowienia/${mebleboxSelectedThread.apilo_order_id}`}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Zamowienie #{mebleboxSelectedThread.apilo_order_id}
                            </a>
                          ) : mebleboxSelectedThread.offer_id && (
                            <a
                              href={`https://allegro.pl/oferta/${mebleboxSelectedThread.offer_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                            >
                              Zobacz oferte
                            </a>
                          )}
                        </div>

                        {/* Offer info panel - when no order but has offer */}
                        {!mebleboxSelectedThread.apilo_order_id && mebleboxSelectedThread.offer_id && (
                          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="text-xs text-orange-600 font-medium">Pytanie o oferte</span>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {mebleboxSelectedThread.offer_title || `ID: ${mebleboxSelectedThread.offer_id}`}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={`https://allegro.pl/oferta/${mebleboxSelectedThread.offer_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-orange-600 hover:text-orange-800 underline"
                              >
                                Zobacz na Allegro
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Order info panel */}
                        {mebleboxSelectedThread.apilo_order_id && (
                          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="text-xs text-blue-600 font-medium">Zamowienie</span>
                                  <p className="text-sm font-semibold text-gray-900">#{mebleboxSelectedThread.apilo_order_id}</p>
                                </div>
                                {mebleboxSelectedThread.order_total && (
                                  <div>
                                    <span className="text-xs text-blue-600 font-medium">Wartosc</span>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {parseFloat(mebleboxSelectedThread.order_total).toFixed(2)} {mebleboxSelectedThread.order_currency || 'PLN'}
                                    </p>
                                  </div>
                                )}
                                {mebleboxSelectedThread.order_date && (
                                  <div>
                                    <span className="text-xs text-blue-600 font-medium">Data</span>
                                    <p className="text-sm text-gray-900">
                                      {new Date(mebleboxSelectedThread.order_date).toLocaleDateString('pl-PL')}
                                    </p>
                                  </div>
                                )}
                                {mebleboxSelectedThread.order_payment_status && (
                                  <div>
                                    <span className={`px-2 py-0.5 text-xs rounded ${
                                      mebleboxSelectedThread.order_payment_status === 'PAID'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {mebleboxSelectedThread.order_payment_status === 'PAID' ? 'Oplacone' : 'Nieoplacone'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {mebleboxSelectedThread.order_customer && (
                                <div className="text-right">
                                  <span className="text-xs text-blue-600 font-medium">Klient</span>
                                  <p className="text-sm text-gray-900">{mebleboxSelectedThread.order_customer.name || '-'}</p>
                                </div>
                              )}
                            </div>
                            {mebleboxSelectedThread.order_items && mebleboxSelectedThread.order_items.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <span className="text-xs text-blue-600 font-medium">Produkty:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {mebleboxSelectedThread.order_items.slice(0, 3).map((item, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-white text-xs text-gray-700 rounded border">
                                      {item.name?.substring(0, 30)}{item.name?.length > 30 ? '...' : ''} x{item.quantity}
                                    </span>
                                  ))}
                                  {mebleboxSelectedThread.order_items.length > 3 && (
                                    <span className="px-2 py-0.5 bg-white text-xs text-gray-500 rounded border">
                                      +{mebleboxSelectedThread.order_items.length - 3} wiecej
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                          {mebleboxMessagesLoading ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Ladowanie wiadomosci...</div>
                          ) : mebleboxThreadMessages.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Brak wiadomosci</div>
                          ) : (
                            mebleboxThreadMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.sender_is_interlocutor ? 'justify-start' : 'justify-end'}`}
                              >
                                <div
                                  className={`max-w-[75%] px-4 py-2 rounded-lg ${
                                    msg.sender_is_interlocutor
                                      ? 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                  <p className={`text-xs mt-1 ${
                                    msg.sender_is_interlocutor ? 'text-gray-400' : 'text-blue-200'
                                  }`}>
                                    {formatDate(msg.sent_at)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Reply input */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <div className="flex gap-2">
                            <textarea
                              value={mebleboxReplyText}
                              onChange={(e) => setMebleboxReplyText(e.target.value)}
                              placeholder="Napisz wiadomosc..."
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleMebleboxSendReply();
                                }
                              }}
                            />
                            <button
                              onClick={handleMebleboxSendReply}
                              disabled={mebleboxSending || !mebleboxReplyText.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {mebleboxSending ? '...' : 'Wyslij'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shopify Dobrelegowiska (Gmail) */}
          {activeTab === 'shopify' && (
            <div>
              {gmailAuth.loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
              ) : !gmailAuth.authenticated ? (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">📧</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Polacz z Gmail</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Aby zobaczyc wiadomosci, musisz polaczyc konto Gmail</p>
                  <a
                    href="/api/gmail/auth?action=login"
                    className="inline-block px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                  >
                    Zaloguj przez Google
                  </a>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-[800px]">
                  {/* Thread list */}
                  <div className={`lg:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${gmailSelectedThread ? 'hidden lg:flex' : ''}`}>
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">Wiadomosci Email</h2>
                        <p className="text-xs text-gray-500">
                          {gmailSyncStatus?.lastSyncAt ? `Sync: ${formatDate(gmailSyncStatus.lastSyncAt)}` : 'Nie zsynchronizowano'}
                        </p>
                      </div>
                      <button
                        onClick={handleGmailSync}
                        disabled={gmailSyncing}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {gmailSyncing ? 'Sync...' : 'Synchronizuj'}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {gmailThreadsLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
                      ) : gmailThreads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        gmailThreads.map((thread) => (
                          <button
                            key={thread.id}
                            onClick={() => openGmailThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              gmailSelectedThread?.id === thread.id ? 'bg-blue-50' : ''
                            } ${thread.unread ? 'bg-red-50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                                {(thread.from_name || thread.from_email || '?')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${thread.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {thread.from_name || thread.from_email || 'Nieznany'}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                                    {formatDate(thread.last_message_at)}
                                  </span>
                                </div>
                                <p className={`text-sm truncate ${thread.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                  {thread.subject || '(Brak tematu)'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{thread.snippet}</p>
                                {thread.unread && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded">
                                    Nowa
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message view */}
                  <div className={`lg:w-2/3 flex flex-col ${!gmailSelectedThread ? 'hidden lg:flex' : ''}`}>
                    {!gmailSelectedThread ? (
                      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <div className="text-center">
                          <span className="text-6xl">📧</span>
                          <p className="mt-2">Wybierz watek z listy</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Thread header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => setGmailSelectedThread(null)}
                            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
                          >
                            ← Wstecz
                          </button>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                              {(gmailSelectedThread.from_name || gmailSelectedThread.from_email || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {gmailSelectedThread.from_name || gmailSelectedThread.from_email || 'Nieznany'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{gmailSelectedThread.from_email}</p>
                            </div>
                          </div>
                          <h4 className="mt-2 font-medium text-gray-800 dark:text-gray-200">
                            {gmailSelectedThread.subject || '(Brak tematu)'}
                          </h4>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                          {gmailMessagesLoading ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Ladowanie wiadomosci...</div>
                          ) : gmailThreadMessages.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Brak wiadomosci</div>
                          ) : (
                            gmailThreadMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.is_outgoing ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] px-4 py-3 rounded-lg ${
                                    msg.is_outgoing
                                      ? 'bg-red-600 text-white'
                                      : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                  }`}
                                >
                                  <div className={`text-xs mb-1 ${msg.is_outgoing ? 'text-red-200' : 'text-gray-500'}`}>
                                    {msg.from_name || msg.from_email}
                                  </div>
                                  <div className="whitespace-pre-wrap break-words text-sm">
                                    {msg.body_text || '(Brak tresci tekstowej)'}
                                  </div>
                                  <p className={`text-xs mt-2 ${msg.is_outgoing ? 'text-red-200' : 'text-gray-400'}`}>
                                    {formatDate(msg.sent_at)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Reply input */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <div className="flex gap-2">
                            <textarea
                              value={gmailReplyText}
                              onChange={(e) => setGmailReplyText(e.target.value)}
                              placeholder="Napisz odpowiedz..."
                              rows={3}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleGmailSendReply();
                                }
                              }}
                            />
                            <button
                              onClick={handleGmailSendReply}
                              disabled={gmailSending || !gmailReplyText.trim()}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              {gmailSending ? '...' : 'Wyslij'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shopify POOMKIDS (Gmail) */}
          {activeTab === 'poomkids' && (
            <div>
              {poomkidsAuth.loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
              ) : !poomkidsAuth.authenticated ? (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">📧</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Polacz z Gmail POOMKIDS</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Aby zobaczyc wiadomosci, musisz polaczyc konto poomkids.kontakt@gmail.com</p>
                  <a
                    href="/api/gmail-poomkids/auth?action=login"
                    className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                  >
                    Zaloguj przez Google
                  </a>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-[800px]">
                  {/* Thread list */}
                  <div className={`lg:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${poomkidsSelectedThread ? 'hidden lg:flex' : ''}`}>
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">Wiadomosci Email</h2>
                        <p className="text-xs text-gray-500">
                          {poomkidsSyncStatus?.lastSyncAt ? `Sync: ${formatDate(poomkidsSyncStatus.lastSyncAt)}` : 'Nie zsynchronizowano'}
                        </p>
                      </div>
                      <button
                        onClick={handlePoomkidsSync}
                        disabled={poomkidsSyncing}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {poomkidsSyncing ? 'Sync...' : 'Synchronizuj'}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {poomkidsThreadsLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
                      ) : poomkidsThreads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        poomkidsThreads.map((thread) => (
                          <button
                            key={thread.id}
                            onClick={() => openPoomkidsThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              poomkidsSelectedThread?.id === thread.id ? 'bg-blue-50' : ''
                            } ${thread.unread ? 'bg-green-50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
                                {(thread.from_name || thread.from_email || '?')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${thread.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {thread.from_name || thread.from_email || 'Nieznany'}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                                    {formatDate(thread.last_message_at)}
                                  </span>
                                </div>
                                <p className={`text-sm truncate ${thread.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                  {thread.subject || '(Brak tematu)'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{thread.snippet}</p>
                                {thread.unread && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                                    Nowa
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message view */}
                  <div className={`lg:w-2/3 flex flex-col ${!poomkidsSelectedThread ? 'hidden lg:flex' : ''}`}>
                    {!poomkidsSelectedThread ? (
                      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <div className="text-center">
                          <span className="text-6xl">📧</span>
                          <p className="mt-2">Wybierz watek z listy</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Thread header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => setPoomkidsSelectedThread(null)}
                            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
                          >
                            ← Wstecz
                          </button>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
                              {(poomkidsSelectedThread.from_name || poomkidsSelectedThread.from_email || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {poomkidsSelectedThread.from_name || poomkidsSelectedThread.from_email || 'Nieznany'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{poomkidsSelectedThread.from_email}</p>
                            </div>
                          </div>
                          <h4 className="mt-2 font-medium text-gray-800 dark:text-gray-200">
                            {poomkidsSelectedThread.subject || '(Brak tematu)'}
                          </h4>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                          {poomkidsMessagesLoading ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Ladowanie wiadomosci...</div>
                          ) : poomkidsThreadMessages.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Brak wiadomosci</div>
                          ) : (
                            poomkidsThreadMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.is_outgoing ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] px-4 py-3 rounded-lg ${
                                    msg.is_outgoing
                                      ? 'bg-green-600 text-white'
                                      : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                  }`}
                                >
                                  <div className={`text-xs mb-1 ${msg.is_outgoing ? 'text-green-200' : 'text-gray-500'}`}>
                                    {msg.from_name || msg.from_email}
                                  </div>
                                  <div className="whitespace-pre-wrap break-words text-sm">
                                    {msg.body_text || '(Brak tresci tekstowej)'}
                                  </div>
                                  <p className={`text-xs mt-2 ${msg.is_outgoing ? 'text-green-200' : 'text-gray-400'}`}>
                                    {formatDate(msg.sent_at)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Reply input */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <div className="flex gap-2">
                            <textarea
                              value={poomkidsReplyText}
                              onChange={(e) => setPoomkidsReplyText(e.target.value)}
                              placeholder="Napisz odpowiedz..."
                              rows={3}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handlePoomkidsSendReply();
                                }
                              }}
                            />
                            <button
                              onClick={handlePoomkidsSendReply}
                              disabled={poomkidsSending || !poomkidsReplyText.trim()}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {poomkidsSending ? '...' : 'Wyslij'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CRMPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white">Ladowanie...</div>}>
      <CRMContent />
    </Suspense>
  );
}
