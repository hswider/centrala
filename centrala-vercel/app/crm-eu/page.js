'use client';

import { useState, useEffect, useCallback } from 'react';

export default function CRMEUPage() {
  const [activeTab, setActiveTab] = useState('amazon-de');

  // Amazon DE state
  const [amazonAuth, setAmazonAuth] = useState({ authenticated: false, loading: true });
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

  const tabs = [
    { key: 'amazon-de', label: 'Amazon DE Agnieszka', icon: '📦', badge: unreadCount, color: 'orange' },
    // Tu beda dodane kolejne kanaly EU
  ];

  // Check Amazon DE authentication status
  const checkAmazonAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/amazon-de/auth');
      const data = await res.json();
      setAmazonAuth({
        authenticated: data.authenticated,
        loading: false,
        error: data.error
      });

      if (data.authenticated) {
        fetchSyncStatus();
        fetchThreads();
      }
    } catch (err) {
      console.error('Amazon auth check error:', err);
      setAmazonAuth({ authenticated: false, loading: false, error: err.message });
    }
  }, []);

  useEffect(() => {
    checkAmazonAuth();
  }, [checkAmazonAuth]);

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/amazon-de/messages?action=status');
      const data = await res.json();
      if (data.success) {
        setSyncStatus(data.status);
        setUnreadCount(data.status?.unreadCount || 0);
      }
    } catch (err) {
      console.error('Sync status error:', err);
    }
  };

  // Fetch threads
  const fetchThreads = async () => {
    setThreadsLoading(true);
    try {
      const res = await fetch('/api/amazon-de/messages');
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

  // Sync orders from Amazon
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/amazon-de/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Zsynchronizowano ${data.synced.threads} zamowien z Amazon DE`);
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
      const res = await fetch(`/api/amazon-de/messages/${thread.id}`);
      const data = await res.json();
      if (data.success) {
        setThreadMessages(data.messages || []);
        if (data.thread) {
          setSelectedThread(data.thread);
        }
      }

      // Mark as read
      if (thread.unread) {
        await fetch(`/api/amazon-de/messages/${thread.id}`, { method: 'PUT' });
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
      const res = await fetch(`/api/amazon-de/messages/${selectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setReplyText('');
        // Refresh messages
        const msgRes = await fetch(`/api/amazon-de/messages/${selectedThread.id}`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setThreadMessages(msgData.messages || []);
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
                    ? `text-${tab.color}-600 border-b-2 border-${tab.color}-600 bg-${tab.color}-50`
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={activeTab === tab.key ? {
                  color: tab.color === 'orange' ? '#ea580c' : undefined,
                  borderColor: tab.color === 'orange' ? '#ea580c' : undefined,
                  backgroundColor: tab.color === 'orange' ? '#fff7ed' : undefined
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
          {/* Amazon DE */}
          {activeTab === 'amazon-de' && (
            <div>
              {amazonAuth.loading ? (
                <div className="p-8 text-center text-gray-500">Ladowanie...</div>
              ) : !amazonAuth.authenticated ? (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">📦</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Amazon DE - Konfiguracja</h3>
                  {amazonAuth.error ? (
                    <>
                      <p className="text-red-500 mb-4">{amazonAuth.error}</p>
                      <p className="text-gray-500 mb-4">
                        Sprawdz czy zmienne srodowiskowe sa poprawnie skonfigurowane w Vercel:
                      </p>
                      <ul className="text-left text-sm text-gray-600 max-w-md mx-auto mb-4 space-y-1">
                        <li>• AMAZON_DE_CLIENT_ID</li>
                        <li>• AMAZON_DE_CLIENT_SECRET</li>
                        <li>• AMAZON_DE_REFRESH_TOKEN</li>
                        <li>• AMAZON_DE_MARKETPLACE_ID</li>
                      </ul>
                    </>
                  ) : (
                    <p className="text-gray-500 mb-4">
                      Dodaj dane uwierzytelniajace Amazon SP-API w zmiennych srodowiskowych Vercel.
                    </p>
                  )}
                  <button
                    onClick={checkAmazonAuth}
                    className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                  >
                    Sprawdz ponownie
                  </button>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-[700px]">
                  {/* Thread list */}
                  <div className={`lg:w-1/3 border-r border-gray-200 flex flex-col ${selectedThread ? 'hidden lg:flex' : ''}`}>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900">Zamowienia Amazon DE</h2>
                        <p className="text-xs text-gray-500">
                          {syncStatus?.lastSyncAt ? `Sync: ${formatDate(syncStatus.lastSyncAt)}` : 'Nie zsynchronizowano'}
                        </p>
                      </div>
                      <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      >
                        {syncing ? 'Sync...' : 'Synchronizuj'}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {threadsLoading ? (
                        <div className="p-4 text-center text-gray-500">Ladowanie...</div>
                      ) : threads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p>Brak zamowien.</p>
                          <p className="text-xs mt-2">Kliknij "Synchronizuj" aby pobrac zamowienia z Amazon.</p>
                        </div>
                      ) : (
                        threads.map((thread) => (
                          <button
                            key={thread.id}
                            onClick={() => openThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                              selectedThread?.id === thread.id ? 'bg-orange-50' : ''
                            } ${thread.unread ? 'bg-orange-50/50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium text-sm">
                                {(thread.buyer_name || 'A')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${thread.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {thread.order_id || thread.id}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                    {formatDate(thread.last_message_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">
                                  {thread.subject || 'Zamowienie Amazon'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {thread.order_total && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                      {parseFloat(thread.order_total).toFixed(2)} {thread.order_currency || 'EUR'}
                                    </span>
                                  )}
                                  {thread.unread && (
                                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded">
                                      Nowe
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
                      <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <span className="text-6xl">📦</span>
                          <p className="mt-2">Wybierz zamowienie z listy</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Thread header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                          <button
                            onClick={() => setSelectedThread(null)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                          >
                            ← Wstecz
                          </button>
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium">
                            {(selectedThread.buyer_name || 'A')[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              Zamowienie #{selectedThread.order_id || selectedThread.id}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {selectedThread.buyer_name || 'Klient Amazon'}
                            </p>
                          </div>
                          <a
                            href={`https://sellercentral.amazon.de/orders-v3/order/${selectedThread.order_id || selectedThread.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                          >
                            Seller Central
                          </a>
                        </div>

                        {/* Order info panel */}
                        <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-xs text-orange-600 font-medium">Zamowienie</span>
                                <p className="text-sm font-semibold text-gray-900">#{selectedThread.order_id || selectedThread.id}</p>
                              </div>
                              {selectedThread.order_total && (
                                <div>
                                  <span className="text-xs text-orange-600 font-medium">Wartosc</span>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {parseFloat(selectedThread.order_total).toFixed(2)} {selectedThread.order_currency || 'EUR'}
                                  </p>
                                </div>
                              )}
                              {selectedThread.last_message_at && (
                                <div>
                                  <span className="text-xs text-orange-600 font-medium">Data</span>
                                  <p className="text-sm text-gray-900">
                                    {new Date(selectedThread.last_message_at).toLocaleDateString('pl-PL')}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {selectedThread.snippet}
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                          {messagesLoading ? (
                            <div className="text-center text-gray-500">Ladowanie wiadomosci...</div>
                          ) : threadMessages.length === 0 ? (
                            <div className="text-center text-gray-500">
                              <p>Brak wiadomosci w tym watku.</p>
                              <p className="text-xs mt-2">Mozesz wyslac wiadomosc do klienta ponizej.</p>
                            </div>
                          ) : (
                            threadMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.is_outgoing ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[75%] px-4 py-2 rounded-lg ${
                                    msg.is_outgoing
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-white border border-gray-200 text-gray-900'
                                  }`}
                                >
                                  <p className="text-xs mb-1 opacity-75">
                                    {msg.is_outgoing ? 'Ty' : (msg.sender || 'Klient')}
                                  </p>
                                  <p className="whitespace-pre-wrap break-words">{msg.body_text}</p>
                                  <p className={`text-xs mt-1 ${
                                    msg.is_outgoing ? 'text-orange-200' : 'text-gray-400'
                                  }`}>
                                    {formatDate(msg.sent_at)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Reply input */}
                        <div className="px-4 py-3 border-t border-gray-200 bg-white">
                          <div className="mb-2 text-xs text-gray-500">
                            Uwaga: Amazon ogranicza kiedy mozna wysylac wiadomosci do klientow.
                            Wiadomosci typu "Unexpected Problem" mozna wysylac tylko w okreslonych sytuacjach.
                          </div>
                          <div className="flex gap-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Napisz wiadomosc do klienta..."
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
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
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
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
        </div>
      </main>
    </div>
  );
}
