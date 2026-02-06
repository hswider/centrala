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
  const [replyAttachments, setReplyAttachments] = useState([]);
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
  const [gmailRefreshing, setGmailRefreshing] = useState(false);
  const [gmailReplyText, setGmailReplyText] = useState('');
  const [gmailReplyAll, setGmailReplyAll] = useState(false);
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

  // Lightbox state for image preview
  const [lightboxImage, setLightboxImage] = useState(null); // { url: '', filename: '' }

  // Gmail POOMKIDS (Shopify POOMKIDS) state
  const [poomkidsAuth, setPoomkidsAuth] = useState({ authenticated: false, user: null, loading: true });
  const [poomkidsThreads, setPoomkidsThreads] = useState([]);
  const [poomkidsThreadsLoading, setPoomkidsThreadsLoading] = useState(false);
  const [poomkidsSelectedThread, setPoomkidsSelectedThread] = useState(null);
  const [poomkidsThreadMessages, setPoomkidsThreadMessages] = useState([]);
  const [poomkidsMessagesLoading, setPoomkidsMessagesLoading] = useState(false);
  const [poomkidsReplyText, setPoomkidsReplyText] = useState('');
  const [poomkidsReplyAll, setPoomkidsReplyAll] = useState(false);
  const [poomkidsRefreshing, setPoomkidsRefreshing] = useState(false);
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
  const [allepoduszkiReplyAll, setAllepoduszkiReplyAll] = useState(false);
  const [allepoduszkiRefreshing, setAllepoduszkiRefreshing] = useState(false);
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
  const [poomfurnitureReplyAll, setPoomfurnitureReplyAll] = useState(false);
  const [poomfurnitureRefreshing, setPoomfurnitureRefreshing] = useState(false);
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

  // Task/note creation state
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [taskContent, setTaskContent] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskSending, setTaskSending] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [threadTasks, setThreadTasks] = useState([]);
  const [pendingThreadId, setPendingThreadId] = useState(null);

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

    // Handle task navigation parameters
    const tabParam = searchParams.get('tab');
    const threadParam = searchParams.get('thread');
    if (tabParam) {
      setActiveTab(tabParam);
      if (threadParam) {
        setPendingThreadId(threadParam);
      }
      // Clear URL params after handling
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

  // Fetch current user and all users for task assignment
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    const fetchAllUsers = async () => {
      try {
        const res = await fetch('/api/users/online');
        const data = await res.json();
        if (data.success) {
          setAllUsers(data.users);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchCurrentUser();
    fetchAllUsers();
  }, []);

  // Create a task/note for another user
  const handleCreateTask = async (threadId, threadType) => {
    if (!taskContent.trim() || !taskAssignee || !currentUser?.username) return;

    setTaskSending(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdBy: currentUser.username,
          assignedTo: taskAssignee,
          content: taskContent,
          threadId: threadId || null,
          threadType: threadType || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setTaskContent('');
        setTaskAssignee('');
        setShowTaskForm(false);
        // Refresh thread tasks
        fetchThreadTasks(threadId, threadType);
        alert('Uwaga zostala wyslana!');
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setTaskSending(false);
    }
  };

  // Fetch tasks for a specific thread
  const fetchThreadTasks = async (threadId, threadType) => {
    if (!threadId || !threadType) {
      setThreadTasks([]);
      return;
    }
    try {
      const res = await fetch(`/api/tasks?threadId=${threadId}&threadType=${threadType}`);
      const data = await res.json();
      if (data.success) {
        setThreadTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching thread tasks:', err);
    }
  };

  // Complete a thread task
  const handleCompleteThreadTask = async (taskId) => {
    if (!currentUser?.username) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, username: currentUser.username })
      });
      const data = await res.json();
      if (data.success) {
        // Update local state to mark task as completed
        setThreadTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, status: 'completed', completed_at: new Date().toISOString() } : t
        ));
      }
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

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
    if ((!replyText.trim() && replyAttachments.length === 0) || !selectedThread) return;

    setSending(true);
    try {
      // Upload attachments first
      let attachmentIds = [];
      for (const file of replyAttachments) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/allegro/attachments/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          attachmentIds.push(uploadData.attachmentId);
        } else {
          alert('Blad uploadu zalacznika: ' + uploadData.error);
          setSending(false);
          return;
        }
      }

      const res = await fetch(`/api/allegro/messages/${selectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim(), attachmentIds })
      });
      const data = await res.json();

      if (data.success) {
        setReplyText('');
        setReplyAttachments([]);
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
    setThreadTasks([]);
    fetchThreadTasks(thread.id, 'shopify');

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

  // Refresh single Gmail thread from server
  const handleRefreshThread = async () => {
    if (!gmailSelectedThread) return;
    setGmailRefreshing(true);
    try {
      const res = await fetch(`/api/gmail/messages/${gmailSelectedThread.id}?refresh=true`);
      const data = await res.json();
      if (data.success) {
        setGmailThreadMessages(data.messages || []);
        // Update thread info if available
        if (data.thread) {
          setGmailSelectedThread(prev => ({ ...prev, ...data.thread }));
        }
      }
    } catch (err) {
      console.error('Error refreshing thread:', err);
    } finally {
      setGmailRefreshing(false);
    }
  };

  // Send Gmail reply
  const handleGmailSendReply = async () => {
    if ((!gmailReplyText.trim() && gmailAttachments.length === 0) || !gmailSelectedThread) return;

    // Validate attachment size
    if (gmailAttachments.length > 0) {
      const validation = validateAttachmentsSize(gmailAttachments);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    // Determine reply recipient - if thread is from us, find customer email
    const ownEmail = gmailAuth.user?.email?.toLowerCase() || '';
    let replyTo = gmailSelectedThread.from_email;
    if (ownEmail && gmailSelectedThread.from_email?.toLowerCase() === ownEmail) {
      const incomingMsg = [...gmailThreadMessages].reverse().find(m => !m.is_outgoing);
      if (incomingMsg?.from_email) {
        replyTo = incomingMsg.from_email;
      } else {
        const outgoingMsg = gmailThreadMessages.find(m => m.is_outgoing && m.to_email);
        if (outgoingMsg?.to_email) {
          replyTo = outgoingMsg.to_email;
        }
      }
    }

    // Collect CC addresses for Reply All
    let ccAddresses = null;
    if (gmailReplyAll) {
      const allEmails = new Set();
      // Add all unique CC addresses from thread messages
      gmailThreadMessages.forEach(msg => {
        if (msg.cc_email) {
          msg.cc_email.split(',').forEach(email => {
            const trimmed = email.trim().toLowerCase();
            if (trimmed && trimmed !== ownEmail && trimmed !== replyTo?.toLowerCase()) {
              allEmails.add(email.trim());
            }
          });
        }
        // Also add To addresses (except our own and the primary recipient)
        if (msg.to_email && !msg.is_outgoing) {
          msg.to_email.split(',').forEach(email => {
            const trimmed = email.trim().toLowerCase();
            if (trimmed && trimmed !== ownEmail && trimmed !== replyTo?.toLowerCase()) {
              allEmails.add(email.trim());
            }
          });
        }
      });
      // Add original sender to CC if they're not the primary recipient
      const origSender = gmailSelectedThread.from_email;
      if (origSender && origSender.toLowerCase() !== ownEmail && origSender.toLowerCase() !== replyTo?.toLowerCase()) {
        allEmails.add(origSender);
      }
      if (allEmails.size > 0) {
        ccAddresses = Array.from(allEmails).join(', ');
      }
    }

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
          to: replyTo,
          cc: ccAddresses,
          subject: gmailSelectedThread.subject,
          attachments: attachmentData
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText.includes('Request Entity Too Large') ? 'Zalaczniki sa za duze. Maksymalny rozmiar to 15MB.' : `Blad serwera: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setGmailReplyText('');
        setGmailReplyAll(false);
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
    setThreadTasks([]);
    fetchThreadTasks(thread.id, 'poomkids');

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

  // Refresh single POOMKIDS thread from server
  const handleRefreshPoomkidsThread = async () => {
    if (!poomkidsSelectedThread) return;
    setPoomkidsRefreshing(true);
    try {
      const res = await fetch(`/api/gmail-poomkids/messages/${poomkidsSelectedThread.id}?refresh=true`);
      const data = await res.json();
      if (data.success) {
        setPoomkidsThreadMessages(data.messages || []);
        if (data.thread) {
          setPoomkidsSelectedThread(prev => ({ ...prev, ...data.thread }));
        }
      }
    } catch (err) {
      console.error('Error refreshing POOMKIDS thread:', err);
    } finally {
      setPoomkidsRefreshing(false);
    }
  };

  // Send POOMKIDS reply
  const handlePoomkidsSendReply = async () => {
    if ((!poomkidsReplyText.trim() && poomkidsAttachments.length === 0) || !poomkidsSelectedThread) return;

    // Validate attachment size
    if (poomkidsAttachments.length > 0) {
      const validation = validateAttachmentsSize(poomkidsAttachments);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    // Determine reply recipient - if thread is from us, find customer email
    const ownEmail = poomkidsAuth.user?.email?.toLowerCase() || '';
    let replyTo = poomkidsSelectedThread.from_email;
    if (ownEmail && poomkidsSelectedThread.from_email?.toLowerCase() === ownEmail) {
      const incomingMsg = [...poomkidsThreadMessages].reverse().find(m => !m.is_outgoing);
      if (incomingMsg?.from_email) {
        replyTo = incomingMsg.from_email;
      } else {
        const outgoingMsg = poomkidsThreadMessages.find(m => m.is_outgoing && m.to_email);
        if (outgoingMsg?.to_email) {
          replyTo = outgoingMsg.to_email;
        }
      }
    }

    // Collect CC addresses for Reply All
    let ccAddresses = null;
    if (poomkidsReplyAll) {
      const allEmails = new Set();
      poomkidsThreadMessages.forEach(msg => {
        if (msg.cc_email) {
          msg.cc_email.split(',').forEach(email => {
            const trimmed = email.trim().toLowerCase();
            if (trimmed && trimmed !== ownEmail && trimmed !== replyTo?.toLowerCase()) {
              allEmails.add(email.trim());
            }
          });
        }
        if (msg.to_email && !msg.is_outgoing) {
          msg.to_email.split(',').forEach(email => {
            const trimmed = email.trim().toLowerCase();
            if (trimmed && trimmed !== ownEmail && trimmed !== replyTo?.toLowerCase()) {
              allEmails.add(email.trim());
            }
          });
        }
      });
      const origSender = poomkidsSelectedThread.from_email;
      if (origSender && origSender.toLowerCase() !== ownEmail && origSender.toLowerCase() !== replyTo?.toLowerCase()) {
        allEmails.add(origSender);
      }
      if (allEmails.size > 0) {
        ccAddresses = Array.from(allEmails).join(', ');
      }
    }

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
          to: replyTo,
          cc: ccAddresses,
          subject: poomkidsSelectedThread.subject,
          attachments: attachmentData
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText.includes('Request Entity Too Large') ? 'Zalaczniki sa za duze. Maksymalny rozmiar to 15MB.' : `Blad serwera: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setPoomkidsReplyText('');
        setPoomkidsReplyAll(false);
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

    // Validate attachment size
    if (poomkidsComposeAttachments.length > 0) {
      const validation = validateAttachmentsSize(poomkidsComposeAttachments);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

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

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText.includes('Request Entity Too Large') ? 'Zalaczniki sa za duze. Maksymalny rozmiar to 15MB.' : `Blad serwera: ${res.status}`);
      }

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

  // Send new composed email for Gmail (Dobrelegowiska)
  const handleGmailSendCompose = async () => {
    if (!gmailComposeTo.trim() || !gmailComposeSubject.trim() || (!gmailComposeBody.trim() && gmailComposeAttachments.length === 0)) return;

    // Validate attachment size
    if (gmailComposeAttachments.length > 0) {
      const validation = validateAttachmentsSize(gmailComposeAttachments);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    setGmailSending(true);
    try {
      const attachmentData = await Promise.all(gmailComposeAttachments.map(file => {
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

      const res = await fetch('/api/gmail/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: gmailComposeTo.trim(),
          subject: gmailComposeSubject.trim(),
          text: gmailComposeBody.trim(),
          attachments: attachmentData
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText.includes('Request Entity Too Large') ? 'Zalaczniki sa za duze. Maksymalny rozmiar to 15MB.' : `Blad serwera: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setGmailComposeTo('');
        setGmailComposeSubject('');
        setGmailComposeBody('');
        setGmailComposeAttachments([]);
        setGmailComposeMode(false);
        await handleGmailSync();
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setGmailSending(false);
    }
  };

  // Send new composed email for Allepoduszki
  const handleAllepoduszkiSendCompose = async () => {
    if (!allepoduszkiComposeTo.trim() || !allepoduszkiComposeSubject.trim() || (!allepoduszkiComposeBody.trim() && allepoduszkiComposeAttachments.length === 0)) return;

    // Validate attachment size
    if (allepoduszkiComposeAttachments.length > 0) {
      const validation = validateAttachmentsSize(allepoduszkiComposeAttachments);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    setAllepoduszkiSending(true);
    try {
      const attachmentData = await Promise.all(allepoduszkiComposeAttachments.map(file => {
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

      const res = await fetch('/api/gmail-allepoduszki/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: allepoduszkiComposeTo.trim(),
          subject: allepoduszkiComposeSubject.trim(),
          text: allepoduszkiComposeBody.trim(),
          attachments: attachmentData
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText.includes('Request Entity Too Large') ? 'Zalaczniki sa za duze. Maksymalny rozmiar to 15MB.' : `Blad serwera: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setAllepoduszkiComposeTo('');
        setAllepoduszkiComposeSubject('');
        setAllepoduszkiComposeBody('');
        setAllepoduszkiComposeAttachments([]);
        setAllepoduszkiComposeMode(false);
        await handleAllepoduszkiSync();
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setAllepoduszkiSending(false);
    }
  };

  // Send new composed email for Poomfurniture
  const handlePoomfurnitureSendCompose = async () => {
    if (!poomfurnitureComposeTo.trim() || !poomfurnitureComposeSubject.trim() || (!poomfurnitureComposeBody.trim() && poomfurnitureComposeAttachments.length === 0)) return;

    // Validate attachment size
    if (poomfurnitureComposeAttachments.length > 0) {
      const validation = validateAttachmentsSize(poomfurnitureComposeAttachments);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    setPoomfurnitureSending(true);
    try {
      const attachmentData = await Promise.all(poomfurnitureComposeAttachments.map(file => {
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

      const res = await fetch('/api/gmail-poomfurniture/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: poomfurnitureComposeTo.trim(),
          subject: poomfurnitureComposeSubject.trim(),
          text: poomfurnitureComposeBody.trim(),
          attachments: attachmentData
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText.includes('Request Entity Too Large') ? 'Zalaczniki sa za duze. Maksymalny rozmiar to 15MB.' : `Blad serwera: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setPoomfurnitureComposeTo('');
        setPoomfurnitureComposeSubject('');
        setPoomfurnitureComposeBody('');
        setPoomfurnitureComposeAttachments([]);
        setPoomfurnitureComposeMode(false);
        await handlePoomfurnitureSync();
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setPoomfurnitureSending(false);
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
    setThreadTasks([]);
    fetchThreadTasks(thread.id, 'allepoduszki');

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

  // Refresh single ALLEPODUSZKI thread from server
  const handleRefreshAllepoduszkiThread = async () => {
    if (!allepoduszkiSelectedThread) return;
    setAllepoduszkiRefreshing(true);
    try {
      const res = await fetch(`/api/gmail-allepoduszki/messages/${allepoduszkiSelectedThread.id}?refresh=true`);
      const data = await res.json();
      if (data.success) {
        setAllepoduszkiThreadMessages(data.messages || []);
        if (data.thread) {
          setAllepoduszkiSelectedThread(prev => ({ ...prev, ...data.thread }));
        }
      }
    } catch (err) {
      console.error('Error refreshing ALLEPODUSZKI thread:', err);
    } finally {
      setAllepoduszkiRefreshing(false);
    }
  };

  // Send ALLEPODUSZKI reply
  const handleAllepoduszkiSendReply = async () => {
    if ((!allepoduszkiReplyText.trim() && allepoduszkiAttachments.length === 0) || !allepoduszkiSelectedThread) return;

    // Validate attachment size
    if (allepoduszkiAttachments.length > 0) {
      const validation = validateAttachmentsSize(allepoduszkiAttachments);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    // Determine reply recipient - if thread is from us, find customer email
    const ownEmail = allepoduszkiAuth.user?.email?.toLowerCase() || '';
    let replyTo = allepoduszkiSelectedThread.from_email;
    if (ownEmail && allepoduszkiSelectedThread.from_email?.toLowerCase() === ownEmail) {
      const incomingMsg = [...allepoduszkiThreadMessages].reverse().find(m => !m.is_outgoing);
      if (incomingMsg?.from_email) {
        replyTo = incomingMsg.from_email;
      } else {
        const outgoingMsg = allepoduszkiThreadMessages.find(m => m.is_outgoing && m.to_email);
        if (outgoingMsg?.to_email) {
          replyTo = outgoingMsg.to_email;
        }
      }
    }

    // Collect CC addresses for Reply All
    let ccAddresses = null;
    if (allepoduszkiReplyAll) {
      const allEmails = new Set();
      allepoduszkiThreadMessages.forEach(msg => {
        if (msg.cc_email) {
          msg.cc_email.split(',').forEach(email => {
            const trimmed = email.trim().toLowerCase();
            if (trimmed && trimmed !== ownEmail && trimmed !== replyTo?.toLowerCase()) {
              allEmails.add(email.trim());
            }
          });
        }
        if (msg.to_email && !msg.is_outgoing) {
          msg.to_email.split(',').forEach(email => {
            const trimmed = email.trim().toLowerCase();
            if (trimmed && trimmed !== ownEmail && trimmed !== replyTo?.toLowerCase()) {
              allEmails.add(email.trim());
            }
          });
        }
      });
      const origSender = allepoduszkiSelectedThread.from_email;
      if (origSender && origSender.toLowerCase() !== ownEmail && origSender.toLowerCase() !== replyTo?.toLowerCase()) {
        allEmails.add(origSender);
      }
      if (allEmails.size > 0) {
        ccAddresses = Array.from(allEmails).join(', ');
      }
    }

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
          to: replyTo,
          cc: ccAddresses,
          subject: allepoduszkiSelectedThread.subject,
          attachments: attachmentData
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText.includes('Request Entity Too Large') ? 'Zalaczniki sa za duze. Maksymalny rozmiar to 15MB.' : `Blad serwera: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setAllepoduszkiReplyText('');
        setAllepoduszkiReplyAll(false);
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
    setThreadTasks([]);
    fetchThreadTasks(thread.id, 'poomfurniture');

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

  // Refresh single POOMFURNITURE thread from server
  const handleRefreshPoomfurnitureThread = async () => {
    if (!poomfurnitureSelectedThread) return;
    setPoomfurnitureRefreshing(true);
    try {
      const res = await fetch(`/api/gmail-poomfurniture/messages/${poomfurnitureSelectedThread.id}?refresh=true`);
      const data = await res.json();
      if (data.success) {
        setPoomfurnitureThreadMessages(data.messages || []);
        if (data.thread) {
          setPoomfurnitureSelectedThread(prev => ({ ...prev, ...data.thread }));
        }
      }
    } catch (err) {
      console.error('Error refreshing POOMFURNITURE thread:', err);
    } finally {
      setPoomfurnitureRefreshing(false);
    }
  };

  // Send POOMFURNITURE reply
  const handlePoomfurnitureSendReply = async () => {
    if ((!poomfurnitureReplyText.trim() && poomfurnitureAttachments.length === 0) || !poomfurnitureSelectedThread) return;

    // Validate attachment size
    if (poomfurnitureAttachments.length > 0) {
      const validation = validateAttachmentsSize(poomfurnitureAttachments);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    // Determine reply recipient - if thread is from us, find customer email
    const ownEmail = poomfurnitureAuth.user?.email?.toLowerCase() || '';
    let replyTo = poomfurnitureSelectedThread.from_email;
    if (ownEmail && poomfurnitureSelectedThread.from_email?.toLowerCase() === ownEmail) {
      const incomingMsg = [...poomfurnitureThreadMessages].reverse().find(m => !m.is_outgoing);
      if (incomingMsg?.from_email) {
        replyTo = incomingMsg.from_email;
      } else {
        const outgoingMsg = poomfurnitureThreadMessages.find(m => m.is_outgoing && m.to_email);
        if (outgoingMsg?.to_email) {
          replyTo = outgoingMsg.to_email;
        }
      }
    }

    // Collect CC addresses for Reply All
    let ccAddresses = null;
    if (poomfurnitureReplyAll) {
      const allEmails = new Set();
      poomfurnitureThreadMessages.forEach(msg => {
        if (msg.cc_email) {
          msg.cc_email.split(',').forEach(email => {
            const trimmed = email.trim().toLowerCase();
            if (trimmed && trimmed !== ownEmail && trimmed !== replyTo?.toLowerCase()) {
              allEmails.add(email.trim());
            }
          });
        }
        if (msg.to_email && !msg.is_outgoing) {
          msg.to_email.split(',').forEach(email => {
            const trimmed = email.trim().toLowerCase();
            if (trimmed && trimmed !== ownEmail && trimmed !== replyTo?.toLowerCase()) {
              allEmails.add(email.trim());
            }
          });
        }
      });
      const origSender = poomfurnitureSelectedThread.from_email;
      if (origSender && origSender.toLowerCase() !== ownEmail && origSender.toLowerCase() !== replyTo?.toLowerCase()) {
        allEmails.add(origSender);
      }
      if (allEmails.size > 0) {
        ccAddresses = Array.from(allEmails).join(', ');
      }
    }

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
          to: replyTo,
          cc: ccAddresses,
          subject: poomfurnitureSelectedThread.subject,
          attachments: attachmentData
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText.includes('Request Entity Too Large') ? 'Zalaczniki sa za duze. Maksymalny rozmiar to 15MB.' : `Blad serwera: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setPoomfurnitureReplyText('');
        setPoomfurnitureReplyAll(false);
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

  // Validate attachment size (max 15MB total, ~20MB after base64 encoding - Vercel Pro limit is 20MB)
  const MAX_ATTACHMENTS_SIZE = 15 * 1024 * 1024; // 15MB
  const validateAttachmentsSize = (files) => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_ATTACHMENTS_SIZE) {
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);
      return { valid: false, error: `Zalaczniki sa za duze (${sizeMB}MB). Maksymalny rozmiar to 15MB.` };
    }
    return { valid: true };
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
      // Polish quote formats - multiple variations (can be at start or after newline)
      .replace(/^W dniu .+napisał\(a\):[\s\S]*/im, '')
      .replace(/^W dniu .+napisał:[\s\S]*/im, '')
      .replace(/^Dnia .+napisał\(a\):[\s\S]*/im, '')
      .replace(/^Dnia .+napisał:[\s\S]*/im, '')
      // Generic Polish format - any line with date pattern and napisał(a):
      .replace(/^.*\d{1,2}\s+\w+\s+\d{4}.*napisał\(a\):[\s\S]*/im, '')
      .replace(/^.*\d{1,2}\s+\w+\s+\d{4}.*napisał:[\s\S]*/im, '')
      // Also match variations with "o" time format like "5 lut 2026 o 16:42"
      .replace(/^.*\d{1,2}\s+\w{3,}\s+\d{4}\s+o\s+\d{1,2}:\d{2}.*napisał\(a\):[\s\S]*/im, '')
      // Remove lines starting with ">" (quoted content)
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

  // Auto-select pending thread when threads are loaded (from task navigation)
  useEffect(() => {
    if (!pendingThreadId) return;

    // Check which tab we're on and if threads are loaded
    if (activeTab === 'shopify' && gmailThreads.length > 0) {
      const thread = gmailThreads.find(t => t.id === pendingThreadId);
      if (thread) {
        openGmailThread(thread);
        setPendingThreadId(null);
      }
    } else if (activeTab === 'poomkids' && poomkidsThreads.length > 0) {
      const thread = poomkidsThreads.find(t => t.id === pendingThreadId);
      if (thread) {
        openPoomkidsThread(thread);
        setPendingThreadId(null);
      }
    } else if (activeTab === 'allepoduszki' && allepoduszkiThreads.length > 0) {
      const thread = allepoduszkiThreads.find(t => t.id === pendingThreadId);
      if (thread) {
        openAllepoduszkiThread(thread);
        setPendingThreadId(null);
      }
    } else if (activeTab === 'poomfurniture' && poomfurnitureThreads.length > 0) {
      const thread = poomfurnitureThreads.find(t => t.id === pendingThreadId);
      if (thread) {
        openPoomfurnitureThread(thread);
        setPendingThreadId(null);
      }
    }
  }, [pendingThreadId, activeTab, gmailThreads, poomkidsThreads, allepoduszkiThreads, poomfurnitureThreads]);

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
                                  {(() => {
                                    const atts = msg.attachments ? (typeof msg.attachments === 'string' ? JSON.parse(msg.attachments || '[]') : (Array.isArray(msg.attachments) ? msg.attachments : [])) : [];
                                    return atts.length > 0 ? (
                                      <div className="mt-2 space-y-2">
                                        {atts.map((att, idx) => {
                                          if (!att.url) return null;
                                          const attId = att.url.split('/').pop();
                                          const attUrl = `/api/allegro/attachments/${attId}?url=${encodeURIComponent(att.url)}`;
                                          const filename = att.fileName || `Załącznik ${idx + 1}`;
                                          return (
                                            <div key={attId || idx} className="block cursor-pointer" onClick={() => setLightboxImage({ url: attUrl, filename })}>
                                              <img
                                                src={attUrl}
                                                alt={filename}
                                                className="max-w-full max-h-64 rounded border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                                                onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                              />
                                              <div style={{display:'none'}} className="items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded text-sm">
                                                <span>📎</span>
                                                <span>{filename}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : null;
                                  })()}
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
                          {replyAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {replyAttachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                                  <span>📎 {file.name}</span>
                                  <button
                                    onClick={() => setReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                                    className="ml-1 text-red-500 hover:text-red-700 font-bold"
                                  >×</button>
                                </div>
                              ))}
                            </div>
                          )}
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
                            <input
                              type="file"
                              id="allegro-reply-attachment"
                              className="hidden"
                              multiple
                              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                              onChange={(e) => {
                                if (e.target.files?.length) {
                                  setReplyAttachments(prev => [...prev, ...Array.from(e.target.files)]);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <button
                              onClick={() => document.getElementById('allegro-reply-attachment').click()}
                              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                              title="Dodaj zalacznik"
                            >
                              📎
                            </button>
                            <button
                              onClick={handleSendReply}
                              disabled={sending || (!replyText.trim() && replyAttachments.length === 0)}
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
                          className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-1.5 shadow-sm"
                          title="Nowa wiadomosc"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Utwórz
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
                        { key: 'read', label: 'Przeczytane', count: gmailThreads.filter(t => t.status === 'read').length, color: 'blue' },
                        { key: 'attention', label: 'Wymaga uwagi', count: gmailThreads.filter(t => t.status === 'attention').length, color: 'yellow' },
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
                                : tab.color === 'yellow' ? 'bg-yellow-500 text-white'
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
                            if (gmailFilter === 'read') return thread.status === 'read';
                            if (gmailFilter === 'attention') return thread.status === 'attention';
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
                            } ${thread.status === 'new' || (!thread.status && thread.unread) ? 'bg-red-50' : ''} ${thread.status === 'attention' ? 'bg-yellow-50' : ''} ${thread.status === 'resolved' ? 'bg-green-50' : ''} ${thread.status === 'sent' ? 'bg-purple-50' : ''}`}
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
                                      : thread.status === 'attention'
                                        ? 'bg-yellow-500 border-yellow-500 text-white'
                                        : thread.status === 'read'
                                          ? 'bg-blue-500 border-blue-500 text-white'
                                          : thread.status === 'new' || thread.unread
                                            ? 'bg-red-500 border-red-500 text-white'
                                            : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  title="Zmien status"
                                >
                                  {thread.status === 'resolved' ? '✓' : thread.status === 'attention' ? '⚠' : thread.status === 'read' ? '●' : thread.status === 'new' || thread.unread ? '!' : ''}
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
                                      onClick={(e) => { quickChangeGmailThreadStatus(e, thread.id, 'attention'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Wymaga uwagi
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
                  <div className={`lg:w-2/3 flex flex-col ${!gmailSelectedThread && !gmailComposeMode ? 'hidden lg:flex' : ''}`}>
                    {gmailComposeMode ? (
                      /* Compose new email form */
                      <div className="flex-1 flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => {
                                setGmailComposeMode(false);
                                setGmailComposeTo('');
                                setGmailComposeSubject('');
                                setGmailComposeBody('');
                                setGmailComposeAttachments([]);
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
                              value={gmailComposeTo}
                              onChange={(e) => setGmailComposeTo(e.target.value)}
                              placeholder="adres@email.com"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temat:</label>
                            <input
                              type="text"
                              value={gmailComposeSubject}
                              onChange={(e) => setGmailComposeSubject(e.target.value)}
                              placeholder="Temat wiadomosci"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tresc:</label>
                            <textarea
                              value={gmailComposeBody}
                              onChange={(e) => setGmailComposeBody(e.target.value)}
                              placeholder="Napisz wiadomosc..."
                              rows={10}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            />
                          </div>
                          {gmailComposeAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {gmailComposeAttachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  <span className="truncate max-w-[100px]">{file.name}</span>
                                  <button
                                    onClick={() => setGmailComposeAttachments(prev => prev.filter((_, i) => i !== index))}
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
                                setGmailComposeAttachments(prev => [...prev, ...files]);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <div className="flex-1"></div>
                          <button
                            onClick={handleGmailSendCompose}
                            disabled={gmailSending || !gmailComposeTo.trim() || !gmailComposeSubject.trim() || (!gmailComposeBody.trim() && gmailComposeAttachments.length === 0)}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                          >
                            {gmailSending ? 'Wysylanie...' : 'Wyslij'}
                          </button>
                        </div>
                      </div>
                    ) : !gmailSelectedThread ? (
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setGmailSelectedThread(null); setGmailSelectedMessages([]); }}
                                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                ← Wstecz
                              </button>
                              <button
                                onClick={handleRefreshThread}
                                disabled={gmailRefreshing}
                                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                                title="Odswiez watek z serwera"
                              >
                                <svg className={`w-4 h-4 ${gmailRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setGmailReplyAll(false);
                                  setGmailReplyText('');
                                  document.querySelector('#gmail-reply-textarea')?.focus();
                                }}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Odpowiedz
                              </button>
                              <button
                                onClick={() => {
                                  setGmailReplyAll(true);
                                  setGmailReplyText('');
                                  document.querySelector('#gmail-reply-textarea')?.focus();
                                }}
                                className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                              >
                                Odp. wszystkim
                              </button>
                              <button
                                onClick={async () => {
                                  // Build full conversation thread for forwarding
                                  let forwardBody = '\n\n---------- Przekazana wiadomosc ----------\n';
                                  forwardBody += `Temat: ${gmailSelectedThread.subject || '(brak tematu)'}\n\n`;

                                  // Add all messages in chronological order
                                  const sortedMessages = [...gmailThreadMessages].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
                                  sortedMessages.forEach((msg, idx) => {
                                    const senderEmail = msg.is_outgoing ? (gmailAuth.user?.email || 'Ja') : (msg.from_email || gmailSelectedThread.from_email);
                                    const dateStr = msg.sent_at ? new Date(msg.sent_at).toLocaleString('pl-PL') : '';
                                    forwardBody += `--- ${idx + 1}. ${senderEmail} (${dateStr}) ---\n`;
                                    forwardBody += `${msg.body_text || '(brak tresci)'}\n\n`;
                                  });

                                  // Collect attachments from the last message only
                                  let forwardedFiles = [];
                                  const lastMsg = gmailThreadMessages.length > 0 ? gmailThreadMessages[gmailThreadMessages.length - 1] : null;
                                  if (lastMsg) {
                                    const msgAtts = Array.isArray(lastMsg.attachments) ? lastMsg.attachments : (typeof lastMsg.attachments === 'string' ? JSON.parse(lastMsg.attachments || '[]') : []);
                                    for (const att of msgAtts) {
                                      try {
                                        const res = await fetch(`/api/gmail/attachments/${lastMsg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`);
                                        if (res.ok) {
                                          const blob = await res.blob();
                                          forwardedFiles.push(new File([blob], att.filename, { type: att.mimeType || 'application/octet-stream' }));
                                        }
                                      } catch (e) { console.error('Failed to fetch attachment:', e); }
                                    }
                                  }

                                  setGmailComposeMode(true);
                                  setGmailComposeTo('');
                                  setGmailComposeSubject('Fwd: ' + (gmailSelectedThread.subject || '').replace(/^Fwd:\s*/i, ''));
                                  setGmailComposeBody(forwardBody);
                                  setGmailComposeAttachments(forwardedFiles);
                                  setGmailSelectedThread(null);
                                }}
                                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                Przekaz dalej
                              </button>
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
                            {(() => {
                              const ownEmail = gmailAuth.user?.email || '';
                              const firstIncomingMsg = gmailThreadMessages.find(m => !m.is_outgoing);
                              const fromEmail = gmailSelectedThread.from_email || firstIncomingMsg?.from_email || '';
                              const fromName = gmailSelectedThread.from_name || firstIncomingMsg?.from_name || fromEmail;
                              const toEmail = firstIncomingMsg?.to_email || ownEmail;
                              const ccEmail = firstIncomingMsg?.cc_email || '';
                              return (
                                <>
                                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                                    {(fromName || '?')[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1 text-sm">
                                    <p className="text-gray-900 dark:text-white">
                                      <span className="text-gray-500 dark:text-gray-400">Od:</span> <span className="font-medium">{fromName}</span>
                                      {fromName !== fromEmail && <span className="text-gray-500 dark:text-gray-400 ml-1">&lt;{fromEmail}&gt;</span>}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                      <span className="text-gray-500 dark:text-gray-400">Do:</span> {toEmail}
                                    </p>
                                    {ccEmail && (
                                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5 break-all">
                                        <span>DW:</span> {ccEmail}
                                      </p>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          <h4 className="mt-2 font-medium text-gray-800 dark:text-gray-200">
                            {gmailSelectedThread.subject || '(Brak tematu)'}
                          </h4>
                          {/* Task/Note section - collapsible */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            {/* Collapsible header */}
                            <button
                              onClick={() => setTasksExpanded(!tasksExpanded)}
                              className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase hover:text-gray-800 dark:hover:text-gray-300"
                            >
                              <span className="flex items-center gap-1">
                                <svg className={`w-3 h-3 transition-transform ${tasksExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                Uwagi do tego wątku {threadTasks.length > 0 && `(${threadTasks.length})`}
                              </span>
                              {threadTasks.filter(t => t.status !== 'completed').length > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded-full">
                                  {threadTasks.filter(t => t.status !== 'completed').length} aktywne
                                </span>
                              )}
                            </button>

                            {/* Collapsible content */}
                            {tasksExpanded && (
                              <div className="mt-2 space-y-2">
                                {/* Display existing tasks for this thread */}
                                {threadTasks.length > 0 && (
                                  <div className="space-y-2">
                                    {threadTasks.map(task => (
                                      <div key={task.id} className={`p-2 rounded text-sm ${task.status === 'completed' ? 'bg-gray-100 dark:bg-gray-700 opacity-60' : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'}`}>
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <p className="text-gray-800 dark:text-gray-200">{task.content}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              Od: <span className="font-medium">{task.created_by}</span> → Dla: <span className="font-medium">{task.assigned_to}</span>
                                              <span className="ml-2">{new Date(task.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                            </p>
                                          </div>
                                          {task.status !== 'completed' && (
                                            <button
                                              onClick={() => handleCompleteThreadTask(task.id)}
                                              className="shrink-0 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded"
                                              title="Oznacz jako wykonane"
                                            >
                                              ✓ Gotowe
                                            </button>
                                          )}
                                          {task.status === 'completed' && (
                                            <span className="text-xs text-green-600 dark:text-green-400">✓ Wykonane</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Add new task form */}
                                {!showTaskForm ? (
                                  <button
                                    onClick={() => setShowTaskForm(true)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                  >
                                    <span>📋</span> Dodaj uwage dla pracownika
                                  </button>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={taskAssignee}
                                    onChange={(e) => setTaskAssignee(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  >
                                    <option value="">Wybierz pracownika...</option>
                                    {allUsers.filter(u => u.username !== currentUser?.username).map(u => (
                                      <option key={u.id} value={u.username}>{u.username}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => { setShowTaskForm(false); setTaskContent(''); setTaskAssignee(''); }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <textarea
                                  value={taskContent}
                                  onChange={(e) => setTaskContent(e.target.value)}
                                  placeholder="Wpisz uwage..."
                                  rows={2}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                />
                                <button
                                  onClick={() => handleCreateTask(gmailSelectedThread.id, 'shopify')}
                                  disabled={taskSending || !taskContent.trim() || !taskAssignee}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {taskSending ? 'Wysylanie...' : 'Wyslij uwage'}
                                </button>
                              </div>
                            )}
                              </div>
                            )}
                          </div>
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
                                <div className={`relative max-w-[80%] ${msg.is_outgoing ? 'mr-2' : 'ml-2'}`}>
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
                                    className={`min-w-[200px] px-4 py-3 rounded-lg ${
                                      msg.is_outgoing
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    <div className={`text-xs mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {msg.is_outgoing ? `Do: ${msg.to_email || 'Nieznany'}` : (msg.from_name || msg.from_email)}
                                      {msg.cc_email && (
                                        <span className="block text-[10px] opacity-75 mt-0.5">DW: {msg.cc_email}</span>
                                      )}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words text-sm">
                                      {parseMessageBody(msg.body_text, msg.is_outgoing)}
                                    </div>
                                    {/* Attachments */}
                                    {msgAttachments.length > 0 && (
                                      <div className="mt-2">
                                        <p className={`text-[10px] mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>Zalaczniki:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {msgAttachments.map((att, i) => {
                                            const attUrl = `/api/gmail/attachments/${msg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`;
                                            const isImage = att.mimeType?.startsWith('image/');
                                            return isImage ? (
                                              <div key={i} className="block cursor-pointer" onClick={() => setLightboxImage({ url: attUrl, filename: att.filename })}>
                                                <img
                                                  src={attUrl}
                                                  alt={att.filename}
                                                  className="max-w-full max-h-48 rounded border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                                                  onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                                <div style={{display:'none'}} className={`items-center gap-1 px-2 py-1 rounded text-xs ${msg.is_outgoing ? 'bg-gray-700 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                                                  <span>🖼️</span>
                                                  <span className="truncate max-w-[100px]">{att.filename}</span>
                                                </div>
                                              </div>
                                            ) : (
                                              <a
                                                key={i}
                                                href={attUrl}
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
                                            );
                                          })}
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
                              id="gmail-reply-textarea"
                              value={gmailReplyText}
                              onChange={(e) => setGmailReplyText(e.target.value)}
                              placeholder={gmailReplyAll ? "Odpowiedz wszystkim (wlacznie z DW)..." : "Napisz odpowiedz..."}
                              rows={2}
                              className={`flex-1 px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 resize-none ${gmailReplyAll ? 'border-purple-400 focus:ring-purple-500' : 'border-gray-300 dark:border-gray-600 focus:ring-red-500'}`}
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
                          className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-1.5 shadow-sm"
                          title="Nowa wiadomosc"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Utwórz
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
                        { key: 'read', label: 'Przeczytane', count: poomkidsThreads.filter(t => t.status === 'read').length, color: 'blue' },
                        { key: 'attention', label: 'Wymaga uwagi', count: poomkidsThreads.filter(t => t.status === 'attention').length, color: 'yellow' },
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
                                : tab.color === 'yellow' ? 'bg-yellow-500 text-white'
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
                            if (poomkidsFilter === 'read') return thread.status === 'read';
                            if (poomkidsFilter === 'attention') return thread.status === 'attention';
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
                            } ${thread.status === 'new' || thread.unread ? 'bg-green-50' : ''} ${thread.status === 'attention' ? 'bg-yellow-50' : ''} ${thread.status === 'resolved' ? 'bg-green-100' : ''} ${thread.status === 'sent' ? 'bg-purple-50' : ''}`}
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
                                      : thread.status === 'attention'
                                        ? 'bg-yellow-500 border-yellow-500 text-white'
                                        : thread.status === 'read'
                                          ? 'bg-blue-500 border-blue-500 text-white'
                                          : thread.status === 'new' || thread.unread
                                            ? 'bg-red-500 border-red-500 text-white'
                                            : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  title="Zmien status"
                                >
                                  {thread.status === 'resolved' ? '✓' : thread.status === 'attention' ? '⚠' : thread.status === 'read' ? '●' : thread.status === 'new' || thread.unread ? '!' : ''}
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
                                      onClick={(e) => { quickChangePoomkidsThreadStatus(e, thread.id, 'attention'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Wymaga uwagi
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setPoomkidsSelectedThread(null); setPoomkidsSelectedMessages([]); }}
                                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                ← Wstecz
                              </button>
                              <button
                                onClick={handleRefreshPoomkidsThread}
                                disabled={poomkidsRefreshing}
                                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                                title="Odswiez watek z serwera"
                              >
                                <svg className={`w-4 h-4 ${poomkidsRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setPoomkidsReplyAll(false);
                                  setPoomkidsReplyText('');
                                  document.querySelector('#poomkids-reply-textarea')?.focus();
                                }}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Odpowiedz
                              </button>
                              <button
                                onClick={() => {
                                  setPoomkidsReplyAll(true);
                                  setPoomkidsReplyText('');
                                  document.querySelector('#poomkids-reply-textarea')?.focus();
                                }}
                                className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                              >
                                Odp. wszystkim
                              </button>
                              <button
                                onClick={async () => {
                                  // Build full conversation thread for forwarding
                                  let forwardBody = '\n\n---------- Przekazana wiadomosc ----------\n';
                                  forwardBody += `Temat: ${poomkidsSelectedThread.subject || '(brak tematu)'}\n\n`;

                                  // Add all messages in chronological order
                                  const sortedMessages = [...poomkidsThreadMessages].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
                                  sortedMessages.forEach((msg, idx) => {
                                    const senderEmail = msg.is_outgoing ? (poomkidsAuth.user?.email || 'Ja') : (msg.from_email || poomkidsSelectedThread.from_email);
                                    const dateStr = msg.sent_at ? new Date(msg.sent_at).toLocaleString('pl-PL') : '';
                                    forwardBody += `--- ${idx + 1}. ${senderEmail} (${dateStr}) ---\n`;
                                    forwardBody += `${msg.body_text || '(brak tresci)'}\n\n`;
                                  });

                                  // Collect attachments from the last message only
                                  let forwardedFiles = [];
                                  const lastMsg = poomkidsThreadMessages.length > 0 ? poomkidsThreadMessages[poomkidsThreadMessages.length - 1] : null;
                                  if (lastMsg) {
                                    const msgAtts = Array.isArray(lastMsg.attachments) ? lastMsg.attachments : (typeof lastMsg.attachments === 'string' ? JSON.parse(lastMsg.attachments || '[]') : []);
                                    for (const att of msgAtts) {
                                      try {
                                        const res = await fetch(`/api/gmail-poomkids/attachments/${lastMsg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`);
                                        if (res.ok) {
                                          const blob = await res.blob();
                                          forwardedFiles.push(new File([blob], att.filename, { type: att.mimeType || 'application/octet-stream' }));
                                        }
                                      } catch (e) { console.error('Failed to fetch attachment:', e); }
                                    }
                                  }

                                  setPoomkidsComposeMode(true);
                                  setPoomkidsComposeTo('');
                                  setPoomkidsComposeSubject('Fwd: ' + (poomkidsSelectedThread.subject || '').replace(/^Fwd:\s*/i, ''));
                                  setPoomkidsComposeBody(forwardBody);
                                  setPoomkidsComposeAttachments(forwardedFiles);
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
                            {(() => {
                              const ownEmail = poomkidsAuth.user?.email || '';
                              const firstIncomingMsg = poomkidsThreadMessages.find(m => !m.is_outgoing);
                              const fromEmail = poomkidsSelectedThread.from_email || firstIncomingMsg?.from_email || '';
                              const fromName = poomkidsSelectedThread.from_name || firstIncomingMsg?.from_name || fromEmail;
                              const toEmail = firstIncomingMsg?.to_email || ownEmail;
                              const ccEmail = firstIncomingMsg?.cc_email || '';
                              return (
                                <>
                                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                    {(fromName || '?')[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1 text-sm">
                                    <p className="text-gray-900 dark:text-white">
                                      <span className="text-gray-500 dark:text-gray-400">Od:</span> <span className="font-medium">{fromName}</span>
                                      {fromName !== fromEmail && <span className="text-gray-500 dark:text-gray-400 ml-1">&lt;{fromEmail}&gt;</span>}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                      <span className="text-gray-500 dark:text-gray-400">Do:</span> {toEmail}
                                    </p>
                                    {ccEmail && (
                                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5 break-all">
                                        <span>DW:</span> {ccEmail}
                                      </p>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          <h4 className="mt-2 font-medium text-gray-800 dark:text-gray-200">
                            {poomkidsSelectedThread.subject || '(Brak tematu)'}
                          </h4>
                          {/* Task/Note section - collapsible */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            {/* Collapsible header */}
                            <button
                              onClick={() => setTasksExpanded(!tasksExpanded)}
                              className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase hover:text-gray-800 dark:hover:text-gray-300"
                            >
                              <span className="flex items-center gap-1">
                                <svg className={`w-3 h-3 transition-transform ${tasksExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                Uwagi do tego wątku {threadTasks.length > 0 && `(${threadTasks.length})`}
                              </span>
                              {threadTasks.filter(t => t.status !== 'completed').length > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded-full">
                                  {threadTasks.filter(t => t.status !== 'completed').length} aktywne
                                </span>
                              )}
                            </button>

                            {/* Collapsible content */}
                            {tasksExpanded && (
                              <div className="mt-2 space-y-2">
                                {/* Display existing tasks for this thread */}
                                {threadTasks.length > 0 && (
                                  <div className="space-y-2">
                                    {threadTasks.map(task => (
                                      <div key={task.id} className={`p-2 rounded text-sm ${task.status === 'completed' ? 'bg-gray-100 dark:bg-gray-700 opacity-60' : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'}`}>
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <p className="text-gray-800 dark:text-gray-200">{task.content}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              Od: <span className="font-medium">{task.created_by}</span> → Dla: <span className="font-medium">{task.assigned_to}</span>
                                              <span className="ml-2">{new Date(task.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                            </p>
                                          </div>
                                          {task.status !== 'completed' && (
                                            <button
                                              onClick={() => handleCompleteThreadTask(task.id)}
                                              className="shrink-0 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded"
                                              title="Oznacz jako wykonane"
                                            >
                                              ✓ Gotowe
                                            </button>
                                          )}
                                          {task.status === 'completed' && (
                                            <span className="text-xs text-green-600 dark:text-green-400">✓ Wykonane</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Add new task form */}
                                {!showTaskForm ? (
                                  <button
                                    onClick={() => setShowTaskForm(true)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                  >
                                    <span>📋</span> Dodaj uwage dla pracownika
                                  </button>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={taskAssignee}
                                    onChange={(e) => setTaskAssignee(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  >
                                    <option value="">Wybierz pracownika...</option>
                                    {allUsers.filter(u => u.username !== currentUser?.username).map(u => (
                                      <option key={u.id} value={u.username}>{u.username}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => { setShowTaskForm(false); setTaskContent(''); setTaskAssignee(''); }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <textarea
                                  value={taskContent}
                                  onChange={(e) => setTaskContent(e.target.value)}
                                  placeholder="Wpisz uwage..."
                                  rows={2}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                />
                                <button
                                  onClick={() => handleCreateTask(poomkidsSelectedThread.id, 'poomkids')}
                                  disabled={taskSending || !taskContent.trim() || !taskAssignee}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {taskSending ? 'Wysylanie...' : 'Wyslij uwage'}
                                </button>
                              </div>
                            )}
                              </div>
                            )}
                          </div>
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
                                <div className={`relative max-w-[80%] ${msg.is_outgoing ? 'mr-2' : 'ml-2'}`}>
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
                                    className={`min-w-[200px] px-4 py-3 rounded-lg ${
                                      msg.is_outgoing
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    <div className={`text-xs mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {msg.is_outgoing ? `Do: ${msg.to_email || 'Nieznany'}` : (msg.from_name || msg.from_email)}
                                      {msg.cc_email && (
                                        <span className="block text-[10px] opacity-75 mt-0.5">DW: {msg.cc_email}</span>
                                      )}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words text-sm">
                                      {parseMessageBody(msg.body_text, msg.is_outgoing)}
                                    </div>
                                    {(() => {
                                      const msgAttachments = Array.isArray(msg.attachments) ? msg.attachments : (typeof msg.attachments === 'string' ? JSON.parse(msg.attachments || '[]') : []);
                                      return msgAttachments.length > 0 && (
                                        <div className="mt-2">
                                          <p className={`text-[10px] mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>Zalaczniki:</p>
                                          <div className="flex flex-wrap gap-2">
                                            {msgAttachments.map((att, i) => {
                                              const attUrl = `/api/gmail-poomkids/attachments/${msg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`;
                                              const isImage = att.mimeType?.startsWith('image/');
                                              return isImage ? (
                                                <div key={i} className="block cursor-pointer" onClick={() => setLightboxImage({ url: attUrl, filename: att.filename })}>
                                                  <img
                                                    src={attUrl}
                                                    alt={att.filename}
                                                    className="max-w-full max-h-48 rounded border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                                                    onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                                  />
                                                  <div style={{display:'none'}} className={`items-center gap-1 px-2 py-1 rounded text-xs ${msg.is_outgoing ? 'bg-gray-700 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                                                    <span>🖼️</span>
                                                    <span className="truncate max-w-[100px]">{att.filename}</span>
                                                  </div>
                                                </div>
                                              ) : (
                                                <a
                                                  key={i}
                                                  href={attUrl}
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
                                              );
                                            })}
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
                              placeholder={poomkidsReplyAll ? "Odpowiedz wszystkim (wlacznie z DW)..." : "Napisz odpowiedz..."}
                              rows={2}
                              className={`flex-1 px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 resize-none ${poomkidsReplyAll ? 'border-purple-400 focus:ring-purple-500' : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'}`}
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
                          className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-1.5 shadow-sm"
                          title="Nowa wiadomosc"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Utwórz
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
                        { key: 'read', label: 'Przeczytane', count: allepoduszkiThreads.filter(t => t.status === 'read').length, color: 'blue' },
                        { key: 'attention', label: 'Wymaga uwagi', count: allepoduszkiThreads.filter(t => t.status === 'attention').length, color: 'yellow' },
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
                                : tab.color === 'yellow' ? 'bg-yellow-500 text-white'
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
                            if (allepoduszkiFilter === 'read') return thread.status === 'read';
                            if (allepoduszkiFilter === 'attention') return thread.status === 'attention';
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
                            } ${thread.status === 'new' || thread.unread ? 'bg-purple-50' : ''} ${thread.status === 'attention' ? 'bg-yellow-50' : ''} ${thread.status === 'resolved' ? 'bg-green-50' : ''} ${thread.status === 'sent' ? 'bg-purple-100' : ''}`}
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
                                      : thread.status === 'attention'
                                        ? 'bg-yellow-500 border-yellow-500 text-white'
                                        : thread.status === 'read'
                                          ? 'bg-blue-500 border-blue-500 text-white'
                                          : thread.status === 'new' || thread.unread
                                            ? 'bg-red-500 border-red-500 text-white'
                                            : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  title="Zmien status"
                                >
                                  {thread.status === 'resolved' ? '✓' : thread.status === 'attention' ? '⚠' : thread.status === 'read' ? '●' : thread.status === 'new' || thread.unread ? '!' : ''}
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
                                      onClick={(e) => { quickChangeAllepoduszkiThreadStatus(e, thread.id, 'attention'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Wymaga uwagi
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
                  <div className={`lg:w-2/3 flex flex-col ${!allepoduszkiSelectedThread && !allepoduszkiComposeMode ? 'hidden lg:flex' : ''}`}>
                    {allepoduszkiComposeMode ? (
                      /* Compose new email form */
                      <div className="flex-1 flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => {
                                setAllepoduszkiComposeMode(false);
                                setAllepoduszkiComposeTo('');
                                setAllepoduszkiComposeSubject('');
                                setAllepoduszkiComposeBody('');
                                setAllepoduszkiComposeAttachments([]);
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
                              value={allepoduszkiComposeTo}
                              onChange={(e) => setAllepoduszkiComposeTo(e.target.value)}
                              placeholder="adres@email.com"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temat:</label>
                            <input
                              type="text"
                              value={allepoduszkiComposeSubject}
                              onChange={(e) => setAllepoduszkiComposeSubject(e.target.value)}
                              placeholder="Temat wiadomosci"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tresc:</label>
                            <textarea
                              value={allepoduszkiComposeBody}
                              onChange={(e) => setAllepoduszkiComposeBody(e.target.value)}
                              placeholder="Napisz wiadomosc..."
                              rows={10}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            />
                          </div>
                          {allepoduszkiComposeAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {allepoduszkiComposeAttachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  <span className="truncate max-w-[100px]">{file.name}</span>
                                  <button
                                    onClick={() => setAllepoduszkiComposeAttachments(prev => prev.filter((_, i) => i !== index))}
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
                                setAllepoduszkiComposeAttachments(prev => [...prev, ...files]);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <div className="flex-1"></div>
                          <button
                            onClick={handleAllepoduszkiSendCompose}
                            disabled={allepoduszkiSending || !allepoduszkiComposeTo.trim() || !allepoduszkiComposeSubject.trim() || (!allepoduszkiComposeBody.trim() && allepoduszkiComposeAttachments.length === 0)}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                          >
                            {allepoduszkiSending ? 'Wysylanie...' : 'Wyslij'}
                          </button>
                        </div>
                      </div>
                    ) : !allepoduszkiSelectedThread ? (
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setAllepoduszkiSelectedThread(null); setAllepoduszkiSelectedMessages([]); }}
                                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                ← Wstecz
                              </button>
                              <button
                                onClick={handleRefreshAllepoduszkiThread}
                                disabled={allepoduszkiRefreshing}
                                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                                title="Odswiez watek z serwera"
                              >
                                <svg className={`w-4 h-4 ${allepoduszkiRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setAllepoduszkiReplyAll(false);
                                  setAllepoduszkiReplyText('');
                                  document.querySelector('#allepoduszki-reply-textarea')?.focus();
                                }}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Odpowiedz
                              </button>
                              <button
                                onClick={() => {
                                  setAllepoduszkiReplyAll(true);
                                  setAllepoduszkiReplyText('');
                                  document.querySelector('#allepoduszki-reply-textarea')?.focus();
                                }}
                                className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                              >
                                Odp. wszystkim
                              </button>
                              <button
                                onClick={async () => {
                                  // Build full conversation thread for forwarding
                                  let forwardBody = '\n\n---------- Przekazana wiadomosc ----------\n';
                                  forwardBody += `Temat: ${allepoduszkiSelectedThread.subject || '(brak tematu)'}\n\n`;

                                  // Add all messages in chronological order
                                  const sortedMessages = [...allepoduszkiThreadMessages].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
                                  sortedMessages.forEach((msg, idx) => {
                                    const senderEmail = msg.is_outgoing ? (allepoduszkiAuth.user?.email || 'Ja') : (msg.from_email || allepoduszkiSelectedThread.from_email);
                                    const dateStr = msg.sent_at ? new Date(msg.sent_at).toLocaleString('pl-PL') : '';
                                    forwardBody += `--- ${idx + 1}. ${senderEmail} (${dateStr}) ---\n`;
                                    forwardBody += `${msg.body_text || '(brak tresci)'}\n\n`;
                                  });

                                  // Collect attachments from the last message only
                                  let forwardedFiles = [];
                                  const lastMsg = allepoduszkiThreadMessages.length > 0 ? allepoduszkiThreadMessages[allepoduszkiThreadMessages.length - 1] : null;
                                  if (lastMsg) {
                                    const msgAtts = Array.isArray(lastMsg.attachments) ? lastMsg.attachments : (typeof lastMsg.attachments === 'string' ? JSON.parse(lastMsg.attachments || '[]') : []);
                                    for (const att of msgAtts) {
                                      try {
                                        const res = await fetch(`/api/gmail-allepoduszki/attachments/${lastMsg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`);
                                        if (res.ok) {
                                          const blob = await res.blob();
                                          forwardedFiles.push(new File([blob], att.filename, { type: att.mimeType || 'application/octet-stream' }));
                                        }
                                      } catch (e) { console.error('Failed to fetch attachment:', e); }
                                    }
                                  }

                                  setAllepoduszkiComposeMode(true);
                                  setAllepoduszkiComposeTo('');
                                  setAllepoduszkiComposeSubject('Fwd: ' + (allepoduszkiSelectedThread.subject || '').replace(/^Fwd:\s*/i, ''));
                                  setAllepoduszkiComposeBody(forwardBody);
                                  setAllepoduszkiComposeAttachments(forwardedFiles);
                                  setAllepoduszkiSelectedThread(null);
                                }}
                                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                Przekaz dalej
                              </button>
                              {allepoduszkiSelectedMessages.length > 0 && (
                                <button
                                  onClick={handleAllepoduszkiDeleteMessages}
                                  disabled={allepoduszkiDeleting}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  {allepoduszkiDeleting ? '...' : `Usun (${allepoduszkiSelectedMessages.length})`}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {(() => {
                              const ownEmail = allepoduszkiAuth.user?.email || '';
                              const firstIncomingMsg = allepoduszkiThreadMessages.find(m => !m.is_outgoing);
                              const fromEmail = allepoduszkiSelectedThread.from_email || firstIncomingMsg?.from_email || '';
                              const fromName = allepoduszkiSelectedThread.from_name || firstIncomingMsg?.from_name || fromEmail;
                              const toEmail = firstIncomingMsg?.to_email || ownEmail;
                              const ccEmail = firstIncomingMsg?.cc_email || '';
                              return (
                                <>
                                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                                    {(fromName || '?')[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1 text-sm">
                                    <p className="text-gray-900 dark:text-white">
                                      <span className="text-gray-500 dark:text-gray-400">Od:</span> <span className="font-medium">{fromName}</span>
                                      {fromName !== fromEmail && <span className="text-gray-500 dark:text-gray-400 ml-1">&lt;{fromEmail}&gt;</span>}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                      <span className="text-gray-500 dark:text-gray-400">Do:</span> {toEmail}
                                    </p>
                                    {ccEmail && (
                                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5 break-all">
                                        <span>DW:</span> {ccEmail}
                                      </p>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          <h4 className="mt-2 font-medium text-gray-800 dark:text-gray-200">
                            {allepoduszkiSelectedThread.subject || '(Brak tematu)'}
                          </h4>
                          {/* Task/Note section - collapsible */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            {/* Collapsible header */}
                            <button
                              onClick={() => setTasksExpanded(!tasksExpanded)}
                              className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase hover:text-gray-800 dark:hover:text-gray-300"
                            >
                              <span className="flex items-center gap-1">
                                <svg className={`w-3 h-3 transition-transform ${tasksExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                Uwagi do tego wątku {threadTasks.length > 0 && `(${threadTasks.length})`}
                              </span>
                              {threadTasks.filter(t => t.status !== 'completed').length > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded-full">
                                  {threadTasks.filter(t => t.status !== 'completed').length} aktywne
                                </span>
                              )}
                            </button>

                            {/* Collapsible content */}
                            {tasksExpanded && (
                              <div className="mt-2 space-y-2">
                                {/* Display existing tasks for this thread */}
                                {threadTasks.length > 0 && (
                                  <div className="space-y-2">
                                    {threadTasks.map(task => (
                                      <div key={task.id} className={`p-2 rounded text-sm ${task.status === 'completed' ? 'bg-gray-100 dark:bg-gray-700 opacity-60' : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'}`}>
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <p className="text-gray-800 dark:text-gray-200">{task.content}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              Od: <span className="font-medium">{task.created_by}</span> → Dla: <span className="font-medium">{task.assigned_to}</span>
                                              <span className="ml-2">{new Date(task.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                            </p>
                                          </div>
                                          {task.status !== 'completed' && (
                                            <button
                                              onClick={() => handleCompleteThreadTask(task.id)}
                                              className="shrink-0 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded"
                                              title="Oznacz jako wykonane"
                                            >
                                              ✓ Gotowe
                                            </button>
                                          )}
                                          {task.status === 'completed' && (
                                            <span className="text-xs text-green-600 dark:text-green-400">✓ Wykonane</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Add new task form */}
                                {!showTaskForm ? (
                                  <button
                                    onClick={() => setShowTaskForm(true)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                  >
                                    <span>📋</span> Dodaj uwage dla pracownika
                                  </button>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={taskAssignee}
                                    onChange={(e) => setTaskAssignee(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  >
                                    <option value="">Wybierz pracownika...</option>
                                    {allUsers.filter(u => u.username !== currentUser?.username).map(u => (
                                      <option key={u.id} value={u.username}>{u.username}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => { setShowTaskForm(false); setTaskContent(''); setTaskAssignee(''); }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <textarea
                                  value={taskContent}
                                  onChange={(e) => setTaskContent(e.target.value)}
                                  placeholder="Wpisz uwage..."
                                  rows={2}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                />
                                <button
                                  onClick={() => handleCreateTask(allepoduszkiSelectedThread.id, 'allepoduszki')}
                                  disabled={taskSending || !taskContent.trim() || !taskAssignee}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {taskSending ? 'Wysylanie...' : 'Wyslij uwage'}
                                </button>
                              </div>
                            )}
                              </div>
                            )}
                          </div>
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
                                <div className={`relative max-w-[80%] ${msg.is_outgoing ? 'mr-2' : 'ml-2'}`}>
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
                                    className={`min-w-[200px] px-4 py-3 rounded-lg ${
                                      msg.is_outgoing
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    <div className={`text-xs mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {msg.is_outgoing ? `Do: ${msg.to_email || 'Nieznany'}` : (msg.from_name || msg.from_email)}
                                      {msg.cc_email && (
                                        <span className="block text-[10px] opacity-75 mt-0.5">DW: {msg.cc_email}</span>
                                      )}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words text-sm">
                                      {parseMessageBody(msg.body_text, msg.is_outgoing)}
                                    </div>
                                    {msgAttachments.length > 0 && (
                                      <div className="mt-2">
                                        <p className={`text-[10px] mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>Zalaczniki:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {msgAttachments.map((att, i) => {
                                            const attUrl = `/api/gmail-allepoduszki/attachments/${msg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`;
                                            const isImage = att.mimeType?.startsWith('image/');
                                            return isImage ? (
                                              <div key={i} className="block cursor-pointer" onClick={() => setLightboxImage({ url: attUrl, filename: att.filename })}>
                                                <img
                                                  src={attUrl}
                                                  alt={att.filename}
                                                  className="max-w-full max-h-48 rounded border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                                                  onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                                <div style={{display:'none'}} className={`items-center gap-1 px-2 py-1 rounded text-xs ${msg.is_outgoing ? 'bg-gray-700 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                                                  <span>🖼️</span>
                                                  <span className="truncate max-w-[100px]">{att.filename}</span>
                                                </div>
                                              </div>
                                            ) : (
                                              <a
                                                key={i}
                                                href={attUrl}
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
                                            );
                                          })}
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
                              id="allepoduszki-reply-textarea"
                              value={allepoduszkiReplyText}
                              onChange={(e) => setAllepoduszkiReplyText(e.target.value)}
                              placeholder={allepoduszkiReplyAll ? "Odpowiedz wszystkim (wlacznie z DW)..." : "Napisz odpowiedz..."}
                              rows={2}
                              className={`flex-1 px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 resize-none ${allepoduszkiReplyAll ? 'border-purple-400 focus:ring-purple-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'}`}
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
                          className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-1.5 shadow-sm"
                          title="Nowa wiadomosc"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Utwórz
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
                        { key: 'read', label: 'Przeczytane', count: poomfurnitureThreads.filter(t => t.status === 'read').length, color: 'blue' },
                        { key: 'attention', label: 'Wymaga uwagi', count: poomfurnitureThreads.filter(t => t.status === 'attention').length, color: 'yellow' },
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
                                : tab.color === 'yellow' ? 'bg-yellow-500 text-white'
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
                            if (poomfurnitureFilter === 'read') return thread.status === 'read';
                            if (poomfurnitureFilter === 'attention') return thread.status === 'attention';
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
                            } ${thread.status === 'new' || thread.unread ? 'bg-teal-50' : ''} ${thread.status === 'attention' ? 'bg-yellow-50' : ''} ${thread.status === 'resolved' ? 'bg-green-50' : ''} ${thread.status === 'sent' ? 'bg-purple-50' : ''}`}
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
                                      : thread.status === 'attention'
                                        ? 'bg-yellow-500 border-yellow-500 text-white'
                                        : thread.status === 'read'
                                          ? 'bg-blue-500 border-blue-500 text-white'
                                          : thread.status === 'new' || thread.unread
                                            ? 'bg-red-500 border-red-500 text-white'
                                            : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  title="Zmien status"
                                >
                                  {thread.status === 'resolved' ? '✓' : thread.status === 'attention' ? '⚠' : thread.status === 'read' ? '●' : thread.status === 'new' || thread.unread ? '!' : ''}
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
                                      onClick={(e) => { quickChangePoomfurnitureThreadStatus(e, thread.id, 'attention'); setOpenStatusDropdown(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Wymaga uwagi
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
                  <div className={`lg:w-2/3 flex flex-col ${!poomfurnitureSelectedThread && !poomfurnitureComposeMode ? 'hidden lg:flex' : ''}`}>
                    {poomfurnitureComposeMode ? (
                      /* Compose new email form */
                      <div className="flex-1 flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => {
                                setPoomfurnitureComposeMode(false);
                                setPoomfurnitureComposeTo('');
                                setPoomfurnitureComposeSubject('');
                                setPoomfurnitureComposeBody('');
                                setPoomfurnitureComposeAttachments([]);
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
                              value={poomfurnitureComposeTo}
                              onChange={(e) => setPoomfurnitureComposeTo(e.target.value)}
                              placeholder="adres@email.com"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temat:</label>
                            <input
                              type="text"
                              value={poomfurnitureComposeSubject}
                              onChange={(e) => setPoomfurnitureComposeSubject(e.target.value)}
                              placeholder="Temat wiadomosci"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tresc:</label>
                            <textarea
                              value={poomfurnitureComposeBody}
                              onChange={(e) => setPoomfurnitureComposeBody(e.target.value)}
                              placeholder="Napisz wiadomosc..."
                              rows={10}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                            />
                          </div>
                          {poomfurnitureComposeAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {poomfurnitureComposeAttachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  <span className="truncate max-w-[100px]">{file.name}</span>
                                  <button
                                    onClick={() => setPoomfurnitureComposeAttachments(prev => prev.filter((_, i) => i !== index))}
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
                                setPoomfurnitureComposeAttachments(prev => [...prev, ...files]);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <div className="flex-1"></div>
                          <button
                            onClick={handlePoomfurnitureSendCompose}
                            disabled={poomfurnitureSending || !poomfurnitureComposeTo.trim() || !poomfurnitureComposeSubject.trim() || (!poomfurnitureComposeBody.trim() && poomfurnitureComposeAttachments.length === 0)}
                            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
                          >
                            {poomfurnitureSending ? 'Wysylanie...' : 'Wyslij'}
                          </button>
                        </div>
                      </div>
                    ) : !poomfurnitureSelectedThread ? (
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setPoomfurnitureSelectedThread(null); setPoomfurnitureSelectedMessages([]); }}
                                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                ← Wstecz
                              </button>
                              <button
                                onClick={handleRefreshPoomfurnitureThread}
                                disabled={poomfurnitureRefreshing}
                                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                                title="Odswiez watek z serwera"
                              >
                                <svg className={`w-4 h-4 ${poomfurnitureRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setPoomfurnitureReplyAll(false);
                                  setPoomfurnitureReplyText('');
                                  document.querySelector('#poomfurniture-reply-textarea')?.focus();
                                }}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Odpowiedz
                              </button>
                              <button
                                onClick={() => {
                                  setPoomfurnitureReplyAll(true);
                                  setPoomfurnitureReplyText('');
                                  document.querySelector('#poomfurniture-reply-textarea')?.focus();
                                }}
                                className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                              >
                                Odp. wszystkim
                              </button>
                              <button
                                onClick={async () => {
                                  // Build full conversation thread for forwarding
                                  let forwardBody = '\n\n---------- Przekazana wiadomosc ----------\n';
                                  forwardBody += `Temat: ${poomfurnitureSelectedThread.subject || '(brak tematu)'}\n\n`;

                                  // Add all messages in chronological order
                                  const sortedMessages = [...poomfurnitureThreadMessages].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
                                  sortedMessages.forEach((msg, idx) => {
                                    const senderEmail = msg.is_outgoing ? (poomfurnitureAuth.user?.email || 'Ja') : (msg.from_email || poomfurnitureSelectedThread.from_email);
                                    const dateStr = msg.sent_at ? new Date(msg.sent_at).toLocaleString('pl-PL') : '';
                                    forwardBody += `--- ${idx + 1}. ${senderEmail} (${dateStr}) ---\n`;
                                    forwardBody += `${msg.body_text || '(brak tresci)'}\n\n`;
                                  });

                                  // Collect attachments from the last message only
                                  let forwardedFiles = [];
                                  const lastMsg = poomfurnitureThreadMessages.length > 0 ? poomfurnitureThreadMessages[poomfurnitureThreadMessages.length - 1] : null;
                                  if (lastMsg) {
                                    const msgAtts = Array.isArray(lastMsg.attachments) ? lastMsg.attachments : (typeof lastMsg.attachments === 'string' ? JSON.parse(lastMsg.attachments || '[]') : []);
                                    for (const att of msgAtts) {
                                      try {
                                        const res = await fetch(`/api/gmail-poomfurniture/attachments/${lastMsg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`);
                                        if (res.ok) {
                                          const blob = await res.blob();
                                          forwardedFiles.push(new File([blob], att.filename, { type: att.mimeType || 'application/octet-stream' }));
                                        }
                                      } catch (e) { console.error('Failed to fetch attachment:', e); }
                                    }
                                  }

                                  setPoomfurnitureComposeMode(true);
                                  setPoomfurnitureComposeTo('');
                                  setPoomfurnitureComposeSubject('Fwd: ' + (poomfurnitureSelectedThread.subject || '').replace(/^Fwd:\s*/i, ''));
                                  setPoomfurnitureComposeBody(forwardBody);
                                  setPoomfurnitureComposeAttachments(forwardedFiles);
                                  setPoomfurnitureSelectedThread(null);
                                }}
                                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                Przekaz dalej
                              </button>
                              {poomfurnitureSelectedMessages.length > 0 && (
                                <button
                                  onClick={handlePoomfurnitureDeleteMessages}
                                  disabled={poomfurnitureDeleting}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  {poomfurnitureDeleting ? '...' : `Usun (${poomfurnitureSelectedMessages.length})`}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {(() => {
                              const ownEmail = poomfurnitureAuth.user?.email || 'kontakt.poom@gmail.com';
                              const firstIncomingMsg = poomfurnitureThreadMessages.find(m => !m.is_outgoing);
                              const fromEmail = poomfurnitureSelectedThread.from_email || firstIncomingMsg?.from_email || '';
                              const fromName = poomfurnitureSelectedThread.from_name || firstIncomingMsg?.from_name || fromEmail;
                              const toEmail = firstIncomingMsg?.to_email || ownEmail;
                              const ccEmail = firstIncomingMsg?.cc_email || '';
                              return (
                                <>
                                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-medium">
                                    {(fromName || '?')[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1 text-sm">
                                    <p className="text-gray-900 dark:text-white">
                                      <span className="text-gray-500 dark:text-gray-400">Od:</span> <span className="font-medium">{fromName}</span>
                                      {fromName !== fromEmail && <span className="text-gray-500 dark:text-gray-400 ml-1">&lt;{fromEmail}&gt;</span>}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                      <span className="text-gray-500 dark:text-gray-400">Do:</span> {toEmail}
                                    </p>
                                    {ccEmail && (
                                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5 break-all">
                                        <span>DW:</span> {ccEmail}
                                      </p>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          <h4 className="mt-2 font-medium text-gray-800 dark:text-gray-200">
                            {poomfurnitureSelectedThread.subject || '(Brak tematu)'}
                          </h4>
                          {/* Task/Note section - collapsible */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            {/* Collapsible header */}
                            <button
                              onClick={() => setTasksExpanded(!tasksExpanded)}
                              className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase hover:text-gray-800 dark:hover:text-gray-300"
                            >
                              <span className="flex items-center gap-1">
                                <svg className={`w-3 h-3 transition-transform ${tasksExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                Uwagi do tego wątku {threadTasks.length > 0 && `(${threadTasks.length})`}
                              </span>
                              {threadTasks.filter(t => t.status !== 'completed').length > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded-full">
                                  {threadTasks.filter(t => t.status !== 'completed').length} aktywne
                                </span>
                              )}
                            </button>

                            {/* Collapsible content */}
                            {tasksExpanded && (
                              <div className="mt-2 space-y-2">
                                {/* Display existing tasks for this thread */}
                                {threadTasks.length > 0 && (
                                  <div className="space-y-2">
                                    {threadTasks.map(task => (
                                      <div key={task.id} className={`p-2 rounded text-sm ${task.status === 'completed' ? 'bg-gray-100 dark:bg-gray-700 opacity-60' : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'}`}>
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <p className="text-gray-800 dark:text-gray-200">{task.content}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              Od: <span className="font-medium">{task.created_by}</span> → Dla: <span className="font-medium">{task.assigned_to}</span>
                                              <span className="ml-2">{new Date(task.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                            </p>
                                          </div>
                                          {task.status !== 'completed' && (
                                            <button
                                              onClick={() => handleCompleteThreadTask(task.id)}
                                              className="shrink-0 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded"
                                              title="Oznacz jako wykonane"
                                            >
                                              ✓ Gotowe
                                            </button>
                                          )}
                                          {task.status === 'completed' && (
                                            <span className="text-xs text-green-600 dark:text-green-400">✓ Wykonane</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Add new task form */}
                                {!showTaskForm ? (
                                  <button
                                    onClick={() => setShowTaskForm(true)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                  >
                                    <span>📋</span> Dodaj uwage dla pracownika
                                  </button>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={taskAssignee}
                                    onChange={(e) => setTaskAssignee(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  >
                                    <option value="">Wybierz pracownika...</option>
                                    {allUsers.filter(u => u.username !== currentUser?.username).map(u => (
                                      <option key={u.id} value={u.username}>{u.username}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => { setShowTaskForm(false); setTaskContent(''); setTaskAssignee(''); }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <textarea
                                  value={taskContent}
                                  onChange={(e) => setTaskContent(e.target.value)}
                                  placeholder="Wpisz uwage..."
                                  rows={2}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                />
                                <button
                                  onClick={() => handleCreateTask(poomfurnitureSelectedThread.id, 'poomfurniture')}
                                  disabled={taskSending || !taskContent.trim() || !taskAssignee}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {taskSending ? 'Wysylanie...' : 'Wyslij uwage'}
                                </button>
                              </div>
                            )}
                              </div>
                            )}
                          </div>
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
                                <div className={`relative max-w-[80%] ${msg.is_outgoing ? 'mr-2' : 'ml-2'}`}>
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
                                    className={`min-w-[200px] px-4 py-3 rounded-lg ${
                                      msg.is_outgoing
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    <div className={`text-xs mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {msg.is_outgoing ? `Do: ${msg.to_email || 'Nieznany'}` : (msg.from_name || msg.from_email)}
                                      {msg.cc_email && (
                                        <span className="block text-[10px] opacity-75 mt-0.5">DW: {msg.cc_email}</span>
                                      )}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words text-sm">
                                      {parseMessageBody(msg.body_text, msg.is_outgoing)}
                                    </div>
                                    {msgAttachments.length > 0 && (
                                      <div className="mt-2">
                                        <p className={`text-[10px] mb-1 ${msg.is_outgoing ? 'text-gray-400' : 'text-gray-400'}`}>Zalaczniki:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {msgAttachments.map((att, i) => {
                                            const attUrl = `/api/gmail-poomfurniture/attachments/${msg.id}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`;
                                            const isImage = att.mimeType?.startsWith('image/');
                                            return isImage ? (
                                              <div key={i} className="block cursor-pointer" onClick={() => setLightboxImage({ url: attUrl, filename: att.filename })}>
                                                <img
                                                  src={attUrl}
                                                  alt={att.filename}
                                                  className="max-w-full max-h-48 rounded border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                                                  onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                                <div style={{display:'none'}} className={`items-center gap-1 px-2 py-1 rounded text-xs ${msg.is_outgoing ? 'bg-gray-700 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                                                  <span>🖼️</span>
                                                  <span className="truncate max-w-[100px]">{att.filename}</span>
                                                </div>
                                              </div>
                                            ) : (
                                              <a
                                                key={i}
                                                href={attUrl}
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
                                            );
                                          })}
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
                              id="poomfurniture-reply-textarea"
                              value={poomfurnitureReplyText}
                              onChange={(e) => setPoomfurnitureReplyText(e.target.value)}
                              placeholder={poomfurnitureReplyAll ? "Odpowiedz wszystkim (wlacznie z DW)..." : "Napisz odpowiedz..."}
                              rows={2}
                              className={`flex-1 px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 resize-none ${poomfurnitureReplyAll ? 'border-purple-400 focus:ring-purple-500' : 'border-gray-300 dark:border-gray-600 focus:ring-teal-500'}`}
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

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl font-bold"
            >
              ✕
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.filename}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white text-center mt-2 text-sm opacity-75">{lightboxImage.filename}</p>
          </div>
        </div>
      )}
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
