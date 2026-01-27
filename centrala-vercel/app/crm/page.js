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
  const [allegroSearch, setAllegroSearch] = useState('');
  const [allegroSelectedThreads, setAllegroSelectedThreads] = useState([]);
  const [allegroDeletingThreads, setAllegroDeletingThreads] = useState(false);

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
  const [mebleboxSearch, setMebleboxSearch] = useState('');
  const [mebleboxSelectedThreads, setMebleboxSelectedThreads] = useState([]);
  const [mebleboxDeletingThreads, setMebleboxDeletingThreads] = useState(false);

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
  const [gmailAttachments, setGmailAttachments] = useState([]);
  const [gmailSelectedMessages, setGmailSelectedMessages] = useState([]);
  const [gmailDeleting, setGmailDeleting] = useState(false);
  const [gmailFilter, setGmailFilter] = useState('all'); // all, new, read, resolved
  const [gmailSearch, setGmailSearch] = useState('');
  const [gmailSelectedThreads, setGmailSelectedThreads] = useState([]);
  const [gmailDeletingThreads, setGmailDeletingThreads] = useState(false);
  const [gmailComposeMode, setGmailComposeMode] = useState(false);
  const [gmailComposeTo, setGmailComposeTo] = useState('');
  const [gmailComposeSubject, setGmailComposeSubject] = useState('');
  const [gmailComposeBody, setGmailComposeBody] = useState('');
  const [gmailComposeAttachments, setGmailComposeAttachments] = useState([]);

  // Status dropdown state (shared across all modules - only one can be open)
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null); // { module: 'gmail', threadId: '123' }

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
  const [poomkidsAttachments, setPoomkidsAttachments] = useState([]);
  const [poomkidsSelectedMessages, setPoomkidsSelectedMessages] = useState([]);
  const [poomkidsDeleting, setPoomkidsDeleting] = useState(false);
  const [poomkidsFilter, setPoomkidsFilter] = useState('all'); // all, new, read, resolved
  const [poomkidsSearch, setPoomkidsSearch] = useState('');
  const [poomkidsSelectedThreads, setPoomkidsSelectedThreads] = useState([]);
  const [poomkidsDeletingThreads, setPoomkidsDeletingThreads] = useState(false);
  const [poomkidsComposeMode, setPoomkidsComposeMode] = useState(false);
  const [poomkidsComposeTo, setPoomkidsComposeTo] = useState('');
  const [poomkidsComposeSubject, setPoomkidsComposeSubject] = useState('');
  const [poomkidsComposeBody, setPoomkidsComposeBody] = useState('');
  const [poomkidsComposeAttachments, setPoomkidsComposeAttachments] = useState([]);

  // Gmail Allepoduszki (Shopify Allepoduszki) state
  const [allepoduszkiAuth, setAllepoduszkiAuth] = useState({ authenticated: false, user: null, loading: true });
  const [allepoduszkiThreads, setAllepoduszkiThreads] = useState([]);
  const [allepoduszkiThreadsLoading, setAllepoduszkiThreadsLoading] = useState(false);
  const [allepoduszkiSelectedThread, setAllepoduszkiSelectedThread] = useState(null);
  const [allepoduszkiThreadMessages, setAllepoduszkiThreadMessages] = useState([]);
  const [allepoduszkiMessagesLoading, setAllepoduszkiMessagesLoading] = useState(false);
  const [allepoduszkiReplyText, setAllepoduszkiReplyText] = useState('');
  const [allepoduszkiSending, setAllepoduszkiSending] = useState(false);
  const [allepoduszkiSyncing, setAllepoduszkiSyncing] = useState(false);
  const [allepoduszkiSyncStatus, setAllepoduszkiSyncStatus] = useState(null);
  const [allepoduszkiUnreadCount, setAllepoduszkiUnreadCount] = useState(0);
  const [allepoduszkiAttachments, setAllepoduszkiAttachments] = useState([]);
  const [allepoduszkiSelectedMessages, setAllepoduszkiSelectedMessages] = useState([]);
  const [allepoduszkiDeleting, setAllepoduszkiDeleting] = useState(false);
  const [allepoduszkiFilter, setAllepoduszkiFilter] = useState('all'); // all, new, read, resolved
  const [allepoduszkiSearch, setAllepoduszkiSearch] = useState('');
  const [allepoduszkiSelectedThreads, setAllepoduszkiSelectedThreads] = useState([]);
  const [allepoduszkiDeletingThreads, setAllepoduszkiDeletingThreads] = useState(false);
  const [allepoduszkiComposeMode, setAllepoduszkiComposeMode] = useState(false);
  const [allepoduszkiComposeTo, setAllepoduszkiComposeTo] = useState('');
  const [allepoduszkiComposeSubject, setAllepoduszkiComposeSubject] = useState('');
  const [allepoduszkiComposeBody, setAllepoduszkiComposeBody] = useState('');
  const [allepoduszkiComposeAttachments, setAllepoduszkiComposeAttachments] = useState([]);

  // Gmail Poomfurniture (Shopify poom-furniture.com) state
  const [poomfurnitureAuth, setPoomfurnitureAuth] = useState({ authenticated: false, user: null, loading: true });
  const [poomfurnitureThreads, setPoomfurnitureThreads] = useState([]);
  const [poomfurnitureThreadsLoading, setPoomfurnitureThreadsLoading] = useState(false);
  const [poomfurnitureSelectedThread, setPoomfurnitureSelectedThread] = useState(null);
  const [poomfurnitureThreadMessages, setPoomfurnitureThreadMessages] = useState([]);
  const [poomfurnitureMessagesLoading, setPoomfurnitureMessagesLoading] = useState(false);
  const [poomfurnitureReplyText, setPoomfurnitureReplyText] = useState('');
  const [poomfurnitureSending, setPoomfurnitureSending] = useState(false);
  const [poomfurnitureSyncing, setPoomfurnitureSyncing] = useState(false);
  const [poomfurnitureSyncStatus, setPoomfurnitureSyncStatus] = useState(null);
  const [poomfurnitureUnreadCount, setPoomfurnitureUnreadCount] = useState(0);
  const [poomfurnitureAttachments, setPoomfurnitureAttachments] = useState([]);
  const [poomfurnitureSelectedMessages, setPoomfurnitureSelectedMessages] = useState([]);
  const [poomfurnitureDeleting, setPoomfurnitureDeleting] = useState(false);
  const [poomfurnitureFilter, setPoomfurnitureFilter] = useState('all'); // all, new, read, resolved
  const [poomfurnitureSearch, setPoomfurnitureSearch] = useState('');
  const [poomfurnitureSelectedThreads, setPoomfurnitureSelectedThreads] = useState([]);
  const [poomfurnitureDeletingThreads, setPoomfurnitureDeletingThreads] = useState(false);
  const [poomfurnitureComposeMode, setPoomfurnitureComposeMode] = useState(false);
  const [poomfurnitureComposeTo, setPoomfurnitureComposeTo] = useState('');
  const [poomfurnitureComposeSubject, setPoomfurnitureComposeSubject] = useState('');
  const [poomfurnitureComposeBody, setPoomfurnitureComposeBody] = useState('');
  const [poomfurnitureComposeAttachments, setPoomfurnitureComposeAttachments] = useState([]);

  const tabs = [
    { key: 'wiadomosci', label: 'Allegro Dobrelegowiska', icon: 'https://a.allegroimg.com/original/12c30c/0d4b068640de9b0daf22af9d97c5', overlayIcon: '/icons/dobrelegowiska.png', isImage: true, badge: unreadCount, color: 'orange', isConnected: allegroAuth.authenticated, isLoading: allegroAuth.loading },
    { key: 'meblebox', label: 'Allegro Meblebox', icon: 'https://a.allegroimg.com/original/12c30c/0d4b068640de9b0daf22af9d97c5', isImage: true, badge: mebleboxUnreadCount, color: 'orange', isConnected: mebleboxAuth.authenticated, isLoading: mebleboxAuth.loading },
    { key: 'shopify', label: 'Shopify Dobrelegowiska', icon: '/icons/dobrelegowiska.png', isImage: true, badge: gmailUnreadCount, color: 'green', isConnected: gmailAuth.authenticated, isLoading: gmailAuth.loading },
    { key: 'poomkids', label: 'Shopify POOMKIDS', icon: '/icons/poomkids.png', isImage: true, badge: poomkidsUnreadCount, color: 'blue', isConnected: poomkidsAuth.authenticated, isLoading: poomkidsAuth.loading },
    { key: 'allepoduszki', label: 'Shopify Allepoduszki', icon: '/icons/allepoduszki.png', isImage: true, badge: allepoduszkiUnreadCount, color: 'purple', isConnected: allepoduszkiAuth.authenticated, isLoading: allepoduszkiAuth.loading },
    { key: 'poomfurniture', label: 'Shopify poom-furniture.com', icon: '/icons/poom-furniture.png', isImage: true, badge: poomfurnitureUnreadCount, color: 'teal', isConnected: poomfurnitureAuth.authenticated, isLoading: poomfurnitureAuth.loading },
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
      window.history.replaceState({}, '', '/crm');2
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

    // ALLEPODUSZKI Gmail callback
    const allepoduszkiGmailSuccess = searchParams.get('allepoduszki_gmail_success');
    const allepoduszkiGmailError = searchParams.get('allepoduszki_gmail_error');
    if (allepoduszkiGmailSuccess) {
      alert('Pomyslnie polaczono z Gmail Allepoduszki!');
      window.history.replaceState({}, '', '/crm');
      checkAllepoduszkiAuth();
    }
    if (allepoduszkiGmailError) {
      alert(`Blad Gmail Allepoduszki: ${allepoduszkiGmailError}`);
      window.history.replaceState({}, '', '/crm');
    }

    // POOMFURNITURE Gmail callback
    const poomfurnitureGmailSuccess = searchParams.get('poomfurniture_gmail_success');
    const poomfurnitureGmailError = searchParams.get('poomfurniture_gmail_error');
    if (poomfurnitureGmailSuccess) {
      alert('Pomyslnie polaczono z Gmail poom-furniture.com!');
      window.history.replaceState({}, '', '/crm');
      checkPoomfurnitureAuth();
    }
    if (poomfurnitureGmailError) {
      alert(`Blad Gmail poom-furniture.com: ${poomfurnitureGmailError}`);
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

  // Toggle Allegro thread selection for deletion
  const toggleAllegroThreadSelection = (e, threadId) => {
    e.stopPropagation();
    setAllegroSelectedThreads(prev => prev.includes(threadId) ? prev.filter(id => id !== threadId) : [...prev, threadId]);
  };

  // Delete selected Allegro threads
  const handleAllegroDeleteThreads = async () => {
    if (allegroSelectedThreads.length === 0) return;
    if (!confirm(`Usunac ${allegroSelectedThreads.length} watek(ow)?`)) return;

    setAllegroDeletingThreads(true);
    try {
      const res = await fetch('/api/allegro/threads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadIds: allegroSelectedThreads })
      });
      const data = await res.json();

      if (data.success) {
        // Remove deleted threads from state
        setThreads(prev => prev.filter(t => !allegroSelectedThreads.includes(t.id)));
        // Clear selection
        setAllegroSelectedThreads([]);
        // If currently selected thread was deleted, clear it
        if (selectedThread && allegroSelectedThreads.includes(selectedThread.id)) {
          setSelectedThread(null);
          setThreadMessages([]);
        }
      } else {
        alert('Blad usuwania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setAllegroDeletingThreads(false);
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

  // Toggle Meblebox thread selection for deletion
  const toggleMebleboxThreadSelection = (e, threadId) => {
    e.stopPropagation();
    setMebleboxSelectedThreads(prev => prev.includes(threadId) ? prev.filter(id => id !== threadId) : [...prev, threadId]);
  };

  // Delete selected Meblebox threads
  const handleMebleboxDeleteThreads = async () => {
    if (mebleboxSelectedThreads.length === 0) return;
    if (!confirm(`Usunac ${mebleboxSelectedThreads.length} watek(ow)?`)) return;

    setMebleboxDeletingThreads(true);
    try {
      const res = await fetch('/api/allegro-meblebox/threads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadIds: mebleboxSelectedThreads })
      });
      const data = await res.json();

      if (data.success) {
        // Remove deleted threads from state
        setMebleboxThreads(prev => prev.filter(t => !mebleboxSelectedThreads.includes(t.id)));
        // Clear selection
        setMebleboxSelectedThreads([]);
        // If currently selected thread was deleted, clear it
        if (mebleboxSelectedThread && mebleboxSelectedThreads.includes(mebleboxSelectedThread.id)) {
          setMebleboxSelectedThread(null);
          setMebleboxThreadMessages([]);
        }
      } else {
        alert('Blad usuwania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setMebleboxDeletingThreads(false);
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

  // Logout Gmail
  const handleGmailLogout = async () => {
    if (!confirm('Czy na pewno chcesz sie wylogowac z Gmail Dobrelegowiska?')) return;
    try {
      const res = await fetch('/api/gmail/auth', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setGmailAuth({ authenticated: false, user: null, loading: false });
        setGmailThreads([]);
        setGmailSelectedThread(null);
        setGmailThreadMessages([]);
        setGmailSyncStatus(null);
        setGmailUnreadCount(0);
      } else {
        alert('Blad wylogowania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  // Clear Gmail history
  const handleGmailClearHistory = async () => {
    if (!confirm('Czy na pewno chcesz usunac cala historie wiadomosci? Ta operacja jest nieodwracalna.')) return;
    try {
      const res = await fetch('/api/gmail/auth?action=clear-history', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setGmailThreads([]);
        setGmailSelectedThread(null);
        setGmailThreadMessages([]);
        setGmailUnreadCount(0);
        alert('Historia zostala wyczyszczona');
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  // Open Gmail thread
  const openGmailThread = async (thread) => {
    setGmailSelectedThread(thread);
    setGmailMessagesLoading(true);
    setGmailSelectedMessages([]);

    try {
      // Load from DB first (fast), no refresh=true
      const res = await fetch(`/api/gmail/messages/${thread.id}`);
      const data = await res.json();

      if (data.success) {
        setGmailSelectedThread(data.thread);
        setGmailThreadMessages(data.messages || []);

        // Mark as read in background (non-blocking)
        if (thread.unread || thread.status === 'new') {
          // Update local state immediately for instant feedback
          setGmailThreads(prev => prev.map(t =>
            t.id === thread.id ? { ...t, unread: false, status: thread.status === 'new' ? 'read' : t.status } : t
          ));
          setGmailUnreadCount(prev => Math.max(0, prev - 1));

          // Background API calls - fire and forget
          fetch(`/api/gmail/messages/${thread.id}`, { method: 'PUT' }).catch(() => {});
          if (thread.status === 'new' || !thread.status) {
            fetch(`/api/gmail/messages/${thread.id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'read' })
            }).catch(() => {});
          }
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
    if ((!gmailReplyText.trim() && gmailAttachments.length === 0) || !gmailSelectedThread) return;

    setGmailSending(true);
    try {
      // Convert attachments to base64
      const attachmentData = await Promise.all(gmailAttachments.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({ filename: file.name, mimeType: file.type, data: base64 });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }));

      const res = await fetch(`/api/gmail/messages/${gmailSelectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: gmailReplyText.trim(),
          to: gmailSelectedThread.from_email,
          subject: gmailSelectedThread.subject,
          attachments: attachmentData
        })
      });
      const data = await res.json();

      if (data.success) {
        setGmailReplyText('');
        setGmailAttachments([]);
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

  // Update Gmail thread status
  const handleGmailStatusChange = async (status) => {
    if (!gmailSelectedThread) return;

    try {
      const res = await fetch(`/api/gmail/messages/${gmailSelectedThread.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();

      if (data.success) {
        // Update local state
        setGmailSelectedThread(prev => ({ ...prev, status, unread: status === 'new' }));
        setGmailThreads(prev => prev.map(t =>
          t.id === gmailSelectedThread.id ? { ...t, status, unread: status === 'new' } : t
        ));
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  // Delete selected Gmail messages
  const handleGmailDeleteMessages = async () => {
    if (gmailSelectedMessages.length === 0 || !gmailSelectedThread) return;

    if (!confirm(`Usunac ${gmailSelectedMessages.length} wiadomosc(i)?`)) return;

    setGmailDeleting(true);
    try {
      const res = await fetch(`/api/gmail/messages/${gmailSelectedThread.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: gmailSelectedMessages })
      });
      const data = await res.json();

      if (data.success) {
        // Remove deleted messages from local state
        setGmailThreadMessages(prev => prev.filter(m => !gmailSelectedMessages.includes(m.id)));
        setGmailSelectedMessages([]);
      } else {
        alert('Blad usuwania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setGmailDeleting(false);
    }
  };

  // Toggle message selection
  const toggleGmailMessageSelection = (messageId) => {
    setGmailSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Toggle thread selection for deletion
  const toggleGmailThreadSelection = (e, threadId) => {
    e.stopPropagation();
    setGmailSelectedThreads(prev => prev.includes(threadId) ? prev.filter(id => id !== threadId) : [...prev, threadId]);
  };

  // Delete selected threads
  const handleGmailDeleteThreads = async () => {
    if (gmailSelectedThreads.length === 0) return;
    if (!confirm(`Usunac ${gmailSelectedThreads.length} watek(ow)? Wiadomosci zostana przeniesione do kosza.`)) return;

    setGmailDeletingThreads(true);
    try {
      const res = await fetch('/api/gmail/threads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadIds: gmailSelectedThreads })
      });
      const data = await res.json();

      if (data.success) {
        // Remove deleted threads from state
        setGmailThreads(prev => prev.filter(t => !gmailSelectedThreads.includes(t.id)));
        // Clear selection
        setGmailSelectedThreads([]);
        // If currently selected thread was deleted, clear it
        if (gmailSelectedThread && gmailSelectedThreads.includes(gmailSelectedThread.id)) {
          setGmailSelectedThread(null);
          setGmailThreadMessages([]);
        }
      } else {
        alert('Blad usuwania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setGmailDeletingThreads(false);
    }
  };

  // Quick change thread status from thread list (optimistic update)
  const quickChangeGmailThreadStatus = async (e, threadId, newStatus) => {
    e.stopPropagation();

    // Optimistic update - immediately update UI
    const previousThreads = gmailThreads;
    setGmailThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, status: newStatus, unread: newStatus === 'new' } : t
    ));

    // Also update selected thread if it's the same one
    if (gmailSelectedThread?.id === threadId) {
      setGmailSelectedThread(prev => prev ? { ...prev, status: newStatus, unread: newStatus === 'new' } : prev);
    }

    // API call in background
    try {
      const res = await fetch(`/api/gmail/messages/${threadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (!data.success) {
        // Rollback on failure
        setGmailThreads(previousThreads);
        console.error('Status update failed:', data.error);
      }
    } catch (err) {
      // Rollback on error
      setGmailThreads(previousThreads);
      console.error('Status update error:', err);
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

  // Logout Gmail POOMKIDS
  const handlePoomkidsLogout = async () => {
    if (!confirm('Czy na pewno chcesz sie wylogowac z Gmail POOMKIDS?')) return;
    try {
      const res = await fetch('/api/gmail-poomkids/auth', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPoomkidsAuth({ authenticated: false, user: null, loading: false });
        setPoomkidsThreads([]);
        setPoomkidsSelectedThread(null);
        setPoomkidsThreadMessages([]);
        setPoomkidsSyncStatus(null);
        setPoomkidsUnreadCount(0);
      } else {
        alert('Blad wylogowania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  // Open POOMKIDS thread
  const openPoomkidsThread = async (thread) => {
    setPoomkidsSelectedThread(thread);
    setPoomkidsMessagesLoading(true);
    setPoomkidsSelectedMessages([]);

    try {
      // Load from DB first (fast), no refresh=true
      const res = await fetch(`/api/gmail-poomkids/messages/${thread.id}`);
      const data = await res.json();

      if (data.success) {
        setPoomkidsSelectedThread(data.thread);
        setPoomkidsThreadMessages(data.messages || []);

        // Mark as read in background (non-blocking)
        if (thread.unread || thread.status === 'new') {
          // Update local state immediately for instant feedback
          setPoomkidsThreads(prev => prev.map(t =>
            t.id === thread.id ? { ...t, unread: false, status: thread.status === 'new' ? 'read' : t.status } : t
          ));
          setPoomkidsUnreadCount(prev => Math.max(0, prev - 1));

          // Background API calls - fire and forget
          fetch(`/api/gmail-poomkids/messages/${thread.id}`, { method: 'PUT' }).catch(() => {});
          if (thread.status === 'new' || !thread.status) {
            fetch(`/api/gmail-poomkids/messages/${thread.id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'read' })
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('POOMKIDS open thread error:', err);
    } finally {
      setPoomkidsMessagesLoading(false);
    }
  };

  // Update POOMKIDS thread status
  const handlePoomkidsStatusChange = async (status) => {
    if (!poomkidsSelectedThread) return;

    try {
      const res = await fetch(`/api/gmail-poomkids/messages/${poomkidsSelectedThread.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();

      if (data.success) {
        setPoomkidsSelectedThread(prev => ({ ...prev, status, unread: status === 'new' }));
        setPoomkidsThreads(prev => prev.map(t =>
          t.id === poomkidsSelectedThread.id ? { ...t, status, unread: status === 'new' } : t
        ));
      }
    } catch (err) {
      console.error('POOMKIDS status update error:', err);
    }
  };

  // Send POOMKIDS reply
  const handlePoomkidsSendReply = async () => {
    if ((!poomkidsReplyText.trim() && poomkidsAttachments.length === 0) || !poomkidsSelectedThread) return;

    setPoomkidsSending(true);
    try {
      // Convert attachments to base64
      const attachmentData = await Promise.all(poomkidsAttachments.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({ filename: file.name, mimeType: file.type, data: base64 });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }));

      const res = await fetch(`/api/gmail-poomkids/messages/${poomkidsSelectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: poomkidsReplyText.trim(),
          to: poomkidsSelectedThread.from_email,
          subject: poomkidsSelectedThread.subject,
          attachments: attachmentData
        })
      });
      const data = await res.json();

      if (data.success) {
        setPoomkidsReplyText('');
        setPoomkidsAttachments([]);
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

  // Delete selected POOMKIDS messages
  const handlePoomkidsDeleteMessages = async () => {
    if (poomkidsSelectedMessages.length === 0 || !poomkidsSelectedThread) return;
    if (!confirm(`Usunac ${poomkidsSelectedMessages.length} wiadomosc(i)?`)) return;
    setPoomkidsDeleting(true);
    try {
      const res = await fetch(`/api/gmail-poomkids/messages/${poomkidsSelectedThread.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: poomkidsSelectedMessages })
      });
      const data = await res.json();
      if (data.success) {
        setPoomkidsThreadMessages(prev => prev.filter(m => !poomkidsSelectedMessages.includes(m.id)));
        setPoomkidsSelectedMessages([]);
      } else {
        alert('Blad usuwania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setPoomkidsDeleting(false);
    }
  };

  // Send new composed email for POOMKIDS
  const handlePoomkidsSendCompose = async () => {
    if (!poomkidsComposeTo.trim() || !poomkidsComposeSubject.trim() || (!poomkidsComposeBody.trim() && poomkidsComposeAttachments.length === 0)) return;

    setPoomkidsSending(true);
    try {
      // Convert attachments to base64
      const attachmentData = await Promise.all(poomkidsComposeAttachments.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({ filename: file.name, mimeType: file.type, data: base64 });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }));

      const res = await fetch('/api/gmail-poomkids/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: poomkidsComposeTo.trim(),
          subject: poomkidsComposeSubject.trim(),
          text: poomkidsComposeBody.trim(),
          attachments: attachmentData
        })
      });
      const data = await res.json();

      if (data.success) {
        // Clear compose form and exit compose mode
        setPoomkidsComposeTo('');
        setPoomkidsComposeSubject('');
        setPoomkidsComposeBody('');
        setPoomkidsComposeAttachments([]);
        setPoomkidsComposeMode(false);
        // Refresh threads to show the new sent email
        await handlePoomkidsSync();
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setPoomkidsSending(false);
    }
  };

  const togglePoomkidsMessageSelection = (messageId) => {
    setPoomkidsSelectedMessages(prev => prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]);
  };

  // Toggle thread selection for deletion
  const togglePoomkidsThreadSelection = (e, threadId) => {
    e.stopPropagation();
    setPoomkidsSelectedThreads(prev => prev.includes(threadId) ? prev.filter(id => id !== threadId) : [...prev, threadId]);
  };

  // Delete selected threads
  const handlePoomkidsDeleteThreads = async () => {
    if (poomkidsSelectedThreads.length === 0) return;
    if (!confirm(`Usunac ${poomkidsSelectedThreads.length} watek(ow)? Wiadomosci zostana przeniesione do kosza.`)) return;

    setPoomkidsDeletingThreads(true);
    try {
      const res = await fetch('/api/gmail-poomkids/threads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadIds: poomkidsSelectedThreads })
      });
      const data = await res.json();

      if (data.success) {
        // Remove deleted threads from state
        setPoomkidsThreads(prev => prev.filter(t => !poomkidsSelectedThreads.includes(t.id)));
        // Clear selection
        setPoomkidsSelectedThreads([]);
        // If currently selected thread was deleted, clear it
        if (poomkidsSelectedThread && poomkidsSelectedThreads.includes(poomkidsSelectedThread.id)) {
          setPoomkidsSelectedThread(null);
          setPoomkidsThreadMessages([]);
        }
      } else {
        alert('Blad usuwania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setPoomkidsDeletingThreads(false);
    }
  };

  // Quick change Poomkids thread status (optimistic update)
  const quickChangePoomkidsThreadStatus = async (e, threadId, newStatus) => {
    e.stopPropagation();

    // Optimistic update
    const previousThreads = poomkidsThreads;
    setPoomkidsThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, status: newStatus, unread: newStatus === 'new' } : t
    ));

    if (poomkidsSelectedThread?.id === threadId) {
      setPoomkidsSelectedThread(prev => prev ? { ...prev, status: newStatus, unread: newStatus === 'new' } : prev);
    }

    try {
      const res = await fetch(`/api/gmail-poomkids/messages/${threadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (!data.success) {
        setPoomkidsThreads(previousThreads);
        console.error('Status update failed:', data.error);
      }
    } catch (err) {
      setPoomkidsThreads(previousThreads);
      console.error('Status update error:', err);
    }
  };

  // ========== ALLEPODUSZKI GMAIL (Shopify Allepoduszki) FUNCTIONS ==========

  // Check ALLEPODUSZKI authentication status
  const checkAllepoduszkiAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/gmail-allepoduszki/auth');
      const data = await res.json();
      setAllepoduszkiAuth({
        authenticated: data.authenticated,
        user: data.user,
        loading: false
      });

      if (data.authenticated) {
        fetchAllepoduszkiSyncStatus();
        fetchAllepoduszkiThreads();
      }
    } catch (err) {
      console.error('ALLEPODUSZKI auth check error:', err);
      setAllepoduszkiAuth({ authenticated: false, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkAllepoduszkiAuth();
  }, [checkAllepoduszkiAuth]);

  // Fetch ALLEPODUSZKI sync status
  const fetchAllepoduszkiSyncStatus = async () => {
    try {
      const res = await fetch('/api/gmail-allepoduszki/messages?action=status');
      const data = await res.json();
      if (data.success) {
        setAllepoduszkiSyncStatus(data.status);
        setAllepoduszkiUnreadCount(data.status.unreadCount || 0);
      }
    } catch (err) {
      console.error('ALLEPODUSZKI sync status error:', err);
    }
  };

  // Fetch ALLEPODUSZKI threads
  const fetchAllepoduszkiThreads = async () => {
    setAllepoduszkiThreadsLoading(true);
    try {
      const res = await fetch('/api/gmail-allepoduszki/messages');
      const data = await res.json();
      if (data.success) {
        setAllepoduszkiThreads(data.threads || []);
      }
    } catch (err) {
      console.error('ALLEPODUSZKI threads error:', err);
    } finally {
      setAllepoduszkiThreadsLoading(false);
    }
  };

  // Sync ALLEPODUSZKI
  const handleAllepoduszkiSync = async () => {
    setAllepoduszkiSyncing(true);
    try {
      const res = await fetch('/api/gmail-allepoduszki/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchAllepoduszkiThreads();
        fetchAllepoduszkiSyncStatus();
      } else {
        alert('Blad synchronizacji: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setAllepoduszkiSyncing(false);
    }
  };

  // Logout Gmail ALLEPODUSZKI
  const handleAllepoduszkiLogout = async () => {
    if (!confirm('Czy na pewno chcesz sie wylogowac z Gmail Allepoduszki?')) return;
    try {
      const res = await fetch('/api/gmail-allepoduszki/auth', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAllepoduszkiAuth({ authenticated: false, user: null, loading: false });
        setAllepoduszkiThreads([]);
        setAllepoduszkiSelectedThread(null);
        setAllepoduszkiThreadMessages([]);
        setAllepoduszkiSyncStatus(null);
        setAllepoduszkiUnreadCount(0);
      } else {
        alert('Blad wylogowania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  // Open ALLEPODUSZKI thread
  const openAllepoduszkiThread = async (thread) => {
    setAllepoduszkiSelectedThread(thread);
    setAllepoduszkiMessagesLoading(true);
    setAllepoduszkiThreadMessages([]);
    setAllepoduszkiSelectedMessages([]);

    try {
      const res = await fetch(`/api/gmail-allepoduszki/messages/${thread.id}?refresh=true`);
      const data = await res.json();

      if (data.success) {
        setAllepoduszkiSelectedThread(data.thread);
        setAllepoduszkiThreadMessages(data.messages || []);

        // Mark as read and update status to 'read' if it was 'new'
        if (thread.unread || thread.status === 'new') {
          fetch(`/api/gmail-allepoduszki/messages/${thread.id}`, { method: 'PUT' });
          // Update status from 'new' to 'read'
          if (thread.status === 'new' || !thread.status) {
            fetch(`/api/gmail-allepoduszki/messages/${thread.id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'read' })
            });
          }
          fetchAllepoduszkiSyncStatus();
          fetchAllepoduszkiThreads();
        }
      }
    } catch (err) {
      console.error('ALLEPODUSZKI open thread error:', err);
    } finally {
      setAllepoduszkiMessagesLoading(false);
    }
  };

  // Update ALLEPODUSZKI thread status
  const handleAllepoduszkiStatusChange = async (status) => {
    if (!allepoduszkiSelectedThread) return;

    try {
      const res = await fetch(`/api/gmail-allepoduszki/messages/${allepoduszkiSelectedThread.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();

      if (data.success) {
        setAllepoduszkiSelectedThread(prev => ({ ...prev, status, unread: status === 'new' }));
        setAllepoduszkiThreads(prev => prev.map(t =>
          t.id === allepoduszkiSelectedThread.id ? { ...t, status, unread: status === 'new' } : t
        ));
      }
    } catch (err) {
      console.error('ALLEPODUSZKI status update error:', err);
    }
  };

  // Send ALLEPODUSZKI reply
  const handleAllepoduszkiSendReply = async () => {
    if ((!allepoduszkiReplyText.trim() && allepoduszkiAttachments.length === 0) || !allepoduszkiSelectedThread) return;

    setAllepoduszkiSending(true);
    try {
      // Convert attachments to base64
      const attachmentData = await Promise.all(allepoduszkiAttachments.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({ filename: file.name, mimeType: file.type, data: base64 });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }));

      const res = await fetch(`/api/gmail-allepoduszki/messages/${allepoduszkiSelectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: allepoduszkiReplyText.trim(),
          to: allepoduszkiSelectedThread.from_email,
          subject: allepoduszkiSelectedThread.subject,
          attachments: attachmentData
        })
      });
      const data = await res.json();

      if (data.success) {
        setAllepoduszkiReplyText('');
        setAllepoduszkiAttachments([]);
        const msgRes = await fetch(`/api/gmail-allepoduszki/messages/${allepoduszkiSelectedThread.id}?refresh=true`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setAllepoduszkiThreadMessages(msgData.messages || []);
        }
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setAllepoduszkiSending(false);
    }
  };

  // Delete selected Allepoduszki messages
  const handleAllepoduszkiDeleteMessages = async () => {
    if (allepoduszkiSelectedMessages.length === 0 || !allepoduszkiSelectedThread) return;
    if (!confirm(`Usunac ${allepoduszkiSelectedMessages.length} wiadomosc(i)?`)) return;
    setAllepoduszkiDeleting(true);
    try {
      const res = await fetch(`/api/gmail-allepoduszki/messages/${allepoduszkiSelectedThread.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: allepoduszkiSelectedMessages })
      });
      const data = await res.json();
      if (data.success) {
        setAllepoduszkiThreadMessages(prev => prev.filter(m => !allepoduszkiSelectedMessages.includes(m.id)));
        setAllepoduszkiSelectedMessages([]);
      } else {
        alert('Blad usuwania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setAllepoduszkiDeleting(false);
    }
  };

  const toggleAllepoduszkiMessageSelection = (messageId) => {
    setAllepoduszkiSelectedMessages(prev => prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]);
  };

  // Toggle thread selection for deletion
  const toggleAllepoduszkiThreadSelection = (e, threadId) => {
    e.stopPropagation();
    setAllepoduszkiSelectedThreads(prev => prev.includes(threadId) ? prev.filter(id => id !== threadId) : [...prev, threadId]);
  };

  // Delete selected threads
  const handleAllepoduszkiDeleteThreads = async () => {
    if (allepoduszkiSelectedThreads.length === 0) return;
    if (!confirm(`Usunac ${allepoduszkiSelectedThreads.length} watek(ow)? Wiadomosci zostana przeniesione do kosza.`)) return;

    setAllepoduszkiDeletingThreads(true);
    try {
      const res = await fetch('/api/gmail-allepoduszki/threads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadIds: allepoduszkiSelectedThreads })
      });
      const data = await res.json();

      if (data.success) {
        // Remove deleted threads from state
        setAllepoduszkiThreads(prev => prev.filter(t => !allepoduszkiSelectedThreads.includes(t.id)));
        // Clear selection
        setAllepoduszkiSelectedThreads([]);
        // If currently selected thread was deleted, clear it
        if (allepoduszkiSelectedThread && allepoduszkiSelectedThreads.includes(allepoduszkiSelectedThread.id)) {
          setAllepoduszkiSelectedThread(null);
          setAllepoduszkiThreadMessages([]);
        }
      } else {
        alert('Blad usuwania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setAllepoduszkiDeletingThreads(false);
    }
  };

  // Quick change Allepoduszki thread status (optimistic update)
  const quickChangeAllepoduszkiThreadStatus = async (e, threadId, newStatus) => {
    e.stopPropagation();

    const previousThreads = allepoduszkiThreads;
    setAllepoduszkiThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, status: newStatus, unread: newStatus === 'new' } : t
    ));

    if (allepoduszkiSelectedThread?.id === threadId) {
      setAllepoduszkiSelectedThread(prev => prev ? { ...prev, status: newStatus, unread: newStatus === 'new' } : prev);
    }

    try {
      const res = await fetch(`/api/gmail-allepoduszki/messages/${threadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (!data.success) {
        setAllepoduszkiThreads(previousThreads);
        console.error('Status update failed:', data.error);
      }
    } catch (err) {
      setAllepoduszkiThreads(previousThreads);
      console.error('Status update error:', err);
    }
  };

  // ========== POOMFURNITURE GMAIL (Shopify poom-furniture.com) FUNCTIONS ==========

  // Check POOMFURNITURE authentication status
  const checkPoomfurnitureAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/gmail-poomfurniture/auth');
      const data = await res.json();
      setPoomfurnitureAuth({
        authenticated: data.authenticated,
        user: data.user,
        loading: false
      });

      if (data.authenticated) {
        fetchPoomfurnitureSyncStatus();
        fetchPoomfurnitureThreads();
      }
    } catch (err) {
      console.error('POOMFURNITURE auth check error:', err);
      setPoomfurnitureAuth({ authenticated: false, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkPoomfurnitureAuth();
  }, [checkPoomfurnitureAuth]);

  // Fetch POOMFURNITURE sync status
  const fetchPoomfurnitureSyncStatus = async () => {
    try {
      const res = await fetch('/api/gmail-poomfurniture/messages?action=status');
      const data = await res.json();
      if (data.success) {
        setPoomfurnitureSyncStatus(data.status);
        setPoomfurnitureUnreadCount(data.status.unreadCount || 0);
      }
    } catch (err) {
      console.error('POOMFURNITURE sync status error:', err);
    }
  };

  // Fetch POOMFURNITURE threads
  const fetchPoomfurnitureThreads = async () => {
    setPoomfurnitureThreadsLoading(true);
    try {
      const res = await fetch('/api/gmail-poomfurniture/messages');
      const data = await res.json();
      if (data.success) {
        setPoomfurnitureThreads(data.threads || []);
      }
    } catch (err) {
      console.error('POOMFURNITURE threads error:', err);
    } finally {
      setPoomfurnitureThreadsLoading(false);
    }
  };

  // Sync POOMFURNITURE
  const handlePoomfurnitureSync = async () => {
    setPoomfurnitureSyncing(true);
    try {
      const res = await fetch('/api/gmail-poomfurniture/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchPoomfurnitureThreads();
        fetchPoomfurnitureSyncStatus();
      } else {
        alert('Blad synchronizacji: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setPoomfurnitureSyncing(false);
    }
  };

  // Logout Gmail POOMFURNITURE
  const handlePoomfurnitureLogout = async () => {
    if (!confirm('Czy na pewno chcesz sie wylogowac z Gmail poom-furniture.com?')) return;
    try {
      const res = await fetch('/api/gmail-poomfurniture/auth', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPoomfurnitureAuth({ authenticated: false, user: null, loading: false });
        setPoomfurnitureThreads([]);
        setPoomfurnitureSelectedThread(null);
        setPoomfurnitureThreadMessages([]);
        setPoomfurnitureSyncStatus(null);
        setPoomfurnitureUnreadCount(0);
      } else {
        alert('Blad wylogowania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  // Open POOMFURNITURE thread
  const openPoomfurnitureThread = async (thread) => {
    setPoomfurnitureSelectedThread(thread);
    setPoomfurnitureMessagesLoading(true);
    setPoomfurnitureThreadMessages([]);
    setPoomfurnitureSelectedMessages([]);

    try {
      const res = await fetch(`/api/gmail-poomfurniture/messages/${thread.id}?refresh=true`);
      const data = await res.json();

      if (data.success) {
        setPoomfurnitureSelectedThread(data.thread);
        setPoomfurnitureThreadMessages(data.messages || []);

        // Mark as read and update status to 'read' if it was 'new'
        if (thread.unread || thread.status === 'new') {
          fetch(`/api/gmail-poomfurniture/messages/${thread.id}`, { method: 'PUT' });
          // Update status from 'new' to 'read'
          if (thread.status === 'new' || !thread.status) {
            fetch(`/api/gmail-poomfurniture/messages/${thread.id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'read' })
            });
          }
          fetchPoomfurnitureSyncStatus();
          fetchPoomfurnitureThreads();
        }
      }
    } catch (err) {
      console.error('POOMFURNITURE open thread error:', err);
    } finally {
      setPoomfurnitureMessagesLoading(false);
    }
  };

  // Update POOMFURNITURE thread status
  const handlePoomfurnitureStatusChange = async (status) => {
    if (!poomfurnitureSelectedThread) return;

    try {
      const res = await fetch(`/api/gmail-poomfurniture/messages/${poomfurnitureSelectedThread.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();

      if (data.success) {
        setPoomfurnitureSelectedThread(prev => ({ ...prev, status, unread: status === 'new' }));
        setPoomfurnitureThreads(prev => prev.map(t =>
          t.id === poomfurnitureSelectedThread.id ? { ...t, status, unread: status === 'new' } : t
        ));
      }
    } catch (err) {
      console.error('POOMFURNITURE status update error:', err);
    }
  };

  // Send POOMFURNITURE reply
  const handlePoomfurnitureSendReply = async () => {
    if ((!poomfurnitureReplyText.trim() && poomfurnitureAttachments.length === 0) || !poomfurnitureSelectedThread) return;

    setPoomfurnitureSending(true);
    try {
      // Convert attachments to base64
      const attachmentData = await Promise.all(poomfurnitureAttachments.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({ filename: file.name, mimeType: file.type, data: base64 });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }));

      const res = await fetch(`/api/gmail-poomfurniture/messages/${poomfurnitureSelectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: poomfurnitureReplyText.trim(),
          to: poomfurnitureSelectedThread.from_email,
          subject: poomfurnitureSelectedThread.subject,
          attachments: attachmentData
        })
      });
      const data = await res.json();

      if (data.success) {
        setPoomfurnitureReplyText('');
        setPoomfurnitureAttachments([]);
        const msgRes = await fetch(`/api/gmail-poomfurniture/messages/${poomfurnitureSelectedThread.id}?refresh=true`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setPoomfurnitureThreadMessages(msgData.messages || []);
        }
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setPoomfurnitureSending(false);
    }
  };

  // Delete selected Poomfurniture messages
  const handlePoomfurnitureDeleteMessages = async () => {
    if (poomfurnitureSelectedMessages.length === 0 || !poomfurnitureSelectedThread) return;
    if (!confirm(`Usunac ${poomfurnitureSelectedMessages.length} wiadomosc(i)?`)) return;
    setPoomfurnitureDeleting(true);
    try {
      const res = await fetch(`/api/gmail-poomfurniture/messages/${poomfurnitureSelectedThread.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: poomfurnitureSelectedMessages })
      });
      const data = await res.json();
      if (data.success) {
        setPoomfurnitureThreadMessages(prev => prev.filter(m => !poomfurnitureSelectedMessages.includes(m.id)));
        setPoomfurnitureSelectedMessages([]);
      } else {
        alert('Blad usuwania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setPoomfurnitureDeleting(false);
    }
  };

  const togglePoomfurnitureMessageSelection = (messageId) => {
    setPoomfurnitureSelectedMessages(prev => prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]);
  };

  // Toggle thread selection for deletion
  const togglePoomfurnitureThreadSelection = (e, threadId) => {
    e.stopPropagation();
    setPoomfurnitureSelectedThreads(prev => prev.includes(threadId) ? prev.filter(id => id !== threadId) : [...prev, threadId]);
  };

  // Delete selected threads
  const handlePoomfurnitureDeleteThreads = async () => {
    if (poomfurnitureSelectedThreads.length === 0) return;
    if (!confirm(`Usunac ${poomfurnitureSelectedThreads.length} watek(ow)? Wiadomosci zostana przeniesione do kosza.`)) return;

    setPoomfurnitureDeletingThreads(true);
    try {
      const res = await fetch('/api/gmail-poomfurniture/threads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadIds: poomfurnitureSelectedThreads })
      });
      const data = await res.json();

      if (data.success) {
        // Remove deleted threads from state
        setPoomfurnitureThreads(prev => prev.filter(t => !poomfurnitureSelectedThreads.includes(t.id)));
        // Clear selection
        setPoomfurnitureSelectedThreads([]);
        // If currently selected thread was deleted, clear it
        if (poomfurnitureSelectedThread && poomfurnitureSelectedThreads.includes(poomfurnitureSelectedThread.id)) {
          setPoomfurnitureSelectedThread(null);
          setPoomfurnitureThreadMessages([]);
        }
      } else {
        alert('Blad usuwania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setPoomfurnitureDeletingThreads(false);
    }
  };

  // Quick change Poomfurniture thread status (optimistic update)
  const quickChangePoomfurnitureThreadStatus = async (e, threadId, newStatus) => {
    e.stopPropagation();

    const previousThreads = poomfurnitureThreads;
    setPoomfurnitureThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, status: newStatus, unread: newStatus === 'new' } : t
    ));

    if (poomfurnitureSelectedThread?.id === threadId) {
      setPoomfurnitureSelectedThread(prev => prev ? { ...prev, status: newStatus, unread: newStatus === 'new' } : prev);
    }

    try {
      const res = await fetch(`/api/gmail-poomfurniture/messages/${threadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (!data.success) {
        setPoomfurnitureThreads(previousThreads);
        console.error('Status update failed:', data.error);
      }
    } catch (err) {
      setPoomfurnitureThreads(previousThreads);
      console.error('Status update error:', err);
    }
  };

  // Get attachment icon based on mime type
  const getAttachmentIcon = (mimeType, filename = '') => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.includes('pdf') || filename?.endsWith('.pdf')) return '📄';
    if (mimeType?.includes('word') || filename?.match(/\.(doc|docx)$/)) return '📝';
    if (mimeType?.includes('excel') || filename?.match(/\.(xls|xlsx)$/)) return '📊';
    if (mimeType?.includes('zip') || filename?.match(/\.(zip|rar|7z)$/)) return '📦';
    return '📎';
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

  // Parse message body to convert URLs to clickable links and clean up formatting
  const parseMessageBody = (text, isOutgoing = false) => {
    if (!text) return '(Brak tresci tekstowej)';

    // Clean up the text first
    let cleanedText = text
      // Remove zero-width spaces and other invisible characters
      .replace(/&#8203;/g, '')
      .replace(/\u200B/g, '')
      .replace(/\u200C/g, '')
      .replace(/\u200D/g, '')
      .replace(/\uFEFF/g, '')
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Strip quoted reply content (backup in case DB has full content)
      .replace(/>\s*пише:\s*[\s\S]*/i, '')
      .replace(/>\s*написав:\s*[\s\S]*/i, '')
      .replace(/>\s*написал:\s*[\s\S]*/i, '')
      .replace(/>\s*пишет:\s*[\s\S]*/i, '')
      .replace(/\n*On .+ wrote:[\s\S]*/i, '')
      .replace(/\n*W dniu .+ napisał:[\s\S]*/i, '')
      .replace(/\n*Dnia .+ napisał:[\s\S]*/i, '')
      // Polish format with napisał(a): - matches "niedziela, 25 stycznia 2026 22:53, email napisał(a):"
      .replace(/\n*.+\d{4}.+napisał\(a\):[\s\S]*/i, '')
      .replace(/\n(?:>.*\n?){2,}[\s\S]*/, '')
      .replace(/\n*\[image:[^\]]*\]\s*Zamówienie\s*#\d+[\s\S]*/i, '')
      // Proton Mail signature
      .replace(/\n*Wysłana przez bezpieczną pocztę \[Proton Mail\].*$/im, '')
      .replace(/\n*Sent with Proton Mail.*$/im, '')
      // Remove excessive whitespace on each line
      .replace(/[ \t]+$/gm, '')
      .replace(/^[ \t]+/gm, '')
      // Collapse multiple empty lines (more than 2) into max 2
      .replace(/\n{3,}/g, '\n\n')
      // Remove lines that only contain whitespace
      .replace(/^\s*$/gm, '')
      // Collapse multiple newlines again after removing empty lines
      .replace(/\n{3,}/g, '\n\n')
      // Trim the whole text
      .trim();

    if (!cleanedText) return '(Brak tresci tekstowej)';

    const linkClass = isOutgoing
      ? 'text-blue-200 hover:text-white underline'
      : 'text-blue-600 hover:text-blue-800 underline';

    // Match URLs in angle brackets <URL> or standalone URLs
    const urlPattern = /<(https?:\/\/[^>]+)>|(https?:\/\/[^\s<>\])}]+)/g;

    const parts = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = urlPattern.exec(cleanedText)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(cleanedText.slice(lastIndex, match.index));
      }

      const url = match[1] || match[2];

      // Create clickable link with domain as label
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        parts.push(
          <a key={keyIndex++} href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            [{domain}]
          </a>
        );
      } catch {
        // Invalid URL, show as-is
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < cleanedText.length) {
      parts.push(cleanedText.slice(lastIndex));
    }

    return parts.length > 0 ? parts : cleanedText;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">CRM</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Zarzadzanie klientami i wiadomosciami</p>
          </div>
        </div>

        {/* Status integracji - pokazuj dopiero po załadowaniu */}
        {!tabs.some(t => t.isLoading) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 mb-4 p-3">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Status integracji</h3>
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => {
              const tabSyncStatus = tab.key === 'wiadomosci' ? syncStatus :
                                 tab.key === 'meblebox' ? mebleboxSyncStatus :
                                 tab.key === 'shopify' ? gmailSyncStatus :
                                 tab.key === 'poomkids' ? poomkidsSyncStatus :
                                 tab.key === 'allepoduszki' ? allepoduszkiSyncStatus :
                                 tab.key === 'poomfurniture' ? poomfurnitureSyncStatus : null;

              const lastSync = tabSyncStatus?.lastSyncAt ? new Date(tabSyncStatus.lastSyncAt) : null;
              const now = new Date();
              const syncAgeMinutes = lastSync ? Math.floor((now - lastSync) / 60000) : null;
              const syncAgeHours = syncAgeMinutes !== null ? syncAgeMinutes / 60 : null;
              const isYellow = syncAgeHours !== null && syncAgeHours >= 5 && syncAgeHours < 24;
              const isRed = syncAgeHours !== null && syncAgeHours >= 24;
              const neverSynced = tab.isConnected && !lastSync;
              const isWorking = tab.isConnected && lastSync && !isYellow && !isRed;

              return (
                <div
                  key={tab.key}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    tab.isLoading ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' :
                    isWorking ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    neverSynced ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                    tab.isConnected && isYellow ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {tab.isImage && <img src={tab.icon} alt="" className="w-4 h-4 rounded" />}
                  <span className="hidden sm:inline">{tab.label.replace('Allegro ', '').replace('Shopify ', '')}</span>
                  <span className="sm:hidden">{tab.label.split(' ').pop()}</span>
                  {tab.isLoading ? (
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
                  ) : isWorking ? (
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  ) : neverSynced ? (
                    <span className="w-2 h-2 rounded-full bg-orange-500" title="Nigdy nie zsynchronizowano"></span>
                  ) : tab.isConnected && isYellow ? (
                    <span className="w-2 h-2 rounded-full bg-yellow-500" title={`Ostatnia sync: ${Math.floor(syncAgeHours)}h temu`}></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  )}
                  {lastSync ? (
                    <span className="text-[10px] opacity-70">
                      {syncAgeMinutes < 1 ? 'teraz' : syncAgeMinutes < 60 ? `${syncAgeMinutes}m` : `${Math.floor(syncAgeMinutes/60)}h`}
                    </span>
                  ) : neverSynced ? (
                    <span className="text-[10px] opacity-70">brak sync</span>
                  ) : !tab.isConnected && !tab.isLoading ? (
                    <span className="text-[10px] opacity-70">rozlaczono</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 mb-4">
          <div className="px-4 pt-3 pb-1">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Wiadomosci z kanalow sprzedazy</h3>
          </div>
          <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors whitespace-nowrap px-4 ${
                  activeTab === tab.key
                    ? 'border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {tab.isImage ? (
                  <div className="relative">
                    <img src={tab.icon} alt={tab.label} className="w-5 h-5 rounded object-cover" />
                    {tab.overlayIcon && (
                      <img src={tab.overlayIcon} alt="" className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full object-cover border border-white dark:border-gray-800" />
                    )}
                  </div>
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
                      <div className="flex gap-2">
                        {allegroSelectedThreads.length > 0 && (
                          <button
                            onClick={handleAllegroDeleteThreads}
                            disabled={allegroDeletingThreads}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                            title="Usun zaznaczone watki"
                          >
                            {allegroDeletingThreads ? '...' : `Usun (${allegroSelectedThreads.length})`}
                          </button>
                        )}
                        <button
                          onClick={handleSync}
                          disabled={syncing}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {syncing ? 'Sync...' : 'Synchronizuj'}
                        </button>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <input
                        type="text"
                        placeholder="Szukaj po nazwie, temacie..."
                        value={allegroSearch}
                        onChange={(e) => setAllegroSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {threadsLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
                      ) : threads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        threads
                          .filter(thread => {
                            if (!allegroSearch.trim()) return true;
                            const search = allegroSearch.toLowerCase();
                            return (
                              (thread.interlocutor_login || '').toLowerCase().includes(search) ||
                              (thread.subject || '').toLowerCase().includes(search) ||
                              (thread.last_message_summary || '').toLowerCase().includes(search)
                            );
                          })
                          .map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => openThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                              selectedThread?.id === thread.id ? 'bg-blue-50' : ''
                            } ${!thread.read ? 'bg-orange-50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Checkbox for thread selection */}
                              <div className="mt-2">
                                <input
                                  type="checkbox"
                                  checked={allegroSelectedThreads.includes(thread.id)}
                                  onChange={(e) => toggleAllegroThreadSelection(e, thread.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                />
                              </div>
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
                          </div>
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
                      <div className="flex gap-2">
                        {mebleboxSelectedThreads.length > 0 && (
                          <button
                            onClick={handleMebleboxDeleteThreads}
                            disabled={mebleboxDeletingThreads}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                            title="Usun zaznaczone watki"
                          >
                            {mebleboxDeletingThreads ? '...' : `Usun (${mebleboxSelectedThreads.length})`}
                          </button>
                        )}
                        <button
                          onClick={handleMebleboxSync}
                          disabled={mebleboxSyncing}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {mebleboxSyncing ? 'Sync...' : 'Synchronizuj'}
                        </button>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <input
                        type="text"
                        placeholder="Szukaj po nazwie, temacie..."
                        value={mebleboxSearch}
                        onChange={(e) => setMebleboxSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {mebleboxThreadsLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
                      ) : mebleboxThreads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        mebleboxThreads
                          .filter(thread => {
                            if (!mebleboxSearch.trim()) return true;
                            const search = mebleboxSearch.toLowerCase();
                            return (
                              (thread.interlocutor_login || '').toLowerCase().includes(search) ||
                              (thread.subject || '').toLowerCase().includes(search) ||
                              (thread.last_message_summary || '').toLowerCase().includes(search)
                            );
                          })
                          .map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => openMebleboxThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                              mebleboxSelectedThread?.id === thread.id ? 'bg-blue-50' : ''
                            } ${!thread.read ? 'bg-orange-50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Checkbox for thread selection */}
                              <div className="mt-2">
                                <input
                                  type="checkbox"
                                  checked={mebleboxSelectedThreads.includes(thread.id)}
                                  onChange={(e) => toggleMebleboxThreadSelection(e, thread.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                />
                              </div>
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
                          </div>
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
                          {gmailAuth.user?.email && <span className="text-blue-600">{gmailAuth.user.email}</span>}
                          {gmailAuth.user?.email && ' • '}
                          {gmailSyncStatus?.lastSyncAt ? `Sync: ${formatDate(gmailSyncStatus.lastSyncAt)}` : 'Nie zsynchronizowano'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {gmailSelectedThreads.length > 0 && (
                          <button
                            onClick={handleGmailDeleteThreads}
                            disabled={gmailDeletingThreads}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                            title="Usun zaznaczone watki"
                          >
                            {gmailDeletingThreads ? '...' : `Usun (${gmailSelectedThreads.length})`}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setGmailComposeMode(true);
                            setGmailSelectedThread(null);
                          }}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                          title="Nowa wiadomosc"
                        >
                          + Nowa
                        </button>
                        <button
                          onClick={handleGmailSync}
                          disabled={gmailSyncing}
                          className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          title="Synchronizuj"
                        >
                          {gmailSyncing ? '⏳' : '🔄'}
                        </button>
                        <button
                          onClick={handleGmailLogout}
                          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                          title="Wyloguj z Gmail"
                        >
                          Wyloguj
                        </button>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <input
                        type="text"
                        placeholder="Szukaj po nazwisku, emailu, temacie..."
                        value={gmailSearch}
                        onChange={(e) => setGmailSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex gap-1 flex-wrap bg-gray-50 dark:bg-gray-800/50">
                      {[
                        { key: 'all', label: 'Wszystkie', count: gmailThreads.length, color: 'gray' },
                        { key: 'new', label: 'Nowe', count: gmailThreads.filter(t => t.status === 'new' || t.unread).length, color: 'red' },
                        { key: 'read', label: 'Przeczytane', count: gmailThreads.filter(t => t.status === 'read' || (!t.unread && t.status !== 'resolved')).length, color: 'blue' },
                        { key: 'resolved', label: 'Rozwiazane', count: gmailThreads.filter(t => t.status === 'resolved').length, color: 'green' },
                        { key: 'sent', label: 'Wyslane', count: gmailThreads.filter(t => t.status === 'sent').length, color: 'purple' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setGmailFilter(tab.key)}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            gmailFilter === tab.key
                              ? tab.color === 'red' ? 'bg-red-500 text-white'
                                : tab.color === 'blue' ? 'bg-blue-500 text-white'
                                : tab.color === 'green' ? 'bg-green-500 text-white'
                                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {gmailThreadsLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
                      ) : gmailThreads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        gmailThreads
                          .filter(thread => {
                            // Search filter
                            if (gmailSearch.trim()) {
                              const search = gmailSearch.toLowerCase();
                              const matchesSearch =
                                (thread.from_name || '').toLowerCase().includes(search) ||
                                (thread.from_email || '').toLowerCase().includes(search) ||
                                (thread.subject || '').toLowerCase().includes(search) ||
                                (thread.snippet || '').toLowerCase().includes(search);
                              if (!matchesSearch) return false;
                            }
                            // Status filter
                            if (gmailFilter === 'all') return true;
                            if (gmailFilter === 'new') return thread.status === 'new' || thread.unread;
                            if (gmailFilter === 'read') return thread.status === 'read' || (!thread.unread && thread.status !== 'resolved' && thread.status !== 'new' && thread.status !== 'sent');
                            if (gmailFilter === 'resolved') return thread.status === 'resolved';
                            if (gmailFilter === 'sent') return thread.status === 'sent';
                            return true;
                          })
                          .map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => openGmailThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                              gmailSelectedThread?.id === thread.id ? 'bg-blue-50' : ''
                            } ${thread.status === 'new' || (!thread.status && thread.unread) ? 'bg-red-50' : ''} ${thread.status === 'resolved' ? 'bg-green-50' : ''} ${thread.status === 'sent' ? 'bg-purple-50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Checkbox for thread selection */}
                              <div className="mt-2">
                                <input
                                  type="checkbox"
                                  checked={gmailSelectedThreads.includes(thread.id)}
                                  onChange={(e) => toggleGmailThreadSelection(e, thread.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </div>
                              <div className="relative mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenStatusDropdown(
                                      openStatusDropdown?.module === 'gmail' && openStatusDropdown?.threadId === thread.id
                                        ? null
                                        : { module: 'gmail', threadId: thread.id }
                                    );
                                  }}
                                  className={`w-7 h-7 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                                    thread.status === 'resolved'
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : thread.status === 'read'
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : thread.status === 'new' || thread.unread
                                          ? 'bg-red-500 border-red-500 text-white'
                                          : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  title="Zmien status"
                                >
                                  {thread.status === 'resolved' ? '✓' : thread.status === 'read' ? '●' : thread.status === 'new' || thread.unread ? '!' : ''}
                                </button>
                                {openStatusDropdown?.module === 'gmail' && openStatusDropdown?.threadId === thread.id && (
                                  <div className="absolute left-0 top-8 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 min-w-[140px]">
                                    <button
                                      onClick={(e) => { quickChangeGmailThreadStatus(e, thread.id, 'new'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-red-500"></span> Nowe
                                    </button>
                                    <button
                                      onClick={(e) => { quickChangeGmailThreadStatus(e, thread.id, 'read'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-blue-500"></span> Przeczytane
                                    </button>
                                    <button
                                      onClick={(e) => { quickChangeGmailThreadStatus(e, thread.id, 'resolved'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-green-500"></span> Rozwiazane
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                                {(thread.from_name || thread.from_email || '?')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${thread.status === 'new' || (!thread.status && thread.unread) ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {thread.from_name || thread.from_email || 'Nieznany'}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                                    {formatDate(thread.last_message_at)}
                                  </span>
                                </div>
                                <p className={`text-sm truncate ${thread.status === 'new' || (!thread.status && thread.unread) ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                  {thread.subject || '(Brak tematu)'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{thread.snippet}</p>
                              </div>
                            </div>
                          </div>
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
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => { setGmailSelectedThread(null); setGmailSelectedMessages([]); }}
                              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              ← Wstecz
                            </button>
                            <div className="flex items-center gap-2">
                              {/* Status dropdown */}
                              <select
                                value={gmailSelectedThread.status || 'new'}
                                onChange={(e) => handleGmailStatusChange(e.target.value)}
                                className={`px-2 py-1 text-xs font-medium rounded border-0 cursor-pointer ${
                                  gmailSelectedThread.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                  gmailSelectedThread.status === 'read' ? 'bg-blue-100 text-blue-700' :
                                  'bg-red-100 text-red-700'
                                }`}
                              >
                                <option value="new">Nowe</option>
                                <option value="read">Przeczytane</option>
                                <option value="resolved">Rozwiazane</option>
                              </select>
                              {/* Delete selected messages button */}
                              {gmailSelectedMessages.length > 0 && (
                                <button
                                  onClick={handleGmailDeleteMessages}
                                  disabled={gmailDeleting}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  {gmailDeleting ? '...' : `Usun (${gmailSelectedMessages.length})`}
                                </button>
                              )}
                            </div>
                          </div>
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
                            gmailThreadMessages.map((msg) => {
                              let msgAttachments = [];
                              try {
                                if (msg.attachments) {
                                  msgAttachments = typeof msg.attachments === 'string' ? JSON.parse(msg.attachments) : msg.attachments;
                                  if (!Array.isArray(msgAttachments)) msgAttachments = [];
                                }
                              } catch (e) {
                                console.error('Error parsing attachments:', e);
                              }
                              const senderInitial = (msg.from_email || '?')[0].toUpperCase();
                              return (
                              <div
                                key={msg.id}
                                className={`flex items-start gap-2 ${msg.is_outgoing ? 'justify-end' : 'justify-start'}`}
                              >
                                {/* Message with avatar */}
                                <div className="relative">
                                  {/* Avatar overlapping corner */}
                                  {msg.is_outgoing ? (
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 flex items-center justify-center overflow-hidden z-10">
                                      <img src="/icons/dobrelegowiska.png" alt="" className="w-5 h-5 object-contain" />
                                    </div>
                                  ) : (
                                    <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-gray-100 border-2 border-white dark:border-gray-800 flex items-center justify-center text-gray-600 font-bold text-sm z-10">
                                      {senderInitial}
                                    </div>
                                  )}
                                  <div
                                    className={`max-w-[80%] min-w-[200px] px-4 py-3 rounded-lg ${
                                      msg.is_outgoing
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    <div className={`text-xs mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {msg.from_name || msg.from_email}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words text-sm">
                                      {parseMessageBody(msg.body_text, msg.is_outgoing)}
                                    </div>
                                    {/* Attachments */}
                                    {msgAttachments.length > 0 && (
                                      <div className="mt-2">
                                        <p className={`text-[10px] mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>Zalaczniki:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {msgAttachments.map((att, i) => (
                                            <a
                                              key={i}
                                              href={`/api/gmail/attachments/${msg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                                msg.is_outgoing
                                                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                                  : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                                              }`}
                                            >
                                              <span>{getAttachmentIcon(att.mimeType)}</span>
                                              <span className="truncate max-w-[100px]">{att.filename}</span>
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <div className={`mt-2 text-xs ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>
                                      <span>{formatDate(msg.sent_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                            })
                          )}
                        </div>

                        {/* Reply input */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          {/* Attachment preview */}
                          {gmailAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {gmailAttachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  <span>{getAttachmentIcon(file.type, file.name)}</span>
                                  <span className="truncate max-w-[100px]">{file.name}</span>
                                  <button
                                    onClick={() => setGmailAttachments(prev => prev.filter((_, i) => i !== index))}
                                    className="text-gray-500 hover:text-red-500 ml-1"
                                  >×</button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <label className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center" title="Dodaj zalacznik">
                              <span>📎</span>
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  setGmailAttachments(prev => [...prev, ...files]);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <textarea
                              value={gmailReplyText}
                              onChange={(e) => setGmailReplyText(e.target.value)}
                              placeholder="Napisz odpowiedz..."
                              rows={2}
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
                              disabled={gmailSending || (!gmailReplyText.trim() && gmailAttachments.length === 0)}
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
                          {poomkidsAuth.user?.email && <span className="text-green-600">{poomkidsAuth.user.email}</span>}
                          {poomkidsAuth.user?.email && ' • '}
                          {poomkidsSyncStatus?.lastSyncAt ? `Sync: ${formatDate(poomkidsSyncStatus.lastSyncAt)}` : 'Nie zsynchronizowano'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {poomkidsSelectedThreads.length > 0 && (
                          <button
                            onClick={handlePoomkidsDeleteThreads}
                            disabled={poomkidsDeletingThreads}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                            title="Usun zaznaczone watki"
                          >
                            {poomkidsDeletingThreads ? '...' : `Usun (${poomkidsSelectedThreads.length})`}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setPoomkidsComposeMode(true);
                            setPoomkidsSelectedThread(null);
                          }}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                          title="Nowa wiadomosc"
                        >
                          + Nowa
                        </button>
                        <button
                          onClick={handlePoomkidsSync}
                          disabled={poomkidsSyncing}
                          className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          title="Synchronizuj"
                        >
                          {poomkidsSyncing ? '⏳' : '🔄'}
                        </button>
                        <button
                          onClick={handlePoomkidsLogout}
                          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                          title="Wyloguj z Gmail"
                        >
                          Wyloguj
                        </button>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <input
                        type="text"
                        placeholder="Szukaj po nazwisku, emailu, temacie..."
                        value={poomkidsSearch}
                        onChange={(e) => setPoomkidsSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex gap-1 flex-wrap bg-gray-50 dark:bg-gray-800/50">
                      {[
                        { key: 'all', label: 'Wszystkie', count: poomkidsThreads.length, color: 'gray' },
                        { key: 'new', label: 'Nowe', count: poomkidsThreads.filter(t => t.status === 'new' || t.unread).length, color: 'red' },
                        { key: 'read', label: 'Przeczytane', count: poomkidsThreads.filter(t => t.status === 'read' || (!t.unread && t.status !== 'resolved')).length, color: 'blue' },
                        { key: 'resolved', label: 'Rozwiazane', count: poomkidsThreads.filter(t => t.status === 'resolved').length, color: 'green' },
                        { key: 'sent', label: 'Wyslane', count: poomkidsThreads.filter(t => t.status === 'sent').length, color: 'purple' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setPoomkidsFilter(tab.key)}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            poomkidsFilter === tab.key
                              ? tab.color === 'red' ? 'bg-red-500 text-white'
                                : tab.color === 'blue' ? 'bg-blue-500 text-white'
                                : tab.color === 'green' ? 'bg-green-500 text-white'
                                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {poomkidsThreadsLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
                      ) : poomkidsThreads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        poomkidsThreads
                          .filter(thread => {
                            // Search filter
                            if (poomkidsSearch.trim()) {
                              const search = poomkidsSearch.toLowerCase();
                              const matchesSearch =
                                (thread.from_name || '').toLowerCase().includes(search) ||
                                (thread.from_email || '').toLowerCase().includes(search) ||
                                (thread.subject || '').toLowerCase().includes(search) ||
                                (thread.snippet || '').toLowerCase().includes(search);
                              if (!matchesSearch) return false;
                            }
                            // Status filter
                            if (poomkidsFilter === 'all') return true;
                            if (poomkidsFilter === 'new') return thread.status === 'new' || thread.unread;
                            if (poomkidsFilter === 'read') return thread.status === 'read' || (!thread.unread && thread.status !== 'resolved' && thread.status !== 'new' && thread.status !== 'sent');
                            if (poomkidsFilter === 'resolved') return thread.status === 'resolved';
                            if (poomkidsFilter === 'sent') return thread.status === 'sent';
                            return true;
                          })
                          .map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => openPoomkidsThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                              poomkidsSelectedThread?.id === thread.id ? 'bg-blue-50' : ''
                            } ${thread.status === 'new' || thread.unread ? 'bg-green-50' : ''} ${thread.status === 'resolved' ? 'bg-green-100' : ''} ${thread.status === 'sent' ? 'bg-purple-50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Checkbox for thread selection */}
                              <div className="mt-2">
                                <input
                                  type="checkbox"
                                  checked={poomkidsSelectedThreads.includes(thread.id)}
                                  onChange={(e) => togglePoomkidsThreadSelection(e, thread.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </div>
                              <div className="relative mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenStatusDropdown(
                                      openStatusDropdown?.module === 'poomkids' && openStatusDropdown?.threadId === thread.id
                                        ? null
                                        : { module: 'poomkids', threadId: thread.id }
                                    );
                                  }}
                                  className={`w-7 h-7 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                                    thread.status === 'resolved'
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : thread.status === 'read'
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : thread.status === 'new' || thread.unread
                                          ? 'bg-red-500 border-red-500 text-white'
                                          : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  title="Zmien status"
                                >
                                  {thread.status === 'resolved' ? '✓' : thread.status === 'read' ? '●' : thread.status === 'new' || thread.unread ? '!' : ''}
                                </button>
                                {openStatusDropdown?.module === 'poomkids' && openStatusDropdown?.threadId === thread.id && (
                                  <div className="absolute left-0 top-8 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 min-w-[140px]">
                                    <button
                                      onClick={(e) => { quickChangePoomkidsThreadStatus(e, thread.id, 'new'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-red-500"></span> Nowe
                                    </button>
                                    <button
                                      onClick={(e) => { quickChangePoomkidsThreadStatus(e, thread.id, 'read'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-blue-500"></span> Przeczytane
                                    </button>
                                    <button
                                      onClick={(e) => { quickChangePoomkidsThreadStatus(e, thread.id, 'resolved'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-green-500"></span> Rozwiazane
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
                                {(thread.from_name || thread.from_email || '?')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${thread.status === 'new' || thread.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {thread.from_name || thread.from_email || 'Nieznany'}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                                    {formatDate(thread.last_message_at)}
                                  </span>
                                </div>
                                <p className={`text-sm truncate ${thread.status === 'new' || thread.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                  {thread.subject || '(Brak tematu)'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{thread.snippet}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message view */}
                  <div className={`lg:w-2/3 flex flex-col ${!poomkidsSelectedThread && !poomkidsComposeMode ? 'hidden lg:flex' : ''}`}>
                    {poomkidsComposeMode ? (
                      /* Compose new email form */
                      <div className="flex-1 flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => {
                                setPoomkidsComposeMode(false);
                                setPoomkidsComposeTo('');
                                setPoomkidsComposeSubject('');
                                setPoomkidsComposeBody('');
                                setPoomkidsComposeAttachments([]);
                              }}
                              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              ← Anuluj
                            </button>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Nowa wiadomosc</h3>
                          </div>
                        </div>
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Do:</label>
                            <input
                              type="email"
                              value={poomkidsComposeTo}
                              onChange={(e) => setPoomkidsComposeTo(e.target.value)}
                              placeholder="adres@email.com"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temat:</label>
                            <input
                              type="text"
                              value={poomkidsComposeSubject}
                              onChange={(e) => setPoomkidsComposeSubject(e.target.value)}
                              placeholder="Temat wiadomosci"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tresc:</label>
                            <textarea
                              value={poomkidsComposeBody}
                              onChange={(e) => setPoomkidsComposeBody(e.target.value)}
                              placeholder="Napisz wiadomosc..."
                              rows={10}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                            />
                          </div>
                          {poomkidsComposeAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {poomkidsComposeAttachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  <span className="truncate max-w-[100px]">{file.name}</span>
                                  <button
                                    onClick={() => setPoomkidsComposeAttachments(prev => prev.filter((_, i) => i !== index))}
                                    className="text-gray-500 hover:text-red-500 ml-1"
                                  >×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                          <label className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center" title="Dodaj zalacznik">
                            <span>📎</span>
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setPoomkidsComposeAttachments(prev => [...prev, ...files]);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <div className="flex-1"></div>
                          <button
                            onClick={handlePoomkidsSendCompose}
                            disabled={poomkidsSending || !poomkidsComposeTo.trim() || !poomkidsComposeSubject.trim() || (!poomkidsComposeBody.trim() && poomkidsComposeAttachments.length === 0)}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                          >
                            {poomkidsSending ? 'Wysylanie...' : 'Wyslij'}
                          </button>
                        </div>
                      </div>
                    ) : !poomkidsSelectedThread ? (
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
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => { setPoomkidsSelectedThread(null); setPoomkidsSelectedMessages([]); }}
                              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              ← Wstecz
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setPoomkidsReplyText('');
                                  document.querySelector('#poomkids-reply-textarea')?.focus();
                                }}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Odpowiedz
                              </button>
                              <button
                                onClick={() => {
                                  // Get original message content for forwarding
                                  const originalMsg = poomkidsThreadMessages.length > 0 ? poomkidsThreadMessages[poomkidsThreadMessages.length - 1] : null;
                                  const forwardBody = originalMsg ? `\n\n---------- Przekazana wiadomosc ----------\nOd: ${poomkidsSelectedThread.from_email}\nData: ${originalMsg.sent_at ? new Date(originalMsg.sent_at).toLocaleString('pl-PL') : ''}\nTemat: ${poomkidsSelectedThread.subject}\n\n${originalMsg.body_text || ''}` : '';

                                  setPoomkidsComposeMode(true);
                                  setPoomkidsComposeTo('');
                                  setPoomkidsComposeSubject('Fwd: ' + (poomkidsSelectedThread.subject || '').replace(/^Fwd:\s*/i, ''));
                                  setPoomkidsComposeBody(forwardBody);
                                  setPoomkidsSelectedThread(null);
                                }}
                                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                Przekaz dalej
                              </button>
                              {poomkidsSelectedMessages.length > 0 && (
                                <button
                                  onClick={handlePoomkidsDeleteMessages}
                                  disabled={poomkidsDeleting}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  {poomkidsDeleting ? '...' : `Usun (${poomkidsSelectedMessages.length})`}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
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
                            poomkidsThreadMessages.map((msg) => {
                              const senderInitial = (msg.from_email || '?')[0].toUpperCase();
                              return (
                              <div
                                key={msg.id}
                                className={`flex items-start gap-2 ${msg.is_outgoing ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className="relative">
                                  {msg.is_outgoing ? (
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 flex items-center justify-center overflow-hidden z-10">
                                      <img src="/icons/poomkids.png" alt="" className="w-5 h-5 object-contain" />
                                    </div>
                                  ) : (
                                    <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-gray-100 border-2 border-white dark:border-gray-800 flex items-center justify-center text-gray-600 font-bold text-sm z-10">
                                      {senderInitial}
                                    </div>
                                  )}
                                  <div
                                    className={`max-w-[80%] min-w-[200px] px-4 py-3 rounded-lg ${
                                      msg.is_outgoing
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    <div className={`text-xs mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {msg.from_name || msg.from_email}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words text-sm">
                                      {parseMessageBody(msg.body_text, msg.is_outgoing)}
                                    </div>
                                    {(() => {
                                      const msgAttachments = Array.isArray(msg.attachments) ? msg.attachments : (typeof msg.attachments === 'string' ? JSON.parse(msg.attachments || '[]') : []);
                                      return msgAttachments.length > 0 && (
                                        <div className="mt-2">
                                          <p className={`text-[10px] mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>Zalaczniki:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {msgAttachments.map((att, i) => (
                                              <a
                                                key={i}
                                                href={`/api/gmail-poomkids/attachments/${msg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                                  msg.is_outgoing
                                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                                                }`}
                                              >
                                                <span>{getAttachmentIcon(att.mimeType)}</span>
                                                <span className="truncate max-w-[100px]">{att.filename}</span>
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                    <div className={`mt-2 text-xs ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>
                                      <span>{formatDate(msg.sent_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );})
                          )}
                        </div>

                        {/* Reply input */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          {/* Attachment preview */}
                          {poomkidsAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {poomkidsAttachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  <span>{getAttachmentIcon(file.type, file.name)}</span>
                                  <span className="truncate max-w-[100px]">{file.name}</span>
                                  <button
                                    onClick={() => setPoomkidsAttachments(prev => prev.filter((_, i) => i !== index))}
                                    className="text-gray-500 hover:text-red-500 ml-1"
                                  >×</button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <label className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center" title="Dodaj zalacznik">
                              <span>📎</span>
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  setPoomkidsAttachments(prev => [...prev, ...files]);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <textarea
                              id="poomkids-reply-textarea"
                              value={poomkidsReplyText}
                              onChange={(e) => setPoomkidsReplyText(e.target.value)}
                              placeholder="Napisz odpowiedz..."
                              rows={2}
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
                              disabled={poomkidsSending || (!poomkidsReplyText.trim() && poomkidsAttachments.length === 0)}
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

          {/* Shopify Allepoduszki (Gmail) */}
          {activeTab === 'allepoduszki' && (
            <div>
              {allepoduszkiAuth.loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
              ) : !allepoduszkiAuth.authenticated ? (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">📧</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Polacz z Gmail Allepoduszki</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Aby zobaczyc wiadomosci, musisz polaczyc konto allepoduszki.sklep@gmail.com</p>
                  <a
                    href="/api/gmail-allepoduszki/auth?action=login"
                    className="inline-block px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                  >
                    Zaloguj przez Google
                  </a>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-[800px]">
                  {/* Thread list */}
                  <div className={`lg:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${allepoduszkiSelectedThread ? 'hidden lg:flex' : ''}`}>
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">Wiadomosci Email</h2>
                        <p className="text-xs text-gray-500">
                          {allepoduszkiAuth.user?.email && <span className="text-purple-600">{allepoduszkiAuth.user.email}</span>}
                          {allepoduszkiAuth.user?.email && ' • '}
                          {allepoduszkiSyncStatus?.lastSyncAt ? `Sync: ${formatDate(allepoduszkiSyncStatus.lastSyncAt)}` : 'Nie zsynchronizowano'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {allepoduszkiSelectedThreads.length > 0 && (
                          <button
                            onClick={handleAllepoduszkiDeleteThreads}
                            disabled={allepoduszkiDeletingThreads}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                            title="Usun zaznaczone watki"
                          >
                            {allepoduszkiDeletingThreads ? '...' : `Usun (${allepoduszkiSelectedThreads.length})`}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setAllepoduszkiComposeMode(true);
                            setAllepoduszkiSelectedThread(null);
                          }}
                          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                          title="Nowa wiadomosc"
                        >
                          + Nowa
                        </button>
                        <button
                          onClick={handleAllepoduszkiSync}
                          disabled={allepoduszkiSyncing}
                          className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          title="Synchronizuj"
                        >
                          {allepoduszkiSyncing ? '⏳' : '🔄'}
                        </button>
                        <button
                          onClick={handleAllepoduszkiLogout}
                          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                          title="Wyloguj z Gmail"
                        >
                          Wyloguj
                        </button>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <input
                        type="text"
                        placeholder="Szukaj po nazwisku, emailu, temacie..."
                        value={allepoduszkiSearch}
                        onChange={(e) => setAllepoduszkiSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex gap-1 flex-wrap bg-gray-50 dark:bg-gray-800/50">
                      {[
                        { key: 'all', label: 'Wszystkie', count: allepoduszkiThreads.length, color: 'gray' },
                        { key: 'new', label: 'Nowe', count: allepoduszkiThreads.filter(t => t.status === 'new' || t.unread).length, color: 'red' },
                        { key: 'read', label: 'Przeczytane', count: allepoduszkiThreads.filter(t => t.status === 'read' || (!t.unread && t.status !== 'resolved')).length, color: 'blue' },
                        { key: 'resolved', label: 'Rozwiazane', count: allepoduszkiThreads.filter(t => t.status === 'resolved').length, color: 'green' },
                        { key: 'sent', label: 'Wyslane', count: allepoduszkiThreads.filter(t => t.status === 'sent').length, color: 'purple' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setAllepoduszkiFilter(tab.key)}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            allepoduszkiFilter === tab.key
                              ? tab.color === 'red' ? 'bg-red-500 text-white'
                                : tab.color === 'blue' ? 'bg-blue-500 text-white'
                                : tab.color === 'green' ? 'bg-green-500 text-white'
                                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {allepoduszkiThreadsLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
                      ) : allepoduszkiThreads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        allepoduszkiThreads
                          .filter(thread => {
                            // Search filter
                            if (allepoduszkiSearch.trim()) {
                              const search = allepoduszkiSearch.toLowerCase();
                              const matchesSearch =
                                (thread.from_name || '').toLowerCase().includes(search) ||
                                (thread.from_email || '').toLowerCase().includes(search) ||
                                (thread.subject || '').toLowerCase().includes(search) ||
                                (thread.snippet || '').toLowerCase().includes(search);
                              if (!matchesSearch) return false;
                            }
                            // Status filter
                            if (allepoduszkiFilter === 'all') return true;
                            if (allepoduszkiFilter === 'new') return thread.status === 'new' || thread.unread;
                            if (allepoduszkiFilter === 'read') return thread.status === 'read' || (!thread.unread && thread.status !== 'resolved' && thread.status !== 'new' && thread.status !== 'sent');
                            if (allepoduszkiFilter === 'resolved') return thread.status === 'resolved';
                            if (allepoduszkiFilter === 'sent') return thread.status === 'sent';
                            return true;
                          })
                          .map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => openAllepoduszkiThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                              allepoduszkiSelectedThread?.id === thread.id ? 'bg-blue-50' : ''
                            } ${thread.status === 'new' || thread.unread ? 'bg-purple-50' : ''} ${thread.status === 'resolved' ? 'bg-green-50' : ''} ${thread.status === 'sent' ? 'bg-purple-100' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Checkbox for thread selection */}
                              <div className="mt-2">
                                <input
                                  type="checkbox"
                                  checked={allepoduszkiSelectedThreads.includes(thread.id)}
                                  onChange={(e) => toggleAllepoduszkiThreadSelection(e, thread.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                              </div>
                              <div className="relative mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenStatusDropdown(
                                      openStatusDropdown?.module === 'allepoduszki' && openStatusDropdown?.threadId === thread.id
                                        ? null
                                        : { module: 'allepoduszki', threadId: thread.id }
                                    );
                                  }}
                                  className={`w-7 h-7 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                                    thread.status === 'resolved'
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : thread.status === 'read'
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : thread.status === 'new' || thread.unread
                                          ? 'bg-red-500 border-red-500 text-white'
                                          : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  title="Zmien status"
                                >
                                  {thread.status === 'resolved' ? '✓' : thread.status === 'read' ? '●' : thread.status === 'new' || thread.unread ? '!' : ''}
                                </button>
                                {openStatusDropdown?.module === 'allepoduszki' && openStatusDropdown?.threadId === thread.id && (
                                  <div className="absolute left-0 top-8 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 min-w-[140px]">
                                    <button
                                      onClick={(e) => { quickChangeAllepoduszkiThreadStatus(e, thread.id, 'new'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-red-500"></span> Nowe
                                    </button>
                                    <button
                                      onClick={(e) => { quickChangeAllepoduszkiThreadStatus(e, thread.id, 'read'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-blue-500"></span> Przeczytane
                                    </button>
                                    <button
                                      onClick={(e) => { quickChangeAllepoduszkiThreadStatus(e, thread.id, 'resolved'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-green-500"></span> Rozwiazane
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                                {(thread.from_name || thread.from_email || '?')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${thread.status === 'new' || thread.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {thread.from_name || thread.from_email || 'Nieznany'}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                                    {formatDate(thread.last_message_at)}
                                  </span>
                                </div>
                                <p className={`text-sm truncate ${thread.status === 'new' || thread.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                  {thread.subject || '(Brak tematu)'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{thread.snippet}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message view */}
                  <div className={`lg:w-2/3 flex flex-col ${!allepoduszkiSelectedThread ? 'hidden lg:flex' : ''}`}>
                    {!allepoduszkiSelectedThread ? (
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
                            onClick={() => setAllepoduszkiSelectedThread(null)}
                            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
                          >
                            ← Wstecz
                          </button>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                              {(allepoduszkiSelectedThread.from_name || allepoduszkiSelectedThread.from_email || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {allepoduszkiSelectedThread.from_name || allepoduszkiSelectedThread.from_email || 'Nieznany'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{allepoduszkiSelectedThread.from_email}</p>
                            </div>
                          </div>
                          <h4 className="mt-2 font-medium text-gray-800 dark:text-gray-200">
                            {allepoduszkiSelectedThread.subject || '(Brak tematu)'}
                          </h4>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                          {allepoduszkiMessagesLoading ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Ladowanie wiadomosci...</div>
                          ) : allepoduszkiThreadMessages.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Brak wiadomosci</div>
                          ) : (
                            allepoduszkiThreadMessages.map((msg) => {
                              const msgAttachments = Array.isArray(msg.attachments) ? msg.attachments : (typeof msg.attachments === 'string' ? JSON.parse(msg.attachments || '[]') : []);
                              const senderInitial = (msg.from_email || '?')[0].toUpperCase();
                              return (
                              <div
                                key={msg.id}
                                className={`flex items-start gap-2 ${msg.is_outgoing ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className="relative">
                                  {msg.is_outgoing ? (
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 flex items-center justify-center overflow-hidden z-10">
                                      <img src="/icons/allepoduszki.png" alt="" className="w-5 h-5 object-contain" />
                                    </div>
                                  ) : (
                                    <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-gray-100 border-2 border-white dark:border-gray-800 flex items-center justify-center text-gray-600 font-bold text-sm z-10">
                                      {senderInitial}
                                    </div>
                                  )}
                                  <div
                                    className={`max-w-[80%] min-w-[200px] px-4 py-3 rounded-lg ${
                                      msg.is_outgoing
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    <div className={`text-xs mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {msg.from_name || msg.from_email}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words text-sm">
                                      {parseMessageBody(msg.body_text, msg.is_outgoing)}
                                    </div>
                                    {msgAttachments.length > 0 && (
                                      <div className="mt-2">
                                        <p className={`text-[10px] mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>Zalaczniki:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {msgAttachments.map((att, i) => (
                                            <a
                                              key={i}
                                              href={`/api/gmail-allepoduszki/attachments/${msg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                                msg.is_outgoing
                                                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                                  : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                                              }`}
                                            >
                                              <span>{getAttachmentIcon(att.mimeType)}</span>
                                              <span className="truncate max-w-[100px]">{att.filename}</span>
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <div className={`mt-2 text-xs ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>
                                      <span>{formatDate(msg.sent_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );})
                          )}
                        </div>

                        {/* Reply input */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          {/* Attachment preview */}
                          {allepoduszkiAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {allepoduszkiAttachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  <span>{getAttachmentIcon(file.type, file.name)}</span>
                                  <span className="truncate max-w-[100px]">{file.name}</span>
                                  <button
                                    onClick={() => setAllepoduszkiAttachments(prev => prev.filter((_, i) => i !== index))}
                                    className="text-gray-500 hover:text-red-500 ml-1"
                                  >×</button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <label className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center" title="Dodaj zalacznik">
                              <span>📎</span>
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  setAllepoduszkiAttachments(prev => [...prev, ...files]);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <textarea
                              value={allepoduszkiReplyText}
                              onChange={(e) => setAllepoduszkiReplyText(e.target.value)}
                              placeholder="Napisz odpowiedz..."
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAllepoduszkiSendReply();
                                }
                              }}
                            />
                            <button
                              onClick={handleAllepoduszkiSendReply}
                              disabled={allepoduszkiSending || (!allepoduszkiReplyText.trim() && allepoduszkiAttachments.length === 0)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                              {allepoduszkiSending ? '...' : 'Wyslij'}
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

          {/* Shopify poom-furniture.com (Gmail) */}
          {activeTab === 'poomfurniture' && (
            <div>
              {poomfurnitureAuth.loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
              ) : !poomfurnitureAuth.authenticated ? (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">📧</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Polacz z Gmail poom-furniture.com</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Aby zobaczyc wiadomosci, musisz polaczyc konto kontakt.poom@gmail.com</p>
                  <a
                    href="/api/gmail-poomfurniture/auth?action=login"
                    className="inline-block px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium"
                  >
                    Zaloguj przez Google
                  </a>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-[800px]">
                  {/* Thread list */}
                  <div className={`lg:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${poomfurnitureSelectedThread ? 'hidden lg:flex' : ''}`}>
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">Wiadomosci Email</h2>
                        <p className="text-xs text-gray-500">
                          {poomfurnitureAuth.user?.email && <span className="text-teal-600">{poomfurnitureAuth.user.email}</span>}
                          {poomfurnitureAuth.user?.email && ' • '}
                          {poomfurnitureSyncStatus?.lastSyncAt ? `Sync: ${formatDate(poomfurnitureSyncStatus.lastSyncAt)}` : 'Nie zsynchronizowano'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {poomfurnitureSelectedThreads.length > 0 && (
                          <button
                            onClick={handlePoomfurnitureDeleteThreads}
                            disabled={poomfurnitureDeletingThreads}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                            title="Usun zaznaczone watki"
                          >
                            {poomfurnitureDeletingThreads ? '...' : `Usun (${poomfurnitureSelectedThreads.length})`}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setPoomfurnitureComposeMode(true);
                            setPoomfurnitureSelectedThread(null);
                          }}
                          className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                          title="Nowa wiadomosc"
                        >
                          + Nowa
                        </button>
                        <button
                          onClick={handlePoomfurnitureSync}
                          disabled={poomfurnitureSyncing}
                          className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          title="Synchronizuj"
                        >
                          {poomfurnitureSyncing ? '⏳' : '🔄'}
                        </button>
                        <button
                          onClick={handlePoomfurnitureLogout}
                          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                          title="Wyloguj z Gmail"
                        >
                          Wyloguj
                        </button>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <input
                        type="text"
                        placeholder="Szukaj po nazwisku, emailu, temacie..."
                        value={poomfurnitureSearch}
                        onChange={(e) => setPoomfurnitureSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex gap-1 flex-wrap bg-gray-50 dark:bg-gray-800/50">
                      {[
                        { key: 'all', label: 'Wszystkie', count: poomfurnitureThreads.length, color: 'gray' },
                        { key: 'new', label: 'Nowe', count: poomfurnitureThreads.filter(t => t.status === 'new' || t.unread).length, color: 'red' },
                        { key: 'read', label: 'Przeczytane', count: poomfurnitureThreads.filter(t => t.status === 'read' || (!t.unread && t.status !== 'resolved')).length, color: 'blue' },
                        { key: 'resolved', label: 'Rozwiazane', count: poomfurnitureThreads.filter(t => t.status === 'resolved').length, color: 'green' },
                        { key: 'sent', label: 'Wyslane', count: poomfurnitureThreads.filter(t => t.status === 'sent').length, color: 'purple' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setPoomfurnitureFilter(tab.key)}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            poomfurnitureFilter === tab.key
                              ? tab.color === 'red' ? 'bg-red-500 text-white'
                                : tab.color === 'blue' ? 'bg-blue-500 text-white'
                                : tab.color === 'green' ? 'bg-green-500 text-white'
                                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {poomfurnitureThreadsLoading ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Ladowanie...</div>
                      ) : poomfurnitureThreads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        poomfurnitureThreads
                          .filter(thread => {
                            // Search filter
                            if (poomfurnitureSearch.trim()) {
                              const search = poomfurnitureSearch.toLowerCase();
                              const matchesSearch =
                                (thread.from_name || '').toLowerCase().includes(search) ||
                                (thread.from_email || '').toLowerCase().includes(search) ||
                                (thread.subject || '').toLowerCase().includes(search) ||
                                (thread.snippet || '').toLowerCase().includes(search);
                              if (!matchesSearch) return false;
                            }
                            // Status filter
                            if (poomfurnitureFilter === 'all') return true;
                            if (poomfurnitureFilter === 'new') return thread.status === 'new' || thread.unread;
                            if (poomfurnitureFilter === 'read') return thread.status === 'read' || (!thread.unread && thread.status !== 'resolved' && thread.status !== 'new' && thread.status !== 'sent');
                            if (poomfurnitureFilter === 'resolved') return thread.status === 'resolved';
                            if (poomfurnitureFilter === 'sent') return thread.status === 'sent';
                            return true;
                          })
                          .map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => openPoomfurnitureThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                              poomfurnitureSelectedThread?.id === thread.id ? 'bg-blue-50' : ''
                            } ${thread.status === 'new' || thread.unread ? 'bg-teal-50' : ''} ${thread.status === 'resolved' ? 'bg-green-50' : ''} ${thread.status === 'sent' ? 'bg-purple-50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Checkbox for thread selection */}
                              <div className="mt-2">
                                <input
                                  type="checkbox"
                                  checked={poomfurnitureSelectedThreads.includes(thread.id)}
                                  onChange={(e) => togglePoomfurnitureThreadSelection(e, thread.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                              </div>
                              <div className="relative mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenStatusDropdown(
                                      openStatusDropdown?.module === 'poomfurniture' && openStatusDropdown?.threadId === thread.id
                                        ? null
                                        : { module: 'poomfurniture', threadId: thread.id }
                                    );
                                  }}
                                  className={`w-7 h-7 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                                    thread.status === 'resolved'
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : thread.status === 'read'
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : thread.status === 'new' || thread.unread
                                          ? 'bg-red-500 border-red-500 text-white'
                                          : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  title="Zmien status"
                                >
                                  {thread.status === 'resolved' ? '✓' : thread.status === 'read' ? '●' : thread.status === 'new' || thread.unread ? '!' : ''}
                                </button>
                                {openStatusDropdown?.module === 'poomfurniture' && openStatusDropdown?.threadId === thread.id && (
                                  <div className="absolute left-0 top-8 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 min-w-[140px]">
                                    <button
                                      onClick={(e) => { quickChangePoomfurnitureThreadStatus(e, thread.id, 'new'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-red-500"></span> Nowe
                                    </button>
                                    <button
                                      onClick={(e) => { quickChangePoomfurnitureThreadStatus(e, thread.id, 'read'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-blue-500"></span> Przeczytane
                                    </button>
                                    <button
                                      onClick={(e) => { quickChangePoomfurnitureThreadStatus(e, thread.id, 'resolved'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-green-500"></span> Rozwiazane
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-medium">
                                {(thread.from_name || thread.from_email || '?')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${thread.status === 'new' || thread.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {thread.from_name || thread.from_email || 'Nieznany'}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                                    {formatDate(thread.last_message_at)}
                                  </span>
                                </div>
                                <p className={`text-sm truncate ${thread.status === 'new' || thread.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                  {thread.subject || '(Brak tematu)'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{thread.snippet}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message view */}
                  <div className={`lg:w-2/3 flex flex-col ${!poomfurnitureSelectedThread ? 'hidden lg:flex' : ''}`}>
                    {!poomfurnitureSelectedThread ? (
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
                            onClick={() => setPoomfurnitureSelectedThread(null)}
                            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
                          >
                            ← Wstecz
                          </button>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-medium">
                              {(poomfurnitureSelectedThread.from_name || poomfurnitureSelectedThread.from_email || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {poomfurnitureSelectedThread.from_name || poomfurnitureSelectedThread.from_email || 'Nieznany'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{poomfurnitureSelectedThread.from_email}</p>
                            </div>
                          </div>
                          <h4 className="mt-2 font-medium text-gray-800 dark:text-gray-200">
                            {poomfurnitureSelectedThread.subject || '(Brak tematu)'}
                          </h4>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                          {poomfurnitureMessagesLoading ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Ladowanie wiadomosci...</div>
                          ) : poomfurnitureThreadMessages.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">Brak wiadomosci</div>
                          ) : (
                            poomfurnitureThreadMessages.map((msg) => {
                              const msgAttachments = Array.isArray(msg.attachments) ? msg.attachments : (typeof msg.attachments === 'string' ? JSON.parse(msg.attachments || '[]') : []);
                              const senderInitial = (msg.from_email || '?')[0].toUpperCase();
                              return (
                              <div
                                key={msg.id}
                                className={`flex items-start gap-2 ${msg.is_outgoing ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className="relative">
                                  {msg.is_outgoing ? (
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 flex items-center justify-center overflow-hidden z-10">
                                      <img src="/icons/poom-furniture.png" alt="" className="w-5 h-5 object-contain" />
                                    </div>
                                  ) : (
                                    <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-gray-100 border-2 border-white dark:border-gray-800 flex items-center justify-center text-gray-600 font-bold text-sm z-10">
                                      {senderInitial}
                                    </div>
                                  )}
                                  <div
                                    className={`max-w-[80%] min-w-[200px] px-4 py-3 rounded-lg ${
                                      msg.is_outgoing
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    <div className={`text-xs mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {msg.from_name || msg.from_email}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words text-sm">
                                      {parseMessageBody(msg.body_text, msg.is_outgoing)}
                                    </div>
                                    {msgAttachments.length > 0 && (
                                      <div className="mt-2">
                                        <p className={`text-[10px] mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>Zalaczniki:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {msgAttachments.map((att, i) => (
                                            <a
                                              key={i}
                                              href={`/api/gmail-poomfurniture/attachments/${msg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                                msg.is_outgoing
                                                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                                  : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                                              }`}
                                            >
                                              <span>{getAttachmentIcon(att.mimeType)}</span>
                                              <span className="truncate max-w-[100px]">{att.filename}</span>
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <div className={`mt-2 text-xs ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>
                                      <span>{formatDate(msg.sent_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                            })
                          )}
                        </div>

                        {/* Reply input */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          {/* Attachment preview */}
                          {poomfurnitureAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {poomfurnitureAttachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  <span>{getAttachmentIcon(file.type, file.name)}</span>
                                  <span className="truncate max-w-[100px]">{file.name}</span>
                                  <button
                                    onClick={() => setPoomfurnitureAttachments(prev => prev.filter((_, i) => i !== index))}
                                    className="text-gray-500 hover:text-red-500 ml-1"
                                  >×</button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <label className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center" title="Dodaj zalacznik">
                              <span>📎</span>
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  setPoomfurnitureAttachments(prev => [...prev, ...files]);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <textarea
                              value={poomfurnitureReplyText}
                              onChange={(e) => setPoomfurnitureReplyText(e.target.value)}
                              placeholder="Napisz odpowiedz..."
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handlePoomfurnitureSendReply();
                                }
                              }}
                            />
                            <button
                              onClick={handlePoomfurnitureSendReply}
                              disabled={poomfurnitureSending || (!poomfurnitureReplyText.trim() && poomfurnitureAttachments.length === 0)}
                              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                            >
                              {poomfurnitureSending ? '...' : 'Wyslij'}
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
