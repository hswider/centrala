'use client';

import { useState, useEffect, useCallback } from 'react';

export default function CRMEUPage() {
  const [activeTab, setActiveTab] = useState('amazon');

  // Amazon Gmail state
  const [amazonAuth, setAmazonAuth] = useState({ authenticated: false, loading: true, authUrl: null });
  const [amazonThreads, setAmazonThreads] = useState([]);
  const [amazonThreadsLoading, setAmazonThreadsLoading] = useState(false);
  const [amazonSelectedThread, setAmazonSelectedThread] = useState(null);
  const [amazonMessages, setAmazonMessages] = useState([]);
  const [amazonMessagesLoading, setAmazonMessagesLoading] = useState(false);
  const [amazonSyncing, setAmazonSyncing] = useState(false);
  const [amazonSyncStatus, setAmazonSyncStatus] = useState(null);
  const [amazonUnreadCount, setAmazonUnreadCount] = useState(0);

  // Kaufland state
  const [kauflandAuth, setKauflandAuth] = useState({ authenticated: false, loading: true });
  const [kauflandTickets, setKauflandTickets] = useState([]);
  const [kauflandTicketsLoading, setKauflandTicketsLoading] = useState(false);
  const [kauflandSelectedTicket, setKauflandSelectedTicket] = useState(null);
  const [kauflandMessages, setKauflandMessages] = useState([]);
  const [kauflandMessagesLoading, setKauflandMessagesLoading] = useState(false);
  const [kauflandSyncing, setKauflandSyncing] = useState(false);
  const [kauflandSyncStatus, setKauflandSyncStatus] = useState(null);
  const [kauflandUnreadCount, setKauflandUnreadCount] = useState(0);

  // Shared state
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const tabs = [
    { key: 'amazon', label: 'Amazon (Gutekissen)', icon: '📧', badge: amazonUnreadCount, color: 'orange' },
    { key: 'kaufland', label: 'Kaufland', icon: '🛒', badge: kauflandUnreadCount, color: 'red' },
  ];

  // ==================== AMAZON FUNCTIONS ====================

  const checkAmazonAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/gmail-amazon-de/auth');
      const data = await res.json();
      setAmazonAuth({
        authenticated: data.authenticated,
        loading: false,
        authUrl: data.authUrl,
        email: data.email,
        error: data.error
      });

      if (data.authenticated) {
        fetchAmazonSyncStatus();
        fetchAmazonThreads();
      }
    } catch (err) {
      console.error('Amazon auth check error:', err);
      setAmazonAuth({ authenticated: false, loading: false, error: err.message });
    }
  }, []);

  const fetchAmazonSyncStatus = async () => {
    try {
      const res = await fetch('/api/gmail-amazon-de/sync');
      const data = await res.json();
      if (data.success) {
        setAmazonSyncStatus({
          lastSyncAt: data.lastSyncAt,
          syncInProgress: data.syncInProgress
        });
      }
    } catch (err) {
      console.error('Amazon sync status error:', err);
    }
  };

  const fetchAmazonThreads = async () => {
    setAmazonThreadsLoading(true);
    try {
      const res = await fetch('/api/gmail-amazon-de/messages');
      const data = await res.json();
      if (data.success) {
        setAmazonThreads(data.threads || []);
        const unread = (data.threads || []).filter(t => t.unread).length;
        setAmazonUnreadCount(unread);
      }
    } catch (err) {
      console.error('Fetch Amazon threads error:', err);
    } finally {
      setAmazonThreadsLoading(false);
    }
  };

  const handleAmazonSync = async () => {
    setAmazonSyncing(true);
    try {
      const res = await fetch('/api/gmail-amazon-de/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Zsynchronizowano ${data.syncedThreads} watkow (${data.syncedMessages} wiadomosci)`);
        fetchAmazonThreads();
        fetchAmazonSyncStatus();
      } else {
        alert('Blad synchronizacji: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setAmazonSyncing(false);
    }
  };

  const openAmazonThread = async (thread) => {
    setAmazonSelectedThread(thread);
    setAmazonMessagesLoading(true);
    setAmazonMessages([]);
    setReplyText('');

    try {
      const res = await fetch(`/api/gmail-amazon-de/messages/${thread.id}`);
      const data = await res.json();
      if (data.success) {
        setAmazonMessages(data.messages || []);
        if (data.thread) {
          setAmazonSelectedThread(data.thread);
        }
      }

      if (thread.unread) {
        await fetch(`/api/gmail-amazon-de/messages/${thread.id}`, { method: 'PUT' });
        fetchAmazonThreads();
      }
    } catch (err) {
      console.error('Open Amazon thread error:', err);
    } finally {
      setAmazonMessagesLoading(false);
    }
  };

  const handleAmazonReply = async () => {
    if (!replyText.trim() || !amazonSelectedThread) return;

    setSending(true);
    try {
      const res = await fetch(`/api/gmail-amazon-de/messages/${amazonSelectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: replyText.trim(),
          to: amazonSelectedThread.from_email,
          subject: amazonSelectedThread.subject
        })
      });
      const data = await res.json();

      if (data.success) {
        setReplyText('');
        const msgRes = await fetch(`/api/gmail-amazon-de/messages/${amazonSelectedThread.id}`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setAmazonMessages(msgData.messages || []);
        }
        alert('Wiadomosc wyslana!');
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // ==================== KAUFLAND FUNCTIONS ====================

  const checkKauflandAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/kaufland/auth');
      const data = await res.json();
      setKauflandAuth({
        authenticated: data.authenticated,
        loading: false,
        error: data.error
      });

      if (data.authenticated) {
        fetchKauflandSyncStatus();
        fetchKauflandTickets();
      }
    } catch (err) {
      console.error('Kaufland auth check error:', err);
      setKauflandAuth({ authenticated: false, loading: false, error: err.message });
    }
  }, []);

  const fetchKauflandSyncStatus = async () => {
    try {
      const res = await fetch('/api/kaufland/sync');
      const data = await res.json();
      if (data.success) {
        setKauflandSyncStatus({
          lastSyncAt: data.lastSyncAt,
          syncInProgress: data.syncInProgress
        });
      }
    } catch (err) {
      console.error('Kaufland sync status error:', err);
    }
  };

  const fetchKauflandTickets = async () => {
    setKauflandTicketsLoading(true);
    try {
      const res = await fetch('/api/kaufland/tickets');
      const data = await res.json();
      if (data.success) {
        setKauflandTickets(data.tickets || []);
        setKauflandUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Fetch Kaufland tickets error:', err);
    } finally {
      setKauflandTicketsLoading(false);
    }
  };

  const handleKauflandSync = async () => {
    setKauflandSyncing(true);
    try {
      const res = await fetch('/api/kaufland/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Zsynchronizowano ${data.syncedTickets} ticketow (${data.syncedMessages} wiadomosci)`);
        fetchKauflandTickets();
        fetchKauflandSyncStatus();
      } else {
        alert('Blad synchronizacji: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setKauflandSyncing(false);
    }
  };

  const openKauflandTicket = async (ticket) => {
    setKauflandSelectedTicket(ticket);
    setKauflandMessagesLoading(true);
    setKauflandMessages([]);
    setReplyText('');

    try {
      const res = await fetch(`/api/kaufland/tickets/${ticket.id}`);
      const data = await res.json();
      if (data.success) {
        setKauflandMessages(data.messages || []);
        if (data.ticket) {
          setKauflandSelectedTicket(data.ticket);
        }
      }

      if (ticket.unread) {
        await fetch(`/api/kaufland/tickets/${ticket.id}`, { method: 'PUT' });
        fetchKauflandTickets();
      }
    } catch (err) {
      console.error('Open Kaufland ticket error:', err);
    } finally {
      setKauflandMessagesLoading(false);
    }
  };

  const handleKauflandReply = async () => {
    if (!replyText.trim() || !kauflandSelectedTicket) return;

    setSending(true);
    try {
      const res = await fetch(`/api/kaufland/tickets/${kauflandSelectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setReplyText('');
        const msgRes = await fetch(`/api/kaufland/tickets/${kauflandSelectedTicket.id}`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setKauflandMessages(msgData.messages || []);
        }
        alert('Wiadomosc wyslana!');
      } else {
        alert('Blad wysylania: ' + data.error);
      }
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    checkAmazonAuth();
    checkKauflandAuth();

    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail_amazon_de_connected') === 'true') {
      window.history.replaceState({}, '', '/crm-eu');
      checkAmazonAuth();
    }
    if (params.get('gmail_amazon_de_error')) {
      alert('Blad autoryzacji Gmail: ' + params.get('gmail_amazon_de_error'));
      window.history.replaceState({}, '', '/crm-eu');
    }
  }, [checkAmazonAuth, checkKauflandAuth]);

  // ==================== HELPERS ====================

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

  const getMarketplaceFlag = (marketplace) => {
    const flags = ['DE', 'FR', 'IT', 'ES', 'PL', 'NL', 'SE', 'BE', 'SK', 'CZ', 'AT'];
    if (flags.includes(marketplace)) {
      return `/flags/${marketplace}.png`;
    }
    return null;
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">CRM EU</h1>
            <p className="text-xs sm:text-sm text-gray-500">Zarzadzanie klientami i wiadomosciami - rynki europejskie</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors whitespace-nowrap px-4 ${
                  activeTab === tab.key
                    ? 'border-b-2'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={activeTab === tab.key ? {
                  color: tab.color === 'orange' ? '#ea580c' : tab.color === 'red' ? '#dc2626' : undefined,
                  borderColor: tab.color === 'orange' ? '#ea580c' : tab.color === 'red' ? '#dc2626' : undefined,
                  backgroundColor: tab.color === 'orange' ? '#fff7ed' : tab.color === 'red' ? '#fef2f2' : undefined
                } : {}}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {/* ==================== AMAZON TAB ==================== */}
          {activeTab === 'amazon' && (
            <div>
              {amazonAuth.loading ? (
                <div className="p-8 text-center text-gray-500">Ladowanie...</div>
              ) : !amazonAuth.authenticated ? (
                <div className="p-8 text-center">
                  <div className="mb-4"><span className="text-6xl">📧</span></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Amazon - Polacz Gmail</h3>
                  <p className="text-gray-500 mb-4">Polacz konto Gmail aby odbierac i wysylac wiadomosci od klientow Amazon.</p>
                  {amazonAuth.authUrl ? (
                    <a href={amazonAuth.authUrl} className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
                      Zaloguj sie przez Google
                    </a>
                  ) : (
                    <div>
                      <p className="text-red-500 mb-4">{amazonAuth.error || 'Brak konfiguracji'}</p>
                      <button onClick={checkAmazonAuth} className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                        Sprawdz ponownie
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-[700px]">
                  {/* Thread list */}
                  <div className={`lg:w-1/3 border-r border-gray-200 flex flex-col ${amazonSelectedThread ? 'hidden lg:flex' : ''}`}>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900">Wiadomosci Amazon</h2>
                        <p className="text-xs text-gray-500">
                          {amazonAuth.email && <span className="text-orange-600">{amazonAuth.email}</span>}
                          {amazonSyncStatus?.lastSyncAt && ` • Sync: ${formatDate(amazonSyncStatus.lastSyncAt)}`}
                        </p>
                      </div>
                      <button onClick={handleAmazonSync} disabled={amazonSyncing} className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
                        {amazonSyncing ? 'Sync...' : 'Synchronizuj'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {amazonThreadsLoading ? (
                        <div className="p-4 text-center text-gray-500">Ladowanie...</div>
                      ) : amazonThreads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p>Brak wiadomosci.</p>
                          <p className="text-xs mt-2">Kliknij "Synchronizuj" aby pobrac wiadomosci.</p>
                        </div>
                      ) : (
                        amazonThreads.map((thread) => (
                          <button
                            key={thread.id}
                            onClick={() => openAmazonThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                              amazonSelectedThread?.id === thread.id ? 'bg-orange-50' : ''
                            } ${thread.unread ? 'bg-orange-50/50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                                {thread.marketplace && getMarketplaceFlag(thread.marketplace) ? (
                                  <img src={getMarketplaceFlag(thread.marketplace)} alt={thread.marketplace} className="w-6 h-6 object-contain" />
                                ) : (
                                  <span className="text-orange-600 font-medium text-sm">{(thread.from_name || thread.from_email || 'A')[0].toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {thread.marketplace && <span className="text-xs font-medium text-gray-500">{thread.marketplace}</span>}
                                    <span className={`font-medium truncate ${thread.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                      {thread.order_id || thread.from_name || 'Wiadomosc'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400 ml-2">{formatDate(thread.last_message_at)}</span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{thread.subject || 'Brak tematu'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {thread.order_id && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">#{thread.order_id}</span>}
                                  {thread.unread && <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded">Nowe</span>}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message view */}
                  <div className={`lg:w-2/3 flex flex-col ${!amazonSelectedThread ? 'hidden lg:flex' : ''}`}>
                    {!amazonSelectedThread ? (
                      <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <span className="text-6xl">📧</span>
                          <p className="mt-2">Wybierz wiadomosc z listy</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                          <button onClick={() => setAmazonSelectedThread(null)} className="lg:hidden text-gray-500">← Wstecz</button>
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                            {amazonSelectedThread.marketplace && getMarketplaceFlag(amazonSelectedThread.marketplace) ? (
                              <img src={getMarketplaceFlag(amazonSelectedThread.marketplace)} alt={amazonSelectedThread.marketplace} className="w-6 h-6 object-contain" />
                            ) : (
                              <span className="text-orange-600 font-medium">{(amazonSelectedThread.from_name || 'A')[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {amazonSelectedThread.marketplace && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">{amazonSelectedThread.marketplace}</span>}
                              <h3 className="font-semibold text-gray-900">{amazonSelectedThread.from_name || amazonSelectedThread.from_email || 'Klient'}</h3>
                            </div>
                            <p className="text-xs text-gray-500">{amazonSelectedThread.from_email}</p>
                          </div>
                          {amazonSelectedThread.order_id && (
                            <a href={`https://sellercentral.amazon.${amazonSelectedThread.marketplace?.toLowerCase() || 'de'}/orders-v3/order/${amazonSelectedThread.order_id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
                              Seller Central
                            </a>
                          )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                          {amazonMessagesLoading ? (
                            <div className="text-center text-gray-500">Ladowanie...</div>
                          ) : amazonMessages.length === 0 ? (
                            <div className="text-center text-gray-500">Brak wiadomosci</div>
                          ) : (
                            amazonMessages.map((msg) => (
                              <div key={msg.id} className={`flex ${msg.is_outgoing ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] px-4 py-2 rounded-lg ${msg.is_outgoing ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                                  <p className="text-xs mb-1 opacity-75">{msg.is_outgoing ? 'Ty' : (msg.from_name || msg.from_email || 'Klient')}</p>
                                  <p className="whitespace-pre-wrap break-words">{msg.body_text || msg.body_html || ''}</p>
                                  <p className={`text-xs mt-1 ${msg.is_outgoing ? 'text-orange-200' : 'text-gray-400'}`}>{formatDate(msg.sent_at)}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="px-4 py-3 border-t border-gray-200 bg-white">
                          <div className="flex gap-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Napisz wiadomosc..."
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAmazonReply(); } }}
                            />
                            <button onClick={handleAmazonReply} disabled={sending || !replyText.trim()} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
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

          {/* ==================== KAUFLAND TAB ==================== */}
          {activeTab === 'kaufland' && (
            <div>
              {kauflandAuth.loading ? (
                <div className="p-8 text-center text-gray-500">Ladowanie...</div>
              ) : !kauflandAuth.authenticated ? (
                <div className="p-8 text-center">
                  <div className="mb-4"><span className="text-6xl">🛒</span></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Kaufland - Konfiguracja</h3>
                  <p className="text-gray-500 mb-4">Dodaj klucze API Kaufland w zmiennych srodowiskowych.</p>
                  <ul className="text-left text-sm text-gray-600 max-w-md mx-auto mb-4 space-y-1">
                    <li>• KAUFLAND_CLIENT_KEY</li>
                    <li>• KAUFLAND_SECRET_KEY</li>
                  </ul>
                  <button onClick={checkKauflandAuth} className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    Sprawdz ponownie
                  </button>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-[700px]">
                  {/* Ticket list */}
                  <div className={`lg:w-1/3 border-r border-gray-200 flex flex-col ${kauflandSelectedTicket ? 'hidden lg:flex' : ''}`}>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900">Tickety Kaufland</h2>
                        <p className="text-xs text-gray-500">
                          {kauflandSyncStatus?.lastSyncAt ? `Sync: ${formatDate(kauflandSyncStatus.lastSyncAt)}` : 'Nie zsynchronizowano'}
                        </p>
                      </div>
                      <button onClick={handleKauflandSync} disabled={kauflandSyncing} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                        {kauflandSyncing ? 'Sync...' : 'Synchronizuj'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {kauflandTicketsLoading ? (
                        <div className="p-4 text-center text-gray-500">Ladowanie...</div>
                      ) : kauflandTickets.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p>Brak ticketow.</p>
                          <p className="text-xs mt-2">Kliknij "Synchronizuj" aby pobrac tickety.</p>
                        </div>
                      ) : (
                        kauflandTickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            onClick={() => openKauflandTicket(ticket)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                              kauflandSelectedTicket?.id === ticket.id ? 'bg-red-50' : ''
                            } ${ticket.unread ? 'bg-red-50/50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center overflow-hidden">
                                {ticket.marketplace && getMarketplaceFlag(ticket.marketplace) ? (
                                  <img src={getMarketplaceFlag(ticket.marketplace)} alt={ticket.marketplace} className="w-6 h-6 object-contain" />
                                ) : (
                                  <span className="text-red-600 font-medium text-sm">K</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {ticket.marketplace && <span className="text-xs font-medium text-gray-500">{ticket.marketplace}</span>}
                                    <span className={`font-medium truncate ${ticket.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                      #{ticket.ticket_number || ticket.id}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400 ml-2">{formatDate(ticket.updated_at || ticket.opened_at)}</span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{ticket.topic || ticket.reason || 'Ticket'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {ticket.order_id && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">#{ticket.order_id}</span>}
                                  {ticket.status && <span className={`px-2 py-0.5 text-xs rounded ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{ticket.status}</span>}
                                  {ticket.unread && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">Nowe</span>}
                                  {ticket.is_seller_responsible && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">Wymaga odpowiedzi</span>}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message view */}
                  <div className={`lg:w-2/3 flex flex-col ${!kauflandSelectedTicket ? 'hidden lg:flex' : ''}`}>
                    {!kauflandSelectedTicket ? (
                      <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <span className="text-6xl">🛒</span>
                          <p className="mt-2">Wybierz ticket z listy</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                          <button onClick={() => setKauflandSelectedTicket(null)} className="lg:hidden text-gray-500">← Wstecz</button>
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center overflow-hidden">
                            {kauflandSelectedTicket.marketplace && getMarketplaceFlag(kauflandSelectedTicket.marketplace) ? (
                              <img src={getMarketplaceFlag(kauflandSelectedTicket.marketplace)} alt={kauflandSelectedTicket.marketplace} className="w-6 h-6 object-contain" />
                            ) : (
                              <span className="text-red-600 font-medium">K</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {kauflandSelectedTicket.marketplace && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">{kauflandSelectedTicket.marketplace}</span>}
                              <h3 className="font-semibold text-gray-900">Ticket #{kauflandSelectedTicket.ticket_number || kauflandSelectedTicket.id}</h3>
                            </div>
                            <p className="text-xs text-gray-500">{kauflandSelectedTicket.buyer_name || kauflandSelectedTicket.buyer_email || 'Klient Kaufland'}</p>
                          </div>
                          {kauflandSelectedTicket.order_id && (
                            <a href={`https://sellerportal.kaufland.de/order-management/orders/${kauflandSelectedTicket.order_id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                              Seller Portal
                            </a>
                          )}
                        </div>

                        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
                          <div className="flex items-center gap-4 text-sm">
                            {kauflandSelectedTicket.reason && (
                              <div>
                                <span className="text-xs text-red-600 font-medium">Powod</span>
                                <p className="text-gray-900">{kauflandSelectedTicket.reason}</p>
                              </div>
                            )}
                            {kauflandSelectedTicket.status && (
                              <div>
                                <span className="text-xs text-red-600 font-medium">Status</span>
                                <p className="text-gray-900">{kauflandSelectedTicket.status}</p>
                              </div>
                            )}
                            {kauflandSelectedTicket.is_seller_responsible && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">Oczekuje na Twoja odpowiedz</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                          {kauflandMessagesLoading ? (
                            <div className="text-center text-gray-500">Ladowanie...</div>
                          ) : kauflandMessages.length === 0 ? (
                            <div className="text-center text-gray-500">Brak wiadomosci</div>
                          ) : (
                            kauflandMessages.map((msg) => (
                              <div key={msg.id} className={`flex ${msg.is_from_seller ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] px-4 py-2 rounded-lg ${msg.is_from_seller ? 'bg-red-600 text-white' : msg.sender === 'kaufland' ? 'bg-blue-100 border border-blue-200 text-gray-900' : 'bg-white border border-gray-200 text-gray-900'}`}>
                                  <p className="text-xs mb-1 opacity-75">
                                    {msg.is_from_seller ? 'Ty' : msg.sender === 'kaufland' ? 'Kaufland Support' : 'Klient'}
                                  </p>
                                  <p className="whitespace-pre-wrap break-words">{msg.text || ''}</p>
                                  <p className={`text-xs mt-1 ${msg.is_from_seller ? 'text-red-200' : 'text-gray-400'}`}>{formatDate(msg.created_at)}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="px-4 py-3 border-t border-gray-200 bg-white">
                          <div className="flex gap-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Napisz odpowiedz..."
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleKauflandReply(); } }}
                            />
                            <button onClick={handleKauflandReply} disabled={sending || !replyText.trim()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
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
        </div>
      </main>
    </div>
  );
}
