'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CRMContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('wiadomosci');

  // Allegro state
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

  const tabs = [
    { key: 'wiadomosci', label: 'Wiadomosci Allegro', icon: '💬', badge: unreadCount },
    { key: 'klienci', label: 'Klienci', icon: '👥' },
    { key: 'kontakty', label: 'Kontakty', icon: '📞' },
    { key: 'notatki', label: 'Notatki', icon: '📝' },
  ];

  // Check for success/error from OAuth callback
  useEffect(() => {
    const success = searchParams.get('allegro_success');
    const error = searchParams.get('allegro_error');

    if (success) {
      alert('Pomyslnie polaczono z Allegro!');
      window.history.replaceState({}, '', '/crm');
      checkAllegroAuth();
    }
    if (error) {
      alert(`Blad Allegro: ${error}`);
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

  // Przykładowe dane
  const [klienci] = useState([
    { id: 1, nazwa: 'Jan Kowalski', email: 'jan@example.com', telefon: '+48 123 456 789', zamowienia: 12, wartosc: 4520 },
    { id: 2, nazwa: 'Anna Nowak', email: 'anna@example.com', telefon: '+48 987 654 321', zamowienia: 8, wartosc: 2890 },
  ]);

  const [kontakty] = useState([
    { id: 1, klient: 'Jan Kowalski', typ: 'Telefon', data: '2025-01-10', notatka: 'Pytanie o status zamówienia' },
  ]);

  const [notatki] = useState([
    { id: 1, klient: 'Jan Kowalski', data: '2025-01-10', tresc: 'Stały klient, preferuje płatność przy odbiorze' },
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">CRM</h1>
            <p className="text-xs sm:text-sm text-gray-500">Zarzadzanie klientami i wiadomosciami</p>
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
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
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
          {/* Wiadomości Allegro */}
          {activeTab === 'wiadomosci' && (
            <div>
              {allegroAuth.loading ? (
                <div className="p-8 text-center text-gray-500">Ladowanie...</div>
              ) : !allegroAuth.authenticated ? (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">🔗</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Polacz z Allegro</h3>
                  <p className="text-gray-500 mb-4">Aby zobaczyc wiadomosci, musisz polaczyc konto Allegro</p>
                  <a
                    href="/api/allegro/auth?action=login"
                    className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                  >
                    Zaloguj przez Allegro
                  </a>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-[600px]">
                  {/* Thread list */}
                  <div className={`lg:w-1/3 border-r border-gray-200 flex flex-col ${selectedThread ? 'hidden lg:flex' : ''}`}>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900">Wiadomosci</h2>
                        <p className="text-xs text-gray-500">
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
                        <div className="p-4 text-center text-gray-500">Ladowanie...</div>
                      ) : threads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Brak wiadomosci. Kliknij "Synchronizuj".
                        </div>
                      ) : (
                        threads.map((thread) => (
                          <button
                            key={thread.id}
                            onClick={() => openThread(thread)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
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
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                                  {(thread.interlocutor_login || '?')[0].toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${!thread.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {thread.interlocutor_login || 'Nieznany'}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                    {formatDate(thread.last_message_at)}
                                  </span>
                                </div>
                                {thread.offer_title && (
                                  <p className="text-xs text-gray-500 truncate">{thread.offer_title}</p>
                                )}
                                {!thread.read && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-orange-500 text-white text-xs rounded">
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
                  <div className={`lg:w-2/3 flex flex-col ${!selectedThread ? 'hidden lg:flex' : ''}`}>
                    {!selectedThread ? (
                      <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <span className="text-6xl">💬</span>
                          <p className="mt-2">Wybierz watek z listy</p>
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
                          {selectedThread.interlocutor_avatar ? (
                            <img
                              src={selectedThread.interlocutor_avatar}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                              {(selectedThread.interlocutor_login || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {selectedThread.interlocutor_login || 'Nieznany'}
                            </h3>
                            {selectedThread.offer_title && (
                              <p className="text-xs text-gray-500 truncate">{selectedThread.offer_title}</p>
                            )}
                          </div>
                          {selectedThread.apilo_order_id && (
                            <a
                              href={`/zamowienia/${selectedThread.apilo_order_id}`}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Zamowienie #{selectedThread.apilo_order_id}
                            </a>
                          )}
                        </div>

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
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                          {messagesLoading ? (
                            <div className="text-center text-gray-500">Ladowanie wiadomosci...</div>
                          ) : threadMessages.length === 0 ? (
                            <div className="text-center text-gray-500">Brak wiadomosci</div>
                          ) : (
                            threadMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.sender_is_interlocutor ? 'justify-start' : 'justify-end'}`}
                              >
                                <div
                                  className={`max-w-[75%] px-4 py-2 rounded-lg ${
                                    msg.sender_is_interlocutor
                                      ? 'bg-white border border-gray-200 text-gray-900'
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
                        <div className="px-4 py-3 border-t border-gray-200 bg-white">
                          <div className="flex gap-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Napisz wiadomosc..."
                              rows={2}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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

          {/* Klienci */}
          {activeTab === 'klienci' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Lista klientow</h2>
                <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  + Dodaj klienta
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Zamowienia</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Wartosc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {klienci.map((klient) => (
                      <tr key={klient.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{klient.nazwa}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{klient.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{klient.telefon}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {klient.zamowienia}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{klient.wartosc.toLocaleString('pl-PL')} zl</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Kontakty */}
          {activeTab === 'kontakty' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Historia kontaktow</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {kontakty.map((kontakt) => (
                  <div key={kontakt.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            kontakt.typ === 'Telefon' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {kontakt.typ}
                          </span>
                          <span className="font-medium text-gray-900">{kontakt.klient}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{kontakt.notatka}</p>
                      </div>
                      <span className="text-xs text-gray-500">{kontakt.data}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notatki */}
          {activeTab === 'notatki' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Notatki</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {notatki.map((notatka) => (
                  <div key={notatka.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{notatka.klient}</div>
                        <p className="mt-1 text-sm text-gray-600">{notatka.tresc}</p>
                      </div>
                      <span className="text-xs text-gray-500">{notatka.data}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CRMPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">Ladowanie...</div>}>
      <CRMContent />
    </Suspense>
  );
}
