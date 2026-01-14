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
  const [ingredientSearchPolprodukty, setIngredientSearchPolprodukty] = useState('');
  const [ingredientSearchWykroje, setIngredientSearchWykroje] = useState('');
  const [ingredientSearchSurowce, setIngredientSearchSurowce] = useState('');
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('stan');
  const [sortDirection, setSortDirection] = useState('desc');
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

  const [newItem, setNewItem] = useState({ sku: '', nazwa: '', ean: '', stan: '', cena: '', czas_produkcji: '', jednostka: 'szt', tkanina: '' });

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
    // Dla wykrojow, polproduktow i surowcow SKU jest opcjonalne
    if (activeTab === 'wykroje' || activeTab === 'polprodukty' || activeTab === 'surowce') {
      if (!newItem.nazwa) return;
    } else {
      if (!newItem.sku || !newItem.nazwa) return;
    }

    // Sprawdz czy nazwa juz istnieje w tym magazynie
    const existingByName = (magazyny[activeTab] || []).find(
      item => item.nazwa.toLowerCase().trim() === newItem.nazwa.toLowerCase().trim()
    );
    if (existingByName) {
      alert(`Pozycja o nazwie "${newItem.nazwa}" juz istnieje w tym magazynie (SKU: ${existingByName.sku})`);
      return;
    }

    // Generuj SKU automatycznie dla wykrojow, polproduktow i surowcow jesli puste
    let finalSku = newItem.sku;
    if (!finalSku) {
      if (activeTab === 'wykroje') finalSku = `WYK-${Date.now()}`;
      else if (activeTab === 'polprodukty') finalSku = `PP-${Date.now()}`;
      else if (activeTab === 'surowce') finalSku = `SUR-${Date.now()}`;
      else finalSku = '';
    }

    setSaving(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: finalSku,
          nazwa: newItem.nazwa,
          ean: newItem.ean || null,
          stan: parseFloat(String(newItem.stan).replace(',', '.')) || 0,
          cena: parseFloat(newItem.cena) || 0,
          czas_produkcji: parseInt(newItem.czas_produkcji) || 0,
          jednostka: activeTab === 'surowce' ? newItem.jednostka : 'szt',
          tkanina: (activeTab === 'wykroje' || activeTab === 'polprodukty') ? (newItem.tkanina || null) : null,
          kategoria: activeTab
        })
      });

      const data = await res.json();

      if (data.success) {
        await fetchInventory();
        setNewItem({ sku: '', nazwa: '', ean: '', stan: '', cena: '', czas_produkcji: '', jednostka: 'szt', tkanina: '' });
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

  // Zaznaczanie pozycji
  const toggleSelectItem = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const allIds = filteredItems.map(item => item.id);
    const allSelected = allIds.every(id => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const toggleSelectPage = () => {
    const pageIds = currentItems.map(item => item.id);
    const allPageSelected = pageIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach(id => newSet.delete(id));
      } else {
        pageIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  // Masowe usuwanie
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Czy na pewno chcesz usunac ${selectedIds.size} zaznaczonych pozycji?`)) return;

    try {
      setSaving(true);
      const idsArray = Array.from(selectedIds);

      const res = await fetch('/api/inventory/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray })
      });

      const data = await res.json();

      if (data.success) {
        setSelectedIds(new Set());
        await fetchInventory();
        alert(`Usunieto ${data.deleted} pozycji`);
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    } finally {
      setSaving(false);
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
          ean: editingItem.ean || null,
          stan: parseFloat(String(editingItem.stan).replace(',', '.')) || 0,
          cena: parseFloat(editingItem.cena) || 0,
          czas_produkcji: parseInt(editingItem.czas_produkcji) || 0,
          jednostka: editingItem.jednostka || 'szt',
          tkanina: editingItem.tkanina || null
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
    const oldStan = Number(parseFloat(item.stan)) || 0;
    const newStan = Math.round(Math.max(0, oldStan + delta) * 100) / 100;

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
    const newStan = Math.max(0, parseFloat(editingStanValue.replace(',', '.')) || 0);
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
      headers = ['Nazwa', 'SKU', 'EAN', 'Stan', 'Cena PLN', 'Czas produkcji (min)'];
      csvRows = [
        headers.join(';'),
        ...items.map(item =>
          [item.nazwa, item.sku, item.ean || '', item.stan, (item.cena || 0).toFixed(2), item.czas_produkcji || 0].join(';')
        )
      ];
    } else if (activeTab === 'surowce') {
      headers = ['Nazwa', 'SKU (opcjonalne)', 'Stan', 'Jednostka', 'Wartosc netto PLN'];
      csvRows = [
        headers.join(';'),
        ...items.map(item =>
          [item.nazwa, item.sku, item.stan, item.jednostka || 'szt', (item.cena || 0).toFixed(2)].join(';')
        )
      ];
    } else {
      // polprodukty, wykroje - bez EAN
      headers = ['Nazwa', 'SKU (opcjonalne)', 'Tkanina', 'Stan', 'Wartosc netto PLN'];
      csvRows = [
        headers.join(';'),
        ...items.map(item =>
          [item.nazwa, item.sku, item.tkanina || '', item.stan, (item.cena || 0).toFixed(2)].join(';')
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
      headers = ['Nazwa', 'SKU', 'EAN', 'Stan', 'Cena PLN', 'Czas produkcji (min)'];
      exampleRows = [
        'Pufa Miki Rosa;PUFA-MIKI-ROSA;5901234123457;25;299.00;45',
        'Pufa Miki Blue;PUFA-MIKI-BLUE;5901234123464;18;299.00;45',
        'Lawka ogrodowa 120cm;LAWKA-OGR-120;;12;449.00;90',
        'Fotel Retro Grafit;FOTEL-RETRO-GR;5901234123471;8;599.00;120'
      ];
    } else if (activeTab === 'polprodukty') {
      // polprodukty - SKU i Tkanina opcjonalne
      headers = ['Nazwa', 'SKU (opcjonalne)', 'Tkanina (opcjonalne)', 'Stan', 'Wartosc netto PLN'];
      exampleRows = [
        'Stelaz do pufy;PP-STELA-PUFA;Velvet Gray;50;45.00',
        'Oparcie fotela;;Skora ekologiczna;30;85.00',
        'Siedzisko lawki;;;20;120.00'
      ];
    } else if (activeTab === 'wykroje') {
      // wykroje - SKU i Tkanina opcjonalne
      headers = ['Nazwa', 'SKU (opcjonalne)', 'Tkanina (opcjonalne)', 'Stan', 'Wartosc netto PLN'];
      exampleRows = [
        'Wykroj velvet rosa 1m2;WYK-VELVET-ROSA;Velvet Rosa;100;35.00',
        'Wykroj velvet blue 1m2;;Velvet Blue;80;35.00',
        'Wykroj skora czarna 1m2;;;40;95.00'
      ];
    } else {
      // surowce - SKU opcjonalne, z jednostka
      headers = ['Nazwa', 'SKU (opcjonalne)', 'Stan', 'Jednostka', 'Wartosc netto PLN'];
      exampleRows = [
        'Pianka T25 arkusz;SUR-PIANKA-T25;200;szt;18,50',
        'Drewno bukowe;;12,30;m;45,00',
        'Tkanina obiciowa welur;;8,5;m2;35,00',
        'Wata poliestrowa;SUR-WATA-POLIE;25,75;kg;28,00',
        'Lina jutowa;;150,5;mb;6,50',
        'Sruby M6 opak. 100szt;;500;szt;12,00'
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
        const skippedDuplicates = [];
        // Pomin pierwszy wiersz jesli to naglowek
        const startIndex = lines[0]?.toLowerCase().includes('nazwa') ? 1 : 0;

        // Pobierz istniejace nazwy w magazynie (lowercase dla porownania)
        const existingNames = new Set(
          (magazyny[activeTab] || []).map(item => item.nazwa.toLowerCase().trim())
        );
        // Nazwy dodane w tym imporcie (zeby wykryc duplikaty w pliku)
        const importedNames = new Set();

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          // Uzyj srednika jako separatora jesli wystepuje, inaczej tab
          // NIE uzywaj przecinka bo moze byc separatorem dziesietnym (12,30)
          const separator = line.includes(';') ? ';' : '\t';
          const cols = line.split(separator);
          if (cols.length >= 3) {
            const nazwa = cols[0]?.trim();
            const sku = cols[1]?.trim();

            let ean, stan, cena, czas_produkcji, jednostka, tkanina;

            if (activeTab === 'gotowe') {
              // gotowe: Nazwa, SKU, EAN, Stan, Cena, Czas produkcji
              ean = cols[2]?.trim() || '';
              stan = parseFloat(cols[3]?.trim()?.replace(',', '.')) || 0;
              cena = parseFloat(cols[4]?.trim()?.replace(',', '.')) || 0;
              czas_produkcji = parseInt(cols[5]?.trim()) || 0;
              jednostka = 'szt';
              tkanina = '';
            } else if (activeTab === 'surowce') {
              // surowce: Nazwa, SKU (opcjonalne), Stan, Jednostka, Wartosc netto (bez EAN)
              ean = '';
              stan = parseFloat(cols[2]?.trim()?.replace(',', '.')) || 0;
              const jednostkaVal = cols[3]?.trim()?.toLowerCase() || 'szt';
              jednostka = ['m', 'mb', 'm2', 'kg'].includes(jednostkaVal) ? jednostkaVal : 'szt';
              cena = parseFloat(cols[4]?.trim()?.replace(',', '.')) || 0;
              czas_produkcji = 0;
              tkanina = '';
            } else if (activeTab === 'wykroje' || activeTab === 'polprodukty') {
              // wykroje/polprodukty: Nazwa, SKU (opcjonalne), Tkanina (opcjonalne), Stan, Wartosc netto
              ean = '';
              tkanina = cols[2]?.trim() || '';
              stan = parseFloat(cols[3]?.trim()?.replace(',', '.')) || 0;
              cena = parseFloat(cols[4]?.trim()?.replace(',', '.')) || 0;
              czas_produkcji = 0;
              jednostka = 'szt';
            }

            // Walidacja EAN - jesli podany, musi miec 13 cyfr
            const validEan = ean && /^\d{13}$/.test(ean) ? ean : null;

            // Dla wykrojow, polproduktow i surowcow SKU jest opcjonalne - generuj automatycznie jesli puste
            let finalSku = sku;
            if (!finalSku) {
              if (activeTab === 'wykroje') finalSku = `WYK-${Date.now()}-${i}`;
              else if (activeTab === 'polprodukty') finalSku = `PP-${Date.now()}-${i}`;
              else if (activeTab === 'surowce') finalSku = `SUR-${Date.now()}-${i}`;
              else finalSku = null;
            }

            // Sprawdz duplikaty nazw
            const nazwaLower = nazwa?.toLowerCase().trim();
            if (nazwaLower && existingNames.has(nazwaLower)) {
              skippedDuplicates.push(`"${nazwa}" - juz istnieje w magazynie`);
              continue;
            }
            if (nazwaLower && importedNames.has(nazwaLower)) {
              skippedDuplicates.push(`"${nazwa}" - duplikat w pliku CSV`);
              continue;
            }

            if (finalSku && nazwa) {
              importedNames.add(nazwaLower);
              items.push({ sku: finalSku, nazwa, ean: validEan, stan, cena, czas_produkcji, jednostka, tkanina: tkanina || null });
            } else if (activeTab === 'wykroje' && nazwa) {
              // Dla wykrojow wystarczy sama nazwa
              importedNames.add(nazwaLower);
              items.push({ sku: `WYK-${Date.now()}-${i}`, nazwa, ean: validEan, stan, cena, czas_produkcji, jednostka, tkanina: tkanina || null });
            } else if (activeTab === 'polprodukty' && nazwa) {
              // Dla polproduktow wystarczy sama nazwa
              importedNames.add(nazwaLower);
              items.push({ sku: `PP-${Date.now()}-${i}`, nazwa, ean: validEan, stan, cena, czas_produkcji, jednostka, tkanina: tkanina || null });
            } else if (activeTab === 'surowce' && nazwa) {
              // Dla surowcow wystarczy sama nazwa
              importedNames.add(nazwaLower);
              items.push({ sku: `SUR-${Date.now()}-${i}`, nazwa, ean: validEan, stan, cena, czas_produkcji, jednostka, tkanina: null });
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
            let message = `Zaimportowano ${data.imported} z ${data.total} pozycji`;

            // Pokazuj pominiete duplikaty
            if (skippedDuplicates.length > 0) {
              const maxToShow = 10;
              const toShow = skippedDuplicates.slice(0, maxToShow);
              message += `\n\nPominieto duplikaty (${skippedDuplicates.length}):\n` + toShow.join('\n');
              if (skippedDuplicates.length > maxToShow) {
                message += `\n... i ${skippedDuplicates.length - maxToShow} wiecej`;
              }
            }

            // Pokazuj bledy jesli sa
            if (data.errors && data.errors.length > 0) {
              const maxErrorsToShow = 10;
              const errorsToShow = data.errors.slice(0, maxErrorsToShow);
              message += `\n\nBledy (${data.errors.length}):\n` + errorsToShow.join('\n');
              if (data.errors.length > maxErrorsToShow) {
                message += `\n... i ${data.errors.length - maxErrorsToShow} wiecej bledow`;
              }
            }

            alert(message);
          } else {
            alert('Blad: ' + data.error);
          }
          setSaving(false);
        } else if (skippedDuplicates.length > 0) {
          // Wszystkie pozycje byly duplikatami
          const maxToShow = 10;
          const toShow = skippedDuplicates.slice(0, maxToShow);
          let message = `Wszystkie pozycje zostaly pominiete jako duplikaty (${skippedDuplicates.length}):\n` + toShow.join('\n');
          if (skippedDuplicates.length > maxToShow) {
            message += `\n... i ${skippedDuplicates.length - maxToShow} wiecej`;
          }
          alert(message);
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

  // Opcje sortowania
  const sortOptions = [
    { value: 'nazwa-asc', label: 'Nazwa A-Z' },
    { value: 'nazwa-desc', label: 'Nazwa Z-A' },
    { value: 'sku-asc', label: 'SKU A-Z' },
    { value: 'sku-desc', label: 'SKU Z-A' },
    { value: 'stan-desc', label: 'Stan (najwyzszy)' },
    { value: 'stan-asc', label: 'Stan (najnizszy)' },
    { value: 'cena-desc', label: 'Cena/Wartosc (najwyzsza)' },
    { value: 'cena-asc', label: 'Cena/Wartosc (najnizsza)' },
    { value: 'wartosc-desc', label: 'Wart. Suma Netto (najwyzsza)' },
    { value: 'wartosc-asc', label: 'Wart. Suma Netto (najnizsza)' },
  ];

  const handleSortChange = (value) => {
    const [field, direction] = value.split('-');
    setSortBy(field);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  // Filtrowanie i sortowanie
  const filteredItems = (magazyny[activeTab] || [])
    .filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return item.sku.toLowerCase().includes(q) || item.nazwa.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'nazwa':
          comparison = (a.nazwa || '').localeCompare(b.nazwa || '', 'pl');
          break;
        case 'sku':
          comparison = (a.sku || '').localeCompare(b.sku || '', 'pl');
          break;
        case 'stan':
          comparison = (a.stan || 0) - (b.stan || 0);
          break;
        case 'cena':
          comparison = (a.cena || 0) - (b.cena || 0);
          break;
        case 'wartosc':
          comparison = ((a.cena || 0) * (a.stan || 0)) - ((b.cena || 0) * (b.stan || 0));
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Paginacja
  const totalPages = Math.ceil(filteredItems.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + perPage);

  const totalItems = Math.round(filteredItems.reduce((sum, item) => sum + item.stan, 0) * 100) / 100;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">WMS - Warehouse Management System</h1>
            <p className="text-xs sm:text-sm text-gray-500">Zarzadzanie stanami magazynowymi i zapasami</p>
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
            const totalStan = Math.round(items.reduce((sum, i) => sum + i.stan, 0) * 100) / 100;
            const totalValue = Math.round(items.reduce((sum, i) => sum + (i.cena || 0) * i.stan, 0) * 100) / 100;
            return (
              <div key={tab.key} className="bg-white rounded-lg shadow p-3 lg:p-4">
                <p className="text-xs text-gray-500 truncate">{tab.label}</p>
                <p className="text-xl lg:text-2xl font-bold text-blue-600">{items.length}</p>
                <p className="text-[10px] text-gray-400 -mt-1 mb-1">pozycji w magazynie</p>
                <div className="flex flex-col gap-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{totalStan.toFixed(2)} szt.</span>
                    <span className="text-[10px] text-gray-400">stan magazynu</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">{totalValue.toFixed(2)} zl</span>
                    <span className="text-[10px] text-gray-400">wartosc</span>
                  </div>
                </div>
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
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1); setSelectedIds(new Set()); }}
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
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">{getTabLabel(activeTab)}</h2>
              <p className="text-xs text-gray-500">Laczny stan: {totalItems.toFixed(2)} szt.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 whitespace-nowrap">Sortuj:</label>
                <select
                  value={`${sortBy}-${sortDirection}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Szukaj SKU lub nazwy..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              {/* Bulk action toolbar */}
              {selectedIds.size > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-800">
                      Zaznaczono: {selectedIds.size} {selectedIds.size === 1 ? 'pozycje' : selectedIds.size < 5 ? 'pozycje' : 'pozycji'}
                    </span>
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {filteredItems.length === selectedIds.size ? 'Odznacz wszystkie' : `Zaznacz wszystkie (${filteredItems.length})`}
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Wyczysc zaznaczenie
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkDelete}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <span>🗑️</span>
                      <span>Usun zaznaczone ({selectedIds.size})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Gradient fade na prawej krawedzi - tylko mobile */}
              <div className="lg:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-center w-10 sticky left-0 bg-gray-50 z-20">
                      <input
                        type="checkbox"
                        checked={currentItems.length > 0 && currentItems.every(item => selectedIds.has(item.id))}
                        onChange={toggleSelectPage}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        title="Zaznacz strone"
                      />
                    </th>
                    <th className="px-2 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase w-[100px] sm:w-auto sm:min-w-[150px] sticky left-10 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nazwa produktu</th>
                    <th className="px-2 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase w-32 sm:w-40">SKU</th>
                    {(activeTab === 'wykroje' || activeTab === 'polprodukty') && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">Tkanina</th>
                    )}
                    {activeTab === 'gotowe' && (
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">EAN-13</th>
                    )}
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">Stan</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                      {activeTab === 'gotowe' ? 'Cena' : 'Wart. Jedn. Netto'}
                    </th>
                    {activeTab !== 'gotowe' && (
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28">Wart. Suma Netto</th>
                    )}
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
                      <td colSpan={activeTab === 'gotowe' ? 10 : (activeTab === 'wykroje' || activeTab === 'polprodukty') ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                        {searchQuery
                          ? 'Brak wynikow dla wyszukiwania'
                          : 'Brak pozycji w magazynie. Dodaj recznie lub zaimportuj z CSV.'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item) => (
                      <tr key={item.id} className={`hover:bg-gray-50 ${selectedIds.has(item.id) ? 'bg-blue-50' : ''}`}>
                        <td className={`px-2 py-2 text-center sticky left-0 z-10 ${selectedIds.has(item.id) ? 'bg-blue-50' : 'bg-white'}`}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelectItem(item.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className={`px-2 py-2 text-xs sm:text-sm text-gray-700 w-[100px] sm:w-auto sm:min-w-[150px] max-w-[100px] sm:max-w-none truncate sticky left-10 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${selectedIds.has(item.id) ? 'bg-blue-50' : 'bg-white'}`} title={item.nazwa}>{item.nazwa}</td>
                        <td className="px-2 py-2 w-32 sm:w-40 min-w-[128px] sm:min-w-[160px]">
                          <span className="font-mono text-[10px] sm:text-xs text-gray-900 whitespace-nowrap">{item.sku}</span>
                        </td>
                        {(activeTab === 'wykroje' || activeTab === 'polprodukty') && (
                          <td className="px-3 py-2 text-sm text-gray-600">{item.tkanina || '-'}</td>
                        )}
                        {activeTab === 'gotowe' && (
                          <td className="px-2 py-2 text-center">
                            <span className="font-mono text-xs text-gray-500">{item.ean || '-'}</span>
                          </td>
                        )}
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
                                type="text"
                                inputMode="decimal"
                                value={editingStanValue}
                                onChange={(e) => {
                                  // Pozwol tylko na cyfry, kropke i przecinek
                                  const val = e.target.value.replace(/[^0-9.,]/g, '');
                                  setEditingStanValue(val);
                                }}
                                onBlur={() => handleStanSubmit(item)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleStanSubmit(item);
                                  if (e.key === 'Escape') setEditingStanId(null);
                                }}
                                className="w-20 px-2 py-1 text-center text-sm font-bold border-2 border-blue-500 rounded focus:outline-none"
                              />
                            ) : (
                              <button
                                onClick={() => handleStanClick(item)}
                                className={`px-3 py-1 rounded text-sm font-bold min-w-[50px] text-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all whitespace-nowrap ${
                                  item.stan <= 10 ? 'bg-red-100 text-red-800' :
                                  item.stan <= 30 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}
                                title="Kliknij aby edytowac"
                              >
                                {item.stan}{activeTab === 'surowce' ? ` ${item.jednostka || 'szt'}` : ''}
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
                              className="px-1.5 py-0.5 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:ring-2 hover:ring-blue-400 transition-all whitespace-nowrap"
                              title="Kliknij aby edytowac cene"
                            >
                              {(item.cena || 0).toFixed(2)} zl
                            </button>
                          )}
                        </td>
                        {activeTab !== 'gotowe' && (
                          <td className="px-2 py-2 text-center">
                            <span className="px-1.5 py-0.5 rounded text-sm font-bold text-green-800 bg-green-100 whitespace-nowrap">
                              {((item.cena || 0) * item.stan).toFixed(2)} zl
                            </span>
                          </td>
                        )}
                        {activeTab === 'gotowe' && (
                          <>
                            {/* Koszt wytworzenia */}
                            <td className="px-2 py-2 text-center">
                              <span className="px-1.5 py-0.5 rounded text-sm font-medium bg-orange-50 text-orange-700 whitespace-nowrap">
                                {(item.koszt_wytworzenia || 0).toFixed(2)} zl
                              </span>
                            </td>
                            {/* Net profit */}
                            <td className="px-2 py-2 text-center">
                              {(() => {
                                const netProfit = (item.cena || 0) - (item.koszt_wytworzenia || 0);
                                return (
                                  <span className={`px-1.5 py-0.5 rounded text-sm font-bold whitespace-nowrap ${
                                    netProfit > 0 ? 'bg-green-100 text-green-800' :
                                    netProfit < 0 ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)} zl
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

              {/* Pagination */}
              {filteredItems.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Pokazuje {startIndex + 1}-{Math.min(startIndex + perPage, filteredItems.length)} z {filteredItems.length}</span>
                    <span className="text-gray-400">|</span>
                    <span>Na stronie:</span>
                    <select
                      value={perPage}
                      onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={250}>250</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Poprzednia
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Nastepna
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU {(activeTab === 'wykroje' || activeTab === 'polprodukty' || activeTab === 'surowce') && <span className="text-gray-400 font-normal">(opcjonalne)</span>}
                  </label>
                  <input
                    type="text"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={activeTab === 'wykroje' ? 'np. WYK-001 (generowane automatycznie)' : activeTab === 'polprodukty' ? 'np. PP-001 (generowane automatycznie)' : activeTab === 'surowce' ? 'np. SUR-001 (generowane automatycznie)' : 'np. MIKI-001'}
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
                {(activeTab === 'wykroje' || activeTab === 'polprodukty') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tkanina <span className="text-gray-400 font-normal">(opcjonalne)</span>
                    </label>
                    <input
                      type="text"
                      value={newItem.tkanina}
                      onChange={(e) => setNewItem({ ...newItem, tkanina: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. Velvet Rosa"
                    />
                  </div>
                )}
                {activeTab === 'gotowe' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EAN-13 <span className="text-gray-400 font-normal">(opcjonalne)</span>
                    </label>
                    <input
                      type="text"
                      value={newItem.ean}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                        setNewItem({ ...newItem, ean: val });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="np. 5901234123457"
                      maxLength={13}
                    />
                    {newItem.ean && newItem.ean.length !== 13 && (
                      <p className="text-xs text-orange-600 mt-1">EAN musi miec 13 cyfr ({newItem.ean.length}/13)</p>
                    )}
                  </div>
                )}
                <div className={`grid gap-4 ${activeTab === 'surowce' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stan</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newItem.stan}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                        setNewItem({ ...newItem, stan: val });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. 25 lub 12,50"
                    />
                  </div>
                  {activeTab === 'surowce' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka</label>
                      <select
                        value={newItem.jednostka}
                        onChange={(e) => setNewItem({ ...newItem, jednostka: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="szt">szt (sztuki)</option>
                        <option value="m">m (metr)</option>
                        <option value="mb">mb (metr biezacy)</option>
                        <option value="m2">m2 (metr kwadratowy)</option>
                        <option value="kg">kg (kilogram)</option>
                      </select>
                    </div>
                  )}
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
                {(activeTab === 'wykroje' || activeTab === 'polprodukty') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tkanina <span className="text-gray-400 font-normal">(opcjonalne)</span>
                    </label>
                    <input
                      type="text"
                      value={editingItem.tkanina || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, tkanina: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. Velvet Rosa"
                    />
                  </div>
                )}
                {activeTab === 'gotowe' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EAN-13 <span className="text-gray-400 font-normal">(opcjonalne)</span>
                    </label>
                    <input
                      type="text"
                      value={editingItem.ean || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                        setEditingItem({ ...editingItem, ean: val });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="np. 5901234123457"
                      maxLength={13}
                    />
                    {editingItem.ean && editingItem.ean.length !== 13 && (
                      <p className="text-xs text-orange-600 mt-1">EAN musi miec 13 cyfr ({editingItem.ean.length}/13)</p>
                    )}
                  </div>
                )}
                <div className={`grid gap-4 ${activeTab === 'surowce' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stan</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editingItem.stan}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                        setEditingItem({ ...editingItem, stan: val });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {activeTab === 'surowce' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka</label>
                      <select
                        value={editingItem.jednostka || 'szt'}
                        onChange={(e) => setEditingItem({ ...editingItem, jednostka: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="szt">szt (sztuki)</option>
                        <option value="m">m (metr)</option>
                        <option value="mb">mb (metr biezacy)</option>
                        <option value="m2">m2 (metr kwadratowy)</option>
                        <option value="kg">kg (kilogram)</option>
                      </select>
                    </div>
                  )}
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
                <p className="text-sm text-blue-700 mb-2">Kolumny rozdzielone srednikiem (;). Liczby dziesietne moga uzywac przecinka lub kropki (np. 12,30 lub 12.30):</p>
                {activeTab === 'gotowe' ? (
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li><strong>Nazwa</strong> - nazwa produktu</li>
                    <li><strong>SKU</strong> - kod produktu</li>
                    <li><strong>EAN-13</strong> - opcjonalne, 13 cyfr</li>
                    <li><strong>Stan</strong> - ilosc w magazynie (np. 25 lub 12,5)</li>
                    <li><strong>Cena PLN</strong> - cena sprzedazy</li>
                    <li><strong>Czas produkcji</strong> - w minutach</li>
                  </ol>
                ) : activeTab === 'surowce' ? (
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li><strong>Nazwa</strong> - nazwa produktu</li>
                    <li><strong>SKU</strong> - opcjonalne (generowane automatycznie)</li>
                    <li><strong>Stan</strong> - ilosc w magazynie (np. 25 lub 12,30)</li>
                    <li><strong>Jednostka</strong> - szt, m, mb, m2 lub kg</li>
                    <li><strong>Wartosc netto PLN</strong> - wartosc jednostkowa</li>
                  </ol>
                ) : activeTab === 'wykroje' ? (
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li><strong>Nazwa</strong> - nazwa wykroju</li>
                    <li><strong>SKU</strong> - opcjonalne (generowane automatycznie)</li>
                    <li><strong>Tkanina</strong> - opcjonalne (np. Velvet Rosa)</li>
                    <li><strong>Stan</strong> - ilosc w magazynie (np. 25 lub 12,5)</li>
                    <li><strong>Wartosc netto PLN</strong> - wartosc jednostkowa</li>
                  </ol>
                ) : activeTab === 'polprodukty' ? (
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li><strong>Nazwa</strong> - nazwa produktu</li>
                    <li><strong>SKU</strong> - opcjonalne (generowane automatycznie)</li>
                    <li><strong>Tkanina</strong> - opcjonalne (np. Velvet Rosa)</li>
                    <li><strong>Stan</strong> - ilosc w magazynie (np. 25 lub 12,5)</li>
                    <li><strong>Wartosc netto PLN</strong> - wartosc jednostkowa</li>
                  </ol>
                ) : (
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li><strong>Nazwa</strong> - nazwa produktu</li>
                    <li><strong>SKU</strong> - kod produktu</li>
                    <li><strong>Stan</strong> - ilosc w magazynie (np. 25 lub 12,5)</li>
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
                    setIngredientSearchPolprodukty('');
                    setIngredientSearchWykroje('');
                    setIngredientSearchSurowce('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Kalkulator kosztow wytworzenia - tylko dla gotowych produktow */}
              {activeTab === 'gotowe' && (() => {
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
                          <input
                            type="text"
                            value={ingredientSearchPolprodukty}
                            onChange={(e) => setIngredientSearchPolprodukty(e.target.value)}
                            placeholder="Szukaj polproduktow..."
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="max-h-40 overflow-y-auto border rounded">
                            {(magazyny.polprodukty || []).length === 0 ? (
                              <p className="text-xs text-gray-400 p-2">Brak polproduktow</p>
                            ) : (
                              (() => {
                                const filtered = (magazyny.polprodukty || [])
                                  .filter(p => !recipeIngredients.some(i => i.ingredientId === p.id))
                                  .filter(p => {
                                    if (!ingredientSearchPolprodukty.trim()) return true;
                                    const search = ingredientSearchPolprodukty.toLowerCase().trim();
                                    return p.nazwa.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
                                  });
                                return filtered.length === 0 ? (
                                  <p className="text-xs text-gray-400 p-2">{ingredientSearchPolprodukty ? 'Brak wynikow' : 'Wszystkie dodane'}</p>
                                ) : (
                                  filtered.map(p => (
                                    <button
                                      key={p.id}
                                      onClick={() => handleAddIngredient(p.id)}
                                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 border-b last:border-b-0 flex justify-between"
                                    >
                                      <span>{p.sku} - {p.nazwa}</span>
                                      <span className="text-gray-400">+</span>
                                    </button>
                                  ))
                                );
                              })()
                            )}
                          </div>
                        </div>
                      )}
                      {/* Wykroje - dla gotowych i polproduktow */}
                      {(activeTab === 'gotowe' || activeTab === 'polprodukty') && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Wykroje</p>
                          <input
                            type="text"
                            value={ingredientSearchWykroje}
                            onChange={(e) => setIngredientSearchWykroje(e.target.value)}
                            placeholder="Szukaj wykrojow..."
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="max-h-40 overflow-y-auto border rounded">
                            {(magazyny.wykroje || []).length === 0 ? (
                              <p className="text-xs text-gray-400 p-2">Brak wykrojow</p>
                            ) : (
                              (() => {
                                const filtered = (magazyny.wykroje || [])
                                  .filter(p => !recipeIngredients.some(i => i.ingredientId === p.id))
                                  .filter(p => {
                                    if (!ingredientSearchWykroje.trim()) return true;
                                    const search = ingredientSearchWykroje.toLowerCase().trim();
                                    return p.nazwa.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
                                  });
                                return filtered.length === 0 ? (
                                  <p className="text-xs text-gray-400 p-2">{ingredientSearchWykroje ? 'Brak wynikow' : 'Wszystkie dodane'}</p>
                                ) : (
                                  filtered.map(p => (
                                    <button
                                      key={p.id}
                                      onClick={() => handleAddIngredient(p.id)}
                                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 border-b last:border-b-0 flex justify-between"
                                    >
                                      <span>{p.sku} - {p.nazwa}</span>
                                      <span className="text-gray-400">+</span>
                                    </button>
                                  ))
                                );
                              })()
                            )}
                          </div>
                        </div>
                      )}
                      {/* Surowce - dla wszystkich (gotowe, polprodukty, wykroje) */}
                      <div className={activeTab === 'wykroje' ? 'sm:col-span-2' : (activeTab === 'polprodukty' ? '' : 'sm:col-span-2')}>
                        <p className="text-xs font-medium text-gray-500 mb-1">Surowce</p>
                        <input
                          type="text"
                          value={ingredientSearchSurowce}
                          onChange={(e) => setIngredientSearchSurowce(e.target.value)}
                          placeholder="Szukaj surowcow..."
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="max-h-40 overflow-y-auto border rounded">
                          {(magazyny.surowce || []).length === 0 ? (
                            <p className="text-xs text-gray-400 p-2">Brak surowcow</p>
                          ) : (
                            (() => {
                              const filtered = (magazyny.surowce || [])
                                .filter(p => !recipeIngredients.some(i => i.ingredientId === p.id))
                                .filter(p => {
                                  if (!ingredientSearchSurowce.trim()) return true;
                                  const search = ingredientSearchSurowce.toLowerCase().trim();
                                  return p.nazwa.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
                                });
                              return filtered.length === 0 ? (
                                <p className="text-xs text-gray-400 p-2">{ingredientSearchSurowce ? 'Brak wynikow' : 'Wszystkie dodane'}</p>
                              ) : (
                                filtered.map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() => handleAddIngredient(p.id)}
                                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 border-b last:border-b-0 flex justify-between"
                                  >
                                    <span>{p.sku} - {p.nazwa}</span>
                                    <span className="text-gray-400">+</span>
                                  </button>
                                ))
                              );
                            })()
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
                        setIngredientSearchPolprodukty('');
                        setIngredientSearchWykroje('');
                        setIngredientSearchSurowce('');
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
