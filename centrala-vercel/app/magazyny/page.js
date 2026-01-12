'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function MagazynyPage() {
  const [activeTab, setActiveTab] = useState('gotowe');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStanId, setEditingStanId] = useState(null);
  const [editingStanValue, setEditingStanValue] = useState('');
  const [editingCenaId, setEditingCenaId] = useState(null);
  const [editingCenaValue, setEditingCenaValue] = useState('');
  const [editingCzasId, setEditingCzasId] = useState(null);
  const [editingCzasValue, setEditingCzasValue] = useState('');
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeItem, setRecipeItem] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const fileInputRef = useRef(null);
  const stanInputRef = useRef(null);
  const cenaInputRef = useRef(null);
  const czasInputRef = useRef(null);

  const tabs = [
    { key: 'gotowe', label: 'Gotowe produkty', icon: '📦' },
    { key: 'polprodukty', label: 'Polprodukty', icon: '🔧' },
    { key: 'wykroje', label: 'Wykroje', icon: '✂️' },
    { key: 'surowce', label: 'Surowce', icon: '🪵' },
  ];

  const [magazyny, setMagazyny] = useState({
    gotowe: [],
    polprodukty: [],
    wykroje: [],
    surowce: [],
  });

  const [newItem, setNewItem] = useState({ sku: '', nazwa: '', stan: '', cena: '', czas_produkcji: '' });

  // Pobierz dane z API
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      const data = await res.json();

      if (data.success) {
        setMagazyny(data.data);
      }
    } catch (error) {
      console.error('Blad pobierania danych:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Dodaj nowa pozycje
  const handleAddItem = async () => {
    if (!newItem.sku || !newItem.nazwa) return;

    setSaving(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: newItem.sku,
          nazwa: newItem.nazwa,
          stan: parseInt(newItem.stan) || 0,
          cena: parseFloat(newItem.cena) || 0,
          czas_produkcji: parseInt(newItem.czas_produkcji) || 0,
          kategoria: activeTab
        })
      });

      const data = await res.json();

      if (data.success) {
        await fetchInventory();
        setNewItem({ sku: '', nazwa: '', stan: '', cena: '', czas_produkcji: '' });
        setShowAddModal(false);
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Usun pozycje
  const handleDeleteItem = async (id) => {
    if (!confirm('Czy na pewno chcesz usunac te pozycje?')) return;

    try {
      const res = await fetch(`/api/inventory?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        await fetchInventory();
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    }
  };

  // Edytuj pozycje
  const handleEditItem = (item) => {
    setEditingItem({ ...item });
    setShowEditModal(true);
  };

  // Zapisz edycje
  const handleSaveEdit = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          sku: editingItem.sku,
          nazwa: editingItem.nazwa,
          stan: parseInt(editingItem.stan) || 0,
          cena: parseFloat(editingItem.cena) || 0,
          czas_produkcji: parseInt(editingItem.czas_produkcji) || 0
        })
      });

      const data = await res.json();

      if (data.success) {
        await fetchInventory();
        setShowEditModal(false);
        setEditingItem(null);
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Szybka edycja stanu (+/-) - optimistic update
  const handleQuickStanChange = (item, delta) => {
    const oldStan = item.stan;
    const newStan = Math.max(0, oldStan + delta);

    // Natychmiastowa aktualizacja UI (optimistic)
    setMagazyny(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(i =>
        i.id === item.id ? { ...i, stan: newStan } : i
      )
    }));

    // API w tle - bez await
    fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, stan: newStan })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          // Cofnij zmiane jesli API nie powiodlo sie
          setMagazyny(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].map(i =>
              i.id === item.id ? { ...i, stan: oldStan } : i
            )
          }));
        }
      })
      .catch(() => {
        // Cofnij zmiane przy bledzie sieci
        setMagazyny(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(i =>
            i.id === item.id ? { ...i, stan: oldStan } : i
          )
        }));
      });
  };

  // Inline edycja stanu - klikniecie w liczbe
  const handleStanClick = (item) => {
    setEditingStanId(item.id);
    setEditingStanValue(String(item.stan));
    // Focus na input po renderze
    setTimeout(() => stanInputRef.current?.select(), 0);
  };

  // Zapisz inline edycje stanu
  const handleStanSubmit = (item) => {
    const newStan = Math.max(0, parseInt(editingStanValue) || 0);
    const oldStan = item.stan;

    setEditingStanId(null);

    if (newStan === oldStan) return;

    // Optimistic update
    setMagazyny(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(i =>
        i.id === item.id ? { ...i, stan: newStan } : i
      )
    }));

    // API w tle
    fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, stan: newStan })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          setMagazyny(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].map(i =>
              i.id === item.id ? { ...i, stan: oldStan } : i
            )
          }));
        }
      })
      .catch(() => {
        setMagazyny(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(i =>
            i.id === item.id ? { ...i, stan: oldStan } : i
          )
        }));
      });
  };

  // Inline edycja ceny - klikniecie w cene
  const handleCenaClick = (item) => {
    setEditingCenaId(item.id);
    setEditingCenaValue(String(item.cena || 0));
    setTimeout(() => cenaInputRef.current?.select(), 0);
  };

  // Zapisz inline edycje ceny
  const handleCenaSubmit = (item) => {
    const newCena = Math.max(0, parseFloat(editingCenaValue) || 0);
    const oldCena = item.cena || 0;

    setEditingCenaId(null);

    if (newCena === oldCena) return;

    // Optimistic update
    setMagazyny(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(i =>
        i.id === item.id ? { ...i, cena: newCena } : i
      )
    }));

    // API w tle
    fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, cena: newCena })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          setMagazyny(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].map(i =>
              i.id === item.id ? { ...i, cena: oldCena } : i
            )
          }));
        }
      })
      .catch(() => {
        setMagazyny(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(i =>
            i.id === item.id ? { ...i, cena: oldCena } : i
          )
        }));
      });
  };

  // Inline edycja czasu produkcji - klikniecie
  const handleCzasClick = (item) => {
    setEditingCzasId(item.id);
    setEditingCzasValue(String(item.czas_produkcji || 0));
    setTimeout(() => czasInputRef.current?.select(), 0);
  };

  // Zapisz inline edycje czasu produkcji
  const handleCzasSubmit = (item) => {
    const newCzas = Math.max(0, parseInt(editingCzasValue) || 0);
    const oldCzas = item.czas_produkcji || 0;

    setEditingCzasId(null);

    if (newCzas === oldCzas) return;

    // Optimistic update
    setMagazyny(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(i =>
        i.id === item.id ? { ...i, czas_produkcji: newCzas } : i
      )
    }));

    // API w tle
    fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, czas_produkcji: newCzas })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          setMagazyny(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].map(i =>
              i.id === item.id ? { ...i, czas_produkcji: oldCzas } : i
            )
          }));
        }
      })
      .catch(() => {
        setMagazyny(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(i =>
            i.id === item.id ? { ...i, czas_produkcji: oldCzas } : i
          )
        }));
      });
  };

  // Receptura - otworz modal
  const handleOpenRecipe = async (item) => {
    setRecipeItem(item);
    setShowRecipeModal(true);
    setLoadingRecipe(true);

    try {
      const res = await fetch(`/api/recipes?productId=${item.id}`);
      const data = await res.json();
      if (data.success) {
        setRecipeIngredients(data.data);
      }
    } catch (error) {
      console.error('Blad pobierania receptury:', error);
    } finally {
      setLoadingRecipe(false);
    }
  };

  // Dodaj skladnik do receptury
  const handleAddIngredient = async (ingredientId, quantity = 1) => {
    if (!recipeItem) return;

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: recipeItem.id,
          ingredientId,
          quantity
        })
      });

      const data = await res.json();
      if (data.success) {
        // Odswież recepture
        const res2 = await fetch(`/api/recipes?productId=${recipeItem.id}`);
        const data2 = await res2.json();
        if (data2.success) {
          setRecipeIngredients(data2.data);
        }
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    }
  };

  // Usun skladnik z receptury
  const handleRemoveIngredient = async (recipeId) => {
    try {
      const res = await fetch(`/api/recipes?id=${recipeId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        setRecipeIngredients(prev => prev.filter(i => i.id !== recipeId));
      }
    } catch (error) {
      console.error('Blad usuwania skladnika:', error);
    }
  };

  // Aktualizuj ilosc skladnika
  const handleUpdateIngredientQty = async (recipeId, newQty) => {
    try {
      await fetch('/api/recipes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recipeId, quantity: newQty })
      });

      setRecipeIngredients(prev =>
        prev.map(i => i.id === recipeId ? { ...i, quantity: newQty } : i)
      );
    } catch (error) {
      console.error('Blad aktualizacji ilosci:', error);
    }
  };

  // Eksport do CSV - tylko aktualny magazyn
  const handleExportCSV = () => {
    const items = magazyny[activeTab] || [];

    if (items.length === 0) {
      alert('Brak danych do eksportu w magazynie: ' + getTabLabel(activeTab));
      return;
    }

    // Rozne kolumny dla gotowych produktow vs reszty
    let headers, csvRows;

    if (activeTab === 'gotowe') {
      headers = ['SKU', 'Nazwa', 'Stan', 'Cena PLN', 'Czas produkcji (min)'];
      csvRows = [
        headers.join(';'),
        ...items.map(item =>
          [item.sku, item.nazwa, item.stan, (item.cena || 0).toFixed(2), item.czas_produkcji || 0].join(';')
        )
      ];
    } else {
      headers = ['SKU', 'Nazwa', 'Stan', 'Wartosc netto PLN'];
      csvRows = [
        headers.join(';'),
        ...items.map(item =>
          [item.sku, item.nazwa, item.stan, (item.cena || 0).toFixed(2)].join(';')
        )
      ];
    }

    const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM dla polskich znakow
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `magazyn_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pobierz przykladowy CSV
  const handleDownloadExampleCSV = () => {
    let headers, exampleRows;

    if (activeTab === 'gotowe') {
      headers = ['SKU', 'Nazwa', 'Stan', 'Cena PLN', 'Czas produkcji (min)'];
      exampleRows = [
        'PUFA-MIKI-ROSA;Pufa Miki Rosa;25;299.00;45',
        'PUFA-MIKI-BLUE;Pufa Miki Blue;18;299.00;45',
        'LAWKA-OGR-120;Lawka ogrodowa 120cm;12;449.00;90',
        'FOTEL-RETRO-GR;Fotel Retro Grafit;8;599.00;120'
      ];
    } else if (activeTab === 'polprodukty') {
      headers = ['SKU', 'Nazwa', 'Stan', 'Wartosc netto PLN'];
      exampleRows = [
        'PP-STELA-PUFA;Stelaz do pufy;50;45.00',
        'PP-OPARCIE-FOT;Oparcie fotela;30;85.00',
        'PP-SIEDZISKO-L;Siedzisko lawki;20;120.00'
      ];
    } else if (activeTab === 'wykroje') {
      headers = ['SKU', 'Nazwa', 'Stan', 'Wartosc netto PLN'];
      exampleRows = [
        'WYK-VELVET-ROSA;Wykroj velvet rosa 1m2;100;35.00',
        'WYK-VELVET-BLUE;Wykroj velvet blue 1m2;80;35.00',
        'WYK-SKORA-CZAR;Wykroj skora czarna 1m2;40;95.00'
      ];
    } else {
      headers = ['SKU', 'Nazwa', 'Stan', 'Wartosc netto PLN'];
      exampleRows = [
        'SUR-PIANKA-T25;Pianka T25 arkusz;200;18.50',
        'SUR-DREWNO-BUK;Drewno bukowe 2m;150;45.00',
        'SUR-SRUBY-M6;Sruby M6 opak. 100szt;500;12.00',
        'SUR-KLEJ-TAPIC;Klej tapicerski 1L;75;28.00'
      ];
    }

    const csvContent = '\uFEFF' + headers.join(';') + '\n' + exampleRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `przyklad_${activeTab}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import z pliku
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        const items = [];
        // Pomin pierwszy wiersz jesli to naglowek
        const startIndex = lines[0]?.toLowerCase().includes('sku') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(/[,;\t]/);
          if (cols.length >= 3) {
            const sku = cols[0]?.trim();
            const nazwa = cols[1]?.trim();
            const stan = parseInt(cols[2]?.trim()) || 0;
            const cena = parseFloat(cols[3]?.trim()) || 0;
            const czas_produkcji = activeTab === 'gotowe' ? (parseInt(cols[4]?.trim()) || 0) : 0;

            if (sku && nazwa) {
              items.push({ sku, nazwa, stan, cena, czas_produkcji });
            }
          }
        }

        if (items.length > 0) {
          setSaving(true);
          const res = await fetch('/api/inventory/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items,
              kategoria: activeTab
            })
          });

          const data = await res.json();

          if (data.success) {
            await fetchInventory();
            alert(`Zaimportowano ${data.imported} z ${data.total} pozycji`);
          } else {
            alert('Blad: ' + data.error);
          }
          setSaving(false);
        } else {
          alert('Nie znaleziono poprawnych danych w pliku');
        }
      } catch (error) {
        alert('Blad podczas importu: ' + error.message);
        setSaving(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowImportModal(false);
  };

  const getTabLabel = (key) => {
    return tabs.find(t => t.key === key)?.label || key;
  };

  // Filtrowanie po wyszukiwaniu
  const currentItems = (magazyny[activeTab] || []).filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.sku.toLowerCase().includes(q) || item.nazwa.toLowerCase().includes(q);
  });

  const totalItems = currentItems.reduce((sum, item) => sum + item.stan, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Magazyny</h1>
            <p className="text-xs sm:text-sm text-gray-500">Zarzadzanie stanami magazynowymi</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Export CSV
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Import CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Dodaj
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {tabs.map(tab => {
            const items = magazyny[tab.key] || [];
            const totalStan = items.reduce((sum, i) => sum + i.stan, 0);
            return (
              <div key={tab.key} className="bg-white rounded-lg shadow p-3 lg:p-4">
                <p className="text-xs text-gray-500 truncate">{tab.label}</p>
                <p className="text-xl lg:text-2xl font-bold text-blue-600">{items.length}</p>
                <p className="text-xs text-gray-400">{totalStan} szt.</p>
              </div>
            );
          })}
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
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{getTabLabel(activeTab)}</h2>
              <p className="text-xs text-gray-500">Laczny stan: {totalItems} szt.</p>
            </div>
            <input
              type="text"
              placeholder="Szukaj SKU lub nazwy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Wskaznik przewijania na mobile */}
          <div className="lg:hidden flex items-center justify-end gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
            <span>Przesun w prawo</span>
            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>

          {loading ? (
            <div className="px-4 py-12 text-center text-gray-500">
              Ladowanie danych...
            </div>
          ) : (
            <div className="relative">
              {/* Gradient fade na prawej krawedzi - tylko mobile */}
              <div className="lg:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">SKU</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa produktu</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">Stan</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                      {activeTab === 'gotowe' ? 'Cena' : 'Wart. netto'}
                    </th>
                    {activeTab === 'gotowe' && (
                      <>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Koszt wytw.</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Net profit</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Czas</th>
                      </>
                    )}
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'gotowe' ? 8 : 5} className="px-4 py-8 text-center text-gray-500">
                        {searchQuery
                          ? 'Brak wynikow dla wyszukiwania'
                          : 'Brak pozycji w magazynie. Dodaj recznie lub zaimportuj z CSV.'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 w-40 min-w-[160px]">
                          <span className="font-mono text-xs text-gray-900 whitespace-nowrap">{item.sku}</span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">{item.nazwa}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleQuickStanChange(item, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                              title="Zmniejsz o 1"
                            >
                              -
                            </button>
                            {editingStanId === item.id ? (
                              <input
                                ref={stanInputRef}
                                type="number"
                                value={editingStanValue}
                                onChange={(e) => setEditingStanValue(e.target.value)}
                                onBlur={() => handleStanSubmit(item)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleStanSubmit(item);
                                  if (e.key === 'Escape') setEditingStanId(null);
                                }}
                                className="w-16 px-2 py-1 text-center text-sm font-bold border-2 border-blue-500 rounded focus:outline-none"
                                min="0"
                              />
                            ) : (
                              <button
                                onClick={() => handleStanClick(item)}
                                className={`px-3 py-1 rounded text-sm font-bold min-w-[50px] text-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${
                                  item.stan <= 10 ? 'bg-red-100 text-red-800' :
                                  item.stan <= 30 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}
                                title="Kliknij aby edytowac"
                              >
                                {item.stan}
                              </button>
                            )}
                            <button
                              onClick={() => handleQuickStanChange(item, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-green-100 text-green-700 rounded hover:bg-green-200 font-bold"
                              title="Zwieksz o 1"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {editingCenaId === item.id ? (
                            <input
                              ref={cenaInputRef}
                              type="number"
                              step="0.01"
                              value={editingCenaValue}
                              onChange={(e) => setEditingCenaValue(e.target.value)}
                              onBlur={() => handleCenaSubmit(item)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCenaSubmit(item);
                                if (e.key === 'Escape') setEditingCenaId(null);
                              }}
                              className="w-18 px-1 py-0.5 text-center text-sm font-medium border-2 border-blue-500 rounded focus:outline-none"
                              min="0"
                            />
                          ) : (
                            <button
                              onClick={() => handleCenaClick(item)}
                              className="px-1.5 py-0.5 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:ring-2 hover:ring-blue-400 transition-all"
                              title="Kliknij aby edytowac cene"
                            >
                              {(item.cena || 0).toFixed(2)}
                            </button>
                          )}
                        </td>
                        {activeTab === 'gotowe' && (
                          <>
                            {/* Koszt wytworzenia */}
                            <td className="px-2 py-2 text-center">
                              <span className="px-1.5 py-0.5 rounded text-sm font-medium bg-orange-50 text-orange-700">
                                {(item.koszt_wytworzenia || 0).toFixed(2)}
                              </span>
                            </td>
                            {/* Net profit */}
                            <td className="px-2 py-2 text-center">
                              {(() => {
                                const netProfit = (item.cena || 0) - (item.koszt_wytworzenia || 0);
                                return (
                                  <span className={`px-1.5 py-0.5 rounded text-sm font-bold ${
                                    netProfit > 0 ? 'bg-green-100 text-green-800' :
                                    netProfit < 0 ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}
                                  </span>
                                );
                              })()}
                            </td>
                            {/* Czas produkcji */}
                            <td className="px-2 py-2 text-center">
                              {editingCzasId === item.id ? (
                                <input
                                  ref={czasInputRef}
                                  type="number"
                                  value={editingCzasValue}
                                  onChange={(e) => setEditingCzasValue(e.target.value)}
                                  onBlur={() => handleCzasSubmit(item)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCzasSubmit(item);
                                    if (e.key === 'Escape') setEditingCzasId(null);
                                  }}
                                  className="w-14 px-1 py-0.5 text-center text-sm font-medium border-2 border-blue-500 rounded focus:outline-none"
                                  min="0"
                                />
                              ) : (
                                <button
                                  onClick={() => handleCzasClick(item)}
                                  className="px-1.5 py-0.5 rounded text-sm font-medium text-gray-700 bg-blue-50 hover:bg-blue-100 hover:ring-2 hover:ring-blue-400 transition-all"
                                  title="Kliknij aby edytowac czas produkcji"
                                >
                                  {item.czas_produkcji || 0}m
                                </button>
                              )}
                            </td>
                          </>
                        )}
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1 flex-nowrap">
                            {activeTab !== 'surowce' && (
                              <button
                                onClick={() => handleOpenRecipe(item)}
                                className="text-purple-600 hover:text-purple-800 text-xs font-medium px-1.5 py-0.5 bg-purple-50 rounded hover:bg-purple-100"
                                title="Szczegoly produktu"
                              >
                                Szczegoly
                              </button>
                            )}
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-0.5 bg-blue-50 rounded hover:bg-blue-100"
                              title="Edytuj pozycje"
                            >
                              Edytuj
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-xs px-1.5 py-0.5 bg-red-50 rounded hover:bg-red-100"
                              title="Usun pozycje"
                            >
                              Usun
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Dodaj pozycje do: {getTabLabel(activeTab)}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="np. MIKI-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa produktu</label>
                  <input
                    type="text"
                    value={newItem.nazwa}
                    onChange={(e) => setNewItem({ ...newItem, nazwa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="np. Pufa Miki Rosa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stan</label>
                    <input
                      type="number"
                      value={newItem.stan}
                      onChange={(e) => setNewItem({ ...newItem, stan: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. 25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {activeTab === 'gotowe' ? 'Cena PLN' : 'Wart. netto PLN'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.cena}
                      onChange={(e) => setNewItem({ ...newItem, cena: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. 99.99"
                    />
                  </div>
                </div>
                {activeTab === 'gotowe' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Czas produkcji (min)</label>
                    <input
                      type="number"
                      value={newItem.czas_produkcji}
                      onChange={(e) => setNewItem({ ...newItem, czas_produkcji: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. 30"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Zapisywanie...' : 'Dodaj'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Edytuj pozycje</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingItem.sku}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa produktu</label>
                  <input
                    type="text"
                    value={editingItem.nazwa}
                    onChange={(e) => setEditingItem({ ...editingItem, nazwa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stan</label>
                    <input
                      type="number"
                      value={editingItem.stan}
                      onChange={(e) => setEditingItem({ ...editingItem, stan: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {activeTab === 'gotowe' ? 'Cena PLN' : 'Wart. netto PLN'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem.cena || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, cena: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {activeTab === 'gotowe' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Czas produkcji (min)</label>
                    <input
                      type="number"
                      value={editingItem.czas_produkcji || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, czas_produkcji: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Import CSV do: {getTabLabel(activeTab)}</h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Format pliku CSV:</h4>
                <p className="text-sm text-blue-700 mb-2">Kolumny rozdzielone srednikiem (;) lub przecinkiem (,):</p>
                {activeTab === 'gotowe' ? (
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li><strong>SKU</strong> - kod produktu</li>
                    <li><strong>Nazwa</strong> - nazwa produktu</li>
                    <li><strong>Stan</strong> - ilosc w magazynie</li>
                    <li><strong>Cena PLN</strong> - cena sprzedazy</li>
                    <li><strong>Czas produkcji</strong> - w minutach</li>
                  </ol>
                ) : (
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li><strong>SKU</strong> - kod produktu</li>
                    <li><strong>Nazwa</strong> - nazwa produktu</li>
                    <li><strong>Stan</strong> - ilosc w magazynie</li>
                    <li><strong>Wartosc netto PLN</strong> - wartosc jednostkowa</li>
                  </ol>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800">Pobierz przykladowy plik</h4>
                    <p className="text-xs text-green-600">Wypelniony przykladowymi danymi</p>
                  </div>
                  <button
                    onClick={handleDownloadExampleCSV}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Pobierz CSV
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Uwaga:</strong> Jesli SKU juz istnieje, dane zostana zaktualizowane. Pierwszy wiersz moze byc naglowkiem (zostanie pominiety).
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Importowanie...' : 'Wybierz plik CSV'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Modal */}
        {showRecipeModal && recipeItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Szczegoly produktu</h3>
                  <p className="text-sm text-gray-500">{recipeItem.sku} - {recipeItem.nazwa}</p>
                </div>
                <button
                  onClick={() => {
                    setShowRecipeModal(false);
                    setRecipeItem(null);
                    setRecipeIngredients([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Kalkulator kosztow wytworzenia */}
              {(() => {
                const MINUTE_RATE = 0.358; // 3606 PLN netto / 168h / 60min
                const ingredientsCost = recipeIngredients.reduce((sum, ing) => sum + (ing.ingredientCena || 0) * ing.quantity, 0);
                const productionTime = recipeItem.czas_produkcji || 0;
                const laborCost = productionTime * MINUTE_RATE;
                const totalCost = ingredientsCost + laborCost;

                return (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">Kalkulator kosztow wytworzenia</h4>

                    {/* Czas produkcji */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Czas produkcji</p>
                        <p className="text-xs text-gray-500">Ustawiony w tabeli glownej</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">{productionTime} min</p>
                      </div>
                    </div>

                    {/* Koszt skladnikow */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Koszt skladnikow</p>
                        <p className="text-xs text-gray-500">Suma wartosci netto skladnikow</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-700">{ingredientsCost.toFixed(2)} zl</p>
                      </div>
                    </div>

                    {/* Koszt pracy */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Koszt pracy</p>
                        <p className="text-xs text-gray-500">{productionTime} min × {MINUTE_RATE.toFixed(3)} zl/min (najnizsza krajowa)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">{laborCost.toFixed(2)} zl</p>
                      </div>
                    </div>

                    {/* SUMA */}
                    <div className="flex justify-between items-center pt-3 mt-2">
                      <div>
                        <p className="text-base font-bold text-gray-900">KOSZT WYTWORZENIA</p>
                        <p className="text-xs text-gray-500">Skladniki + praca</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-700">{totalCost.toFixed(2)} zl</p>
                      </div>
                    </div>

                    {/* Marza */}
                    {recipeItem.cena > 0 && (
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-300">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Marza</p>
                          <p className="text-xs text-gray-500">Cena sprzedazy: {recipeItem.cena.toFixed(2)} zl</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${(recipeItem.cena - totalCost) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(recipeItem.cena - totalCost).toFixed(2)} zl ({totalCost > 0 ? (((recipeItem.cena - totalCost) / totalCost) * 100).toFixed(0) : 0}%)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {loadingRecipe ? (
                <div className="py-8 text-center text-gray-500">Ladowanie receptury...</div>
              ) : (
                <>
                  {/* Lista skladnikow */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Skladniki ({recipeIngredients.length})</h4>
                    {recipeIngredients.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded">
                        Brak skladnikow. Dodaj skladniki z listy ponizej.
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">SKU</th>
                            <th className="px-3 py-2 text-left">Nazwa</th>
                            <th className="px-3 py-2 text-center">Ilosc</th>
                            <th className="px-3 py-2 text-right">Wart. netto</th>
                            <th className="px-3 py-2 text-right">Suma</th>
                            <th className="px-3 py-2 text-center">Stan</th>
                            <th className="px-3 py-2 text-center">Akcja</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {recipeIngredients.map(ing => (
                            <tr key={ing.id}>
                              <td className="px-3 py-2 font-mono text-xs">{ing.sku}</td>
                              <td className="px-3 py-2">{ing.nazwa}</td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="number"
                                  value={ing.quantity}
                                  onChange={(e) => handleUpdateIngredientQty(ing.id, parseFloat(e.target.value) || 1)}
                                  className="w-16 px-2 py-1 text-center border rounded"
                                  min="0.01"
                                  step="0.01"
                                />
                              </td>
                              <td className="px-3 py-2 text-right text-gray-600">
                                {(ing.ingredientCena || 0).toFixed(2)} zl
                              </td>
                              <td className="px-3 py-2 text-right font-medium">
                                {((ing.ingredientCena || 0) * ing.quantity).toFixed(2)} zl
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  ing.ingredientStan > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {ing.ingredientStan} szt.
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => handleRemoveIngredient(ing.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Usun
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Dodaj skladnik */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Dodaj skladnik z magazynu</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Polprodukty - tylko dla gotowych produktow */}
                      {activeTab === 'gotowe' && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Polprodukty</p>
                          <div className="max-h-40 overflow-y-auto border rounded">
                            {(magazyny.polprodukty || []).length === 0 ? (
                              <p className="text-xs text-gray-400 p-2">Brak polproduktow</p>
                            ) : (
                              (magazyny.polprodukty || [])
                                .filter(p => !recipeIngredients.some(i => i.ingredientId === p.id))
                                .map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() => handleAddIngredient(p.id)}
                                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 border-b last:border-b-0 flex justify-between"
                                  >
                                    <span>{p.sku} - {p.nazwa}</span>
                                    <span className="text-gray-400">+</span>
                                  </button>
                                ))
                            )}
                          </div>
                        </div>
                      )}
                      {/* Wykroje - dla gotowych i polproduktow */}
                      {(activeTab === 'gotowe' || activeTab === 'polprodukty') && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Wykroje</p>
                          <div className="max-h-40 overflow-y-auto border rounded">
                            {(magazyny.wykroje || []).length === 0 ? (
                              <p className="text-xs text-gray-400 p-2">Brak wykrojow</p>
                            ) : (
                              (magazyny.wykroje || [])
                                .filter(p => !recipeIngredients.some(i => i.ingredientId === p.id))
                                .map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() => handleAddIngredient(p.id)}
                                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 border-b last:border-b-0 flex justify-between"
                                  >
                                    <span>{p.sku} - {p.nazwa}</span>
                                    <span className="text-gray-400">+</span>
                                  </button>
                                ))
                            )}
                          </div>
                        </div>
                      )}
                      {/* Surowce - dla wszystkich (gotowe, polprodukty, wykroje) */}
                      <div className={activeTab === 'wykroje' ? 'sm:col-span-2' : (activeTab === 'polprodukty' ? '' : 'sm:col-span-2')}>
                        <p className="text-xs font-medium text-gray-500 mb-1">Surowce</p>
                        <div className="max-h-40 overflow-y-auto border rounded">
                          {(magazyny.surowce || []).length === 0 ? (
                            <p className="text-xs text-gray-400 p-2">Brak surowcow</p>
                          ) : (
                            (magazyny.surowce || [])
                              .filter(p => !recipeIngredients.some(i => i.ingredientId === p.id))
                              .map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => handleAddIngredient(p.id)}
                                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 border-b last:border-b-0 flex justify-between"
                                >
                                  <span>{p.sku} - {p.nazwa}</span>
                                  <span className="text-gray-400">+</span>
                                </button>
                              ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => {
                        setShowRecipeModal(false);
                        setRecipeItem(null);
                        setRecipeIngredients([]);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Zamknij
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
