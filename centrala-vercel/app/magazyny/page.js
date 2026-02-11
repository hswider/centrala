'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function MagazynyPage() {
  const [activeTab, setActiveTab] = useState('gotowe');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUpdateMode, setImportUpdateMode] = useState(false);
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
  const [przyjęcieValues, setPrzyjęcieValues] = useState({});
  const [rozchódValues, setRozchódValues] = useState({});
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeItem, setRecipeItem] = useState(null);
  const [recipeChanged, setRecipeChanged] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyUsers, setHistoryUsers] = useState([]);
  const [historyFilterUser, setHistoryFilterUser] = useState('');
  const [historyFilterAction, setHistoryFilterAction] = useState('');
  const [historyFilterDateFrom, setHistoryFilterDateFrom] = useState('');
  const [historyFilterDateTo, setHistoryFilterDateTo] = useState('');
  const [historyPerPage, setHistoryPerPage] = useState(200);
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
  const [showColorModal, setShowColorModal] = useState(false);
  const [colorItem, setColorItem] = useState(null);
  const [colorYellow, setColorYellow] = useState('');
  const [colorRed, setColorRed] = useState('');
  const [savingColor, setSavingColor] = useState(false);
  const [showBulkWarningModal, setShowBulkWarningModal] = useState(false);
  const [bulkYellow, setBulkYellow] = useState('');
  const [bulkRed, setBulkRed] = useState('');
  const [savingBulkWarning, setSavingBulkWarning] = useState(false);
  // Sub-zakładki dla Surowce (WZ/RW)
  const [surowceSubTab, setSurowceSubTab] = useState('lista'); // 'lista', 'wz', 'rw'
  const [showWZModal, setShowWZModal] = useState(false);
  const [showRWModal, setShowRWModal] = useState(false);
  const [wzDocument, setWzDocument] = useState({
    numer: '',
    firma: '',
    pozycje: [{ produktId: null, nazwa: '', ilosc: '', jednostka: 'szt' }]
  });
  const [rwDocument, setRwDocument] = useState({
    numer: '',
    firma: 'POOM',
    pozycje: [{ produktId: null, nazwa: '', ilosc: '', jednostka: 'szt' }]
  });
  const [savingDocument, setSavingDocument] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
  // Tasks/Zadania state
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [wmsTasks, setWmsTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [taskSending, setTaskSending] = useState(false);
  const fileInputRef = useRef(null);
  const stanInputRef = useRef(null);
  const cenaInputRef = useRef(null);
  const czasInputRef = useRef(null);

  const tabs = [
    { key: 'gotowe', label: 'Gotowe produkty', icon: '📦', color: '#22C55E', bgLight: 'bg-green-50', textColor: 'text-green-600', borderColor: 'border-green-500' },
    { key: 'polprodukty', label: 'Polprodukty', icon: '🔧', color: '#3B82F6', bgLight: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-500' },
    { key: 'wykroje', label: 'Wykroje', icon: '✂️', color: '#F59E0B', bgLight: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-500' },
    { key: 'surowce', label: 'Surowce', icon: '🧱', color: '#A16207', bgLight: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-600' },
  ];

  const [magazyny, setMagazyny] = useState({
    gotowe: [],
    polprodukty: [],
    wykroje: [],
    surowce: [],
  });

  // Cache zaladowanych kategorii (lazy loading) - uzywamy ref dla stabilnosci funkcji
  const loadedCategoriesRef = useRef(new Set());

  const [newItem, setNewItem] = useState({ sku: '', nazwa: '', ean: '', stan: '', cena: '', czas_produkcji: '', jednostka: 'szt', tkanina: '' });

  // Pobierz dane z API dla konkretnej kategorii (lazy loading)
  const fetchInventory = useCallback(async (kategoria = null, forceRefresh = false) => {
    // Jesli kategoria juz zaladowana i nie wymuszamy odswiezenia, pomin
    if (kategoria && loadedCategoriesRef.current.has(kategoria) && !forceRefresh) {
      return;
    }

    try {
      setLoading(true);
      const url = kategoria ? `/api/inventory?kategoria=${kategoria}` : '/api/inventory';
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        if (kategoria) {
          // Aktualizuj tylko dana kategorie
          setMagazyny(prev => ({
            ...prev,
            [kategoria]: data.data[kategoria] || []
          }));
          loadedCategoriesRef.current.add(kategoria);
        } else {
          // Zaladuj wszystkie kategorie (fallback)
          setMagazyny(data.data);
          loadedCategoriesRef.current = new Set(['gotowe', 'polprodukty', 'wykroje', 'surowce']);
        }
      }
    } catch (error) {
      console.error('Blad pobierania danych:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Zaladuj wszystkie kategorie na starcie (dla podsumowania)
  useEffect(() => {
    fetchInventory(); // bez parametru = wszystkie kategorie
  }, []);

  // Pobierz aktualnego uzytkownika i liste uzytkownikow dla zadan
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

  // Zaladuj zadania WMS na starcie (dla badge)
  useEffect(() => {
    fetchWmsTasks();
  }, []);

  // Funkcja pobierania zadan WMS
  const fetchWmsTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('/api/tasks?threadType=wms');
      const data = await res.json();
      if (data.success) {
        setWmsTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching WMS tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  // Funkcja dodawania zadania
  const handleAddTask = async () => {
    if (!newTaskContent.trim() || !newTaskAssignee) {
      alert('Wypelnij tresc zadania i wybierz osobe');
      return;
    }

    setTaskSending(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdBy: currentUser?.username || 'system',
          assignedTo: newTaskAssignee,
          content: newTaskContent,
          threadId: 'wms-tasks',
          threadType: 'wms'
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskContent('');
        setNewTaskAssignee('');
        fetchWmsTasks();
        alert('Zadanie zostalo dodane!');
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Blad podczas dodawania zadania');
    } finally {
      setTaskSending(false);
    }
  };

  // Funkcja oznaczania zadania jako wykonane
  const handleCompleteTask = async (taskId) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          username: currentUser?.username || 'system'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchWmsTasks();
      }
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  // Funkcja usuwania zadania
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Czy na pewno chcesz usunac to zadanie?')) return;

    try {
      const res = await fetch(`/api/tasks?taskId=${taskId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchWmsTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Zaladuj dane gdy zmienia sie zakladka
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    setCurrentPage(1);
    setSelectedIds(new Set());
    fetchInventory(newTab);
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
        await fetchInventory(activeTab, true);
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
        await fetchInventory(activeTab, true);
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    }
  };

  // Generuj etykiete z kodem SKU (CODE128) - dla polproduktow/wykrojow (100x50mm)
  const handlePrintLabelSKU = (item) => {
    if (!item.sku) {
      alert('Produkt nie ma przypisanego kodu SKU');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
        <style>
          @page {
            size: 100mm 50mm;
            margin: 0 !important;
          }
          @media print {
            @page {
              margin: 0 !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
            }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100mm;
            height: 50mm;
            margin: 0 !important;
            padding: 0 !important;
          }
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3mm;
          }
          .product-name {
            font-size: 9pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2mm;
            max-width: 94mm;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            line-height: 1.2;
          }
          .barcode-container {
            display: flex;
            justify-content: center;
          }
          svg {
            max-width: 90mm;
            height: auto;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="product-name">${item.nazwa || 'Brak nazwy'}</div>
        <div class="barcode-container">
          <svg id="barcode"></svg>
        </div>
        <script>
          try {
            JsBarcode("#barcode", "${item.sku}", {
              format: "CODE128",
              width: 1.5,
              height: 45,
              displayValue: true,
              fontSize: 11,
              margin: 5,
              textMargin: 3
            });
          } catch(e) {
            document.getElementById('barcode').innerHTML = '<text>Błąd generowania kodu</text>';
          }
          setTimeout(() => {
            window.print();
          }, 300);
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generuj etykiete z kodem EAN-13 (100x50mm)
  const handlePrintLabel = (item) => {
    if (!item.ean) {
      alert('Produkt nie ma przypisanego kodu EAN');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
        <style>
          @page {
            size: 100mm 50mm;
            margin: 0 !important;
          }
          @media print {
            @page {
              margin: 0 !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
            }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100mm;
            height: 50mm;
            margin: 0 !important;
            padding: 0 !important;
          }
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3mm;
          }
          .product-name {
            font-size: 10pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2mm;
            max-width: 94mm;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .product-sku {
            font-size: 8pt;
            color: #333;
            margin-bottom: 3mm;
          }
          .barcode-container {
            display: flex;
            justify-content: center;
          }
          svg {
            max-width: 90mm;
            height: auto;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="product-name">${item.nazwa || 'Brak nazwy'}</div>
        <div class="product-sku">SKU: ${item.sku || '-'}</div>
        <div class="barcode-container">
          <svg id="barcode"></svg>
        </div>
        <script>
          try {
            JsBarcode("#barcode", "${item.ean}", {
              format: "EAN13",
              width: 2,
              height: 50,
              displayValue: true,
              fontSize: 12,
              margin: 5
            });
          } catch(e) {
            document.getElementById('barcode').innerHTML = '<text>Błędny kod EAN: ${item.ean}</text>';
          }
          setTimeout(() => {
            window.print();
          }, 300);
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
        await fetchInventory(activeTab, true);
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
        await fetchInventory(activeTab, true);
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

  // Obsluga przyjecia surowcow (dodawanie do stanu)
  const handlePrzyjęcie = (item, value) => {
    const delta = parseFloat(String(value).replace(',', '.')) || 0;
    if (delta <= 0) return;

    const oldStan = Number(parseFloat(item.stan)) || 0;
    const newStan = Math.round((oldStan + delta) * 100) / 100;

    // Wyczysc input
    setPrzyjęcieValues(prev => ({ ...prev, [item.id]: '' }));

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

  // Obsluga rozchodu surowcow (odejmowanie ze stanu)
  const handleRozchód = (item, value) => {
    const delta = parseFloat(String(value).replace(',', '.')) || 0;
    if (delta <= 0) return;

    const oldStan = Number(parseFloat(item.stan)) || 0;
    const newStan = Math.round(Math.max(0, oldStan - delta) * 100) / 100;

    // Wyczysc input
    setRozchódValues(prev => ({ ...prev, [item.id]: '' }));

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

    // Aktualizuj tez recipeItem jesli to ten sam produkt (dla kalkulatora w modalu)
    if (recipeItem && recipeItem.id === item.id) {
      setRecipeItem(prev => ({ ...prev, czas_produkcji: newCzas }));
      setRecipeChanged(true);
    }

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
          // Cofnij tez recipeItem
          if (recipeItem && recipeItem.id === item.id) {
            setRecipeItem(prev => ({ ...prev, czas_produkcji: oldCzas }));
          }
        }
      })
      .catch(() => {
        setMagazyny(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(i =>
            i.id === item.id ? { ...i, czas_produkcji: oldCzas } : i
          )
        }));
        // Cofnij tez recipeItem
        if (recipeItem && recipeItem.id === item.id) {
          setRecipeItem(prev => ({ ...prev, czas_produkcji: oldCzas }));
        }
      });
  };

  // Receptura - otworz modal
  const handleOpenRecipe = async (item) => {
    setRecipeItem(item);
    setShowRecipeModal(true);
    setLoadingRecipe(true);
    setRecipeChanged(false); // Reset flagi zmian

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

  // Ostrzezenie - otworz modal
  const handleOpenColorModal = (item) => {
    setColorItem(item);
    setColorYellow(item.yellow_threshold != null ? String(item.yellow_threshold) : '');
    setColorRed(item.red_threshold != null ? String(item.red_threshold) : '');
    setShowColorModal(true);
  };

  // Ostrzezenie - zapisz progi
  const handleSaveColorThresholds = async () => {
    if (!colorItem) return;

    setSavingColor(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: colorItem.id,
          yellow_threshold: colorYellow === '' ? null : parseInt(colorYellow),
          red_threshold: colorRed === '' ? null : parseInt(colorRed)
        })
      });

      const data = await res.json();
      if (data.success) {
        // Aktualizuj lokalny stan
        setMagazyny(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(i =>
            i.id === colorItem.id
              ? { ...i, yellow_threshold: colorYellow === '' ? null : parseInt(colorYellow), red_threshold: colorRed === '' ? null : parseInt(colorRed) }
              : i
          )
        }));
        setShowColorModal(false);
        setColorItem(null);
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    } finally {
      setSavingColor(false);
    }
  };

  // Masowe ustawienie ostrzezenia
  const handleBulkWarning = async () => {
    if (selectedIds.size === 0) return;

    setSavingBulkWarning(true);
    try {
      const idsArray = Array.from(selectedIds);
      const res = await fetch('/api/inventory/bulk-warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: idsArray,
          yellow_threshold: bulkYellow === '' ? null : parseInt(bulkYellow),
          red_threshold: bulkRed === '' ? null : parseInt(bulkRed)
        })
      });

      const data = await res.json();
      if (data.success) {
        const yellowVal = bulkYellow === '' ? null : parseInt(bulkYellow);
        const redVal = bulkRed === '' ? null : parseInt(bulkRed);
        setMagazyny(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(i =>
            selectedIds.has(i.id)
              ? { ...i, yellow_threshold: yellowVal, red_threshold: redVal }
              : i
          )
        }));
        setShowBulkWarningModal(false);
        setBulkYellow('');
        setBulkRed('');
        setSelectedIds(new Set());
        alert(`Zaktualizowano progi dla ${data.updated} pozycji`);
      } else {
        alert('Blad: ' + data.error);
      }
    } catch (error) {
      alert('Blad: ' + error.message);
    } finally {
      setSavingBulkWarning(false);
    }
  };

  // Funkcje do obslugi dokumentow WZ/RW
  const handleProductSearch = (searchText, index, docType) => {
    setActiveSuggestionIndex(index);
    const surowce = magazyny.surowce || [];
    if (searchText.length >= 2) {
      const filtered = surowce.filter(item =>
        item.nazwa.toLowerCase().includes(searchText.toLowerCase())
      ).slice(0, 10);
      setProductSuggestions(filtered);
    } else {
      setProductSuggestions([]);
    }
  };

  const handleSelectProduct = (product, index, docType) => {
    if (docType === 'wz') {
      const newPozycje = [...wzDocument.pozycje];
      newPozycje[index] = {
        ...newPozycje[index],
        produktId: product.id,
        nazwa: product.nazwa,
        jednostka: product.jednostka || 'szt'
      };
      setWzDocument({ ...wzDocument, pozycje: newPozycje });
    } else {
      const newPozycje = [...rwDocument.pozycje];
      newPozycje[index] = {
        ...newPozycje[index],
        produktId: product.id,
        nazwa: product.nazwa,
        jednostka: product.jednostka || 'szt'
      };
      setRwDocument({ ...rwDocument, pozycje: newPozycje });
    }
    setProductSuggestions([]);
    setActiveSuggestionIndex(null);
  };

  const addDocumentRow = (docType) => {
    if (docType === 'wz') {
      setWzDocument({
        ...wzDocument,
        pozycje: [...wzDocument.pozycje, { produktId: null, nazwa: '', ilosc: '', jednostka: 'szt' }]
      });
    } else {
      setRwDocument({
        ...rwDocument,
        pozycje: [...rwDocument.pozycje, { produktId: null, nazwa: '', ilosc: '', jednostka: 'szt' }]
      });
    }
  };

  const removeDocumentRow = (index, docType) => {
    if (docType === 'wz') {
      if (wzDocument.pozycje.length <= 1) return;
      const newPozycje = wzDocument.pozycje.filter((_, i) => i !== index);
      setWzDocument({ ...wzDocument, pozycje: newPozycje });
    } else {
      if (rwDocument.pozycje.length <= 1) return;
      const newPozycje = rwDocument.pozycje.filter((_, i) => i !== index);
      setRwDocument({ ...rwDocument, pozycje: newPozycje });
    }
  };

  const handleSubmitWZ = async () => {
    if (!wzDocument.numer || !wzDocument.firma) {
      alert('Wypelnij numer dokumentu i firme');
      return;
    }

    const validPozycje = wzDocument.pozycje.filter(p => p.produktId && p.ilosc);
    if (validPozycje.length === 0) {
      alert('Dodaj przynajmniej jedna pozycje z produktem i iloscia');
      return;
    }

    setSavingDocument(true);
    try {
      // Sumuj ilosci per produkt, potem dodaj raz (WZ = przyjecie)
      const deltaMap = {};
      for (const pozycja of validPozycje) {
        const id = pozycja.produktId;
        const delta = parseFloat(String(pozycja.ilosc).replace(',', '.'));
        deltaMap[id] = (deltaMap[id] || 0) + delta;
      }
      for (const [id, delta] of Object.entries(deltaMap)) {
        const item = magazyny.surowce.find(s => s.id === parseInt(id));
        if (item) {
          const newStan = Math.round((parseFloat(item.stan) + delta) * 100) / 100;
          await fetch('/api/inventory', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: parseInt(id), stan: newStan })
          });
        }
      }

      // Zapisz dokument WZ do warehouse_documents
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typ: 'WZ',
          numer: wzDocument.numer,
          firma: wzDocument.firma,
          pozycje: validPozycje
        })
      });

      // Zapisz dokument do DMS (generated_documents)
      await fetch('/api/dms/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: 'WZ',
          docNumber: wzDocument.numer,
          orderId: null,
          customerName: wzDocument.firma,
          data: {
            typ: 'Przyjecie zewnetrzne',
            firma: wzDocument.firma,
            pozycje: validPozycje.map(p => ({
              produktId: p.produktId,
              nazwa: p.nazwa,
              ilosc: parseFloat(String(p.ilosc).replace(',', '.')),
              jednostka: p.jednostka
            })),
            dataWystawienia: new Date().toISOString()
          },
          status: 'completed',
          invoiceStatus: 'niezafakturowany'
        })
      });

      await fetchInventory('surowce', true);
      setWzDocument({
        numer: '',
        firma: '',
        pozycje: [{ produktId: null, nazwa: '', ilosc: '', jednostka: 'szt' }]
      });
      setSurowceSubTab('lista');
      alert('Dokument WZ zostal zapisany, stany magazynowe zaktualizowane');
    } catch (error) {
      alert('Blad: ' + error.message);
    } finally {
      setSavingDocument(false);
    }
  };

  const handleSubmitRW = async () => {
    if (!rwDocument.numer) {
      alert('Wypelnij numer dokumentu');
      return;
    }

    const validPozycje = rwDocument.pozycje.filter(p => p.produktId && p.ilosc);
    if (validPozycje.length === 0) {
      alert('Dodaj przynajmniej jedna pozycje z produktem i iloscia');
      return;
    }

    // Sprawdz czy starczy stanow (sumuj wszystkie pozycje per produkt)
    const checkMap = {};
    for (const pozycja of validPozycje) {
      const id = pozycja.produktId;
      const delta = parseFloat(String(pozycja.ilosc).replace(',', '.'));
      checkMap[id] = (checkMap[id] || 0) + delta;
    }
    for (const [id, totalDelta] of Object.entries(checkMap)) {
      const item = magazyny.surowce.find(s => s.id === parseInt(id));
      if (item && parseFloat(item.stan) < totalDelta) {
        alert(`Niewystarczajacy stan dla "${item.nazwa}". Dostepne: ${item.stan}, wymagane: ${totalDelta}`);
        return;
      }
    }

    setSavingDocument(true);
    try {
      // Sumuj ilosci per produkt, potem odejmij raz (RW = rozchod)
      const deltaMap = {};
      for (const pozycja of validPozycje) {
        const id = pozycja.produktId;
        const delta = parseFloat(String(pozycja.ilosc).replace(',', '.'));
        deltaMap[id] = (deltaMap[id] || 0) + delta;
      }
      for (const [id, delta] of Object.entries(deltaMap)) {
        const item = magazyny.surowce.find(s => s.id === parseInt(id));
        if (item) {
          const newStan = Math.round(Math.max(0, parseFloat(item.stan) - delta) * 100) / 100;
          await fetch('/api/inventory', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: parseInt(id), stan: newStan })
          });
        }
      }

      // Zapisz dokument RW do warehouse_documents
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typ: 'RW',
          numer: rwDocument.numer,
          firma: rwDocument.firma,
          pozycje: validPozycje
        })
      });

      // Zapisz dokument do DMS (generated_documents)
      await fetch('/api/dms/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: 'RW',
          docNumber: rwDocument.numer,
          orderId: null,
          customerName: rwDocument.firma,
          data: {
            typ: 'Rozchod wewnetrzny',
            firma: rwDocument.firma,
            pozycje: validPozycje.map(p => ({
              produktId: p.produktId,
              nazwa: p.nazwa,
              ilosc: parseFloat(String(p.ilosc).replace(',', '.')),
              jednostka: p.jednostka
            })),
            dataWystawienia: new Date().toISOString()
          },
          status: 'completed'
        })
      });

      await fetchInventory('surowce', true);
      setRwDocument({
        numer: '',
        firma: 'POOM',
        pozycje: [{ produktId: null, nazwa: '', ilosc: '', jednostka: 'szt' }]
      });
      setSurowceSubTab('lista');
      alert('Dokument RW zostal zapisany, stany magazynowe zaktualizowane');
    } catch (error) {
      alert('Blad: ' + error.message);
    } finally {
      setSavingDocument(false);
    }
  };

  // Funkcja do okreslenia koloru stanu na podstawie progow
  const getStanColor = (item) => {
    const stan = parseFloat(item.stan) || 0;
    const redThreshold = item.red_threshold;
    const yellowThreshold = item.yellow_threshold;

    // Jesli progi sa ustawione, uzyj ich
    if (redThreshold != null && stan < redThreshold) {
      return 'bg-red-100 text-red-800';
    }
    if (yellowThreshold != null && stan < yellowThreshold) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (redThreshold != null || yellowThreshold != null) {
      // Jesli progi sa ustawione i stan jest powyzej obu, zielony
      return 'bg-green-100 text-green-800';
    }

    // Domyslne progi jesli nie ustawiono
    if (stan <= 10) return 'bg-red-100 text-red-800';
    if (stan <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Funkcja do obliczenia poziomu ostrzezenia (do sortowania)
  const getWarningLevel = (item) => {
    const stan = parseFloat(item.stan) || 0;
    const redThreshold = item.red_threshold;
    const yellowThreshold = item.yellow_threshold;

    if (redThreshold != null && stan < redThreshold) return 0; // Krytyczny
    if (yellowThreshold != null && stan < yellowThreshold) return 1; // Ostrzezenie
    if (redThreshold != null || yellowThreshold != null) return 2; // OK

    // Domyslne progi
    if (stan <= 10) return 0;
    if (stan <= 30) return 1;
    return 2;
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
        setRecipeChanged(true); // Oznacz ze byly zmiany
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
        setRecipeChanged(true); // Oznacz ze byly zmiany
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

      setRecipeChanged(true); // Oznacz ze byly zmiany
      setRecipeIngredients(prev =>
        prev.map(i => i.id === recipeId ? { ...i, quantity: newQty } : i)
      );
    } catch (error) {
      console.error('Blad aktualizacji ilosci:', error);
    }
  };

  // Pobierz historie zmian
  const fetchHistory = useCallback(async (page = 1, username = '', actionType = '', dateFrom = '', dateTo = '', perPage = 200) => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams({ page, perPage });
      if (username) params.append('username', username);
      if (actionType) params.append('actionType', actionType);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const res = await fetch(`/api/inventory/history?${params}`);
      const data = await res.json();

      if (data.success) {
        setHistoryData(data.history || []);
        setHistoryTotal(data.total || 0);
        setHistoryUsers(data.users || []);
        setHistoryPage(page);
      }
    } catch (error) {
      console.error('Blad pobierania historii:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    fetchHistory(1, '', '', '', '', historyPerPage);
  };

  const handleExportHistoryCSV = async () => {
    try {
      const params = new URLSearchParams({ page: 1, perPage: 10000 });
      if (historyFilterUser) params.append('username', historyFilterUser);
      if (historyFilterAction) params.append('actionType', historyFilterAction);
      if (historyFilterDateFrom) params.append('dateFrom', historyFilterDateFrom);
      if (historyFilterDateTo) params.append('dateTo', historyFilterDateTo);

      const res = await fetch(`/api/inventory/history?${params}`);
      const data = await res.json();
      if (!data.success || !data.history?.length) {
        alert('Brak danych do eksportu');
        return;
      }

      const headers = ['Data', 'Uzytkownik', 'Akcja', 'SKU', 'Nazwa', 'Kategoria', 'Pole', 'Stara wartosc', 'Nowa wartosc'];
      const actionLabels = {
        'STAN_CHANGE': 'Zmiana stanu', 'PRICE_CHANGE': 'Zmiana ceny',
        'PRODUCT_ADD': 'Dodanie', 'PRODUCT_MODIFY': 'Modyfikacja', 'PRODUCT_DELETE': 'Usuniecie'
      };
      const rows = [headers.join(';')];
      data.history.forEach(e => {
        rows.push([
          new Date(e.created_at).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          e.username || '',
          actionLabels[e.action_type] || e.action_type,
          e.sku || '',
          (e.nazwa || '').replace(/;/g, ','),
          e.kategoria || '',
          e.field_changed || '',
          e.old_value || '',
          e.new_value || ''
        ].join(';'));
      });

      const csvContent = '\uFEFF' + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `historia_zmian_${historyFilterUser || 'wszystko'}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Blad eksportu historii:', err);
      alert('Blad eksportu: ' + err.message);
    }
  };

  // Eksport do CSV - tylko aktualny magazyn (lub przekazane items)
  const handleExportCSV = (customItems) => {
    const items = customItems || magazyny[activeTab] || [];

    if (items.length === 0) {
      alert('Brak danych do eksportu w magazynie: ' + getTabLabel(activeTab));
      return;
    }

    // Rozne kolumny dla gotowych produktow vs reszty
    let headers, csvRows;

    // Helper: formatuj kwote z przecinkiem (polski format) aby Excel nie interpretowal jako daty
    const fmtPrice = (val) => (val || 0).toFixed(2).replace('.', ',');

    if (activeTab === 'gotowe') {
      headers = ['Nazwa', 'SKU', 'EAN', 'Stan', 'Wart. jedn. netto PLN', 'Wart. Suma Netto PLN', 'Czas produkcji (min)'];
      csvRows = [
        headers.join(';'),
        ...items.map(item => {
          const cena = item.cena || 0;
          const stan = item.stan || 0;
          return [item.nazwa, item.sku, item.ean || '', stan, fmtPrice(cena), fmtPrice(cena * stan), item.czas_produkcji || 0].join(';');
        })
      ];
    } else if (activeTab === 'surowce') {
      headers = ['Nazwa', 'SKU (opcjonalne)', 'Stan', 'Jednostka', 'Wart. jedn. netto PLN', 'Wart. Suma Netto PLN'];
      csvRows = [
        headers.join(';'),
        ...items.map(item => {
          const cena = item.cena || 0;
          const stan = item.stan || 0;
          return [item.nazwa, item.sku, stan, item.jednostka || 'szt', fmtPrice(cena), fmtPrice(cena * stan)].join(';');
        })
      ];
    } else {
      // polprodukty, wykroje - bez EAN
      headers = ['Nazwa', 'SKU (opcjonalne)', 'Tkanina', 'Stan', 'Wart. jedn. netto PLN', 'Wart. Suma Netto PLN'];
      csvRows = [
        headers.join(';'),
        ...items.map(item => {
          const cena = item.cena || 0;
          const stan = item.stan || 0;
          return [item.nazwa, item.sku, item.tkanina || '', stan, fmtPrice(cena), fmtPrice(cena * stan)].join(';');
        })
      ];
    }

    const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM dla polskich znakow
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `magazyn_${activeTab}${customItems ? '_zaznaczone' : ''}_${new Date().toISOString().slice(0, 10)}.csv`);
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
        const existingItems = magazyny[activeTab] || [];
        const existingNames = new Set(
          existingItems.map(item => item.nazwa.toLowerCase().trim())
        );
        // Mapa nazwa -> SKU dla trybu aktualizacji
        const existingNameToSku = new Map(
          existingItems.map(item => [item.nazwa.toLowerCase().trim(), item.sku])
        );
        // Mapa SKU -> item dla trybu aktualizacji (dopasowanie po SKU)
        const existingSkuToItem = new Map(
          existingItems.map(item => [item.sku?.toLowerCase().trim(), item])
        );
        // Nazwy dodane w tym imporcie (zeby wykryc duplikaty w pliku)
        const importedNames = new Set();
        // Ilosc pozycji do aktualizacji (dla informacji)
        let toUpdateCount = 0;

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
            const nazwaLower = nazwa?.toLowerCase().trim();
            const skuLower = sku?.toLowerCase().trim();

            // Tryb aktualizacji - znajdz istniejacy SKU po nazwie lub SKU z CSV
            if (importUpdateMode) {
              // Najpierw sprawdz czy SKU z CSV pasuje do istniejacego
              if (skuLower && existingSkuToItem.has(skuLower)) {
                finalSku = existingSkuToItem.get(skuLower).sku; // Uzyj dokladnego SKU z bazy
                toUpdateCount++;
              }
              // Jesli nie ma SKU lub nie pasuje, sprawdz po nazwie
              else if (nazwaLower && existingNameToSku.has(nazwaLower)) {
                finalSku = existingNameToSku.get(nazwaLower); // Uzyj istniejacego SKU
                toUpdateCount++;
              }
              // Jesli nie istnieje - generuj nowe SKU jesli brak
              else if (!finalSku) {
                if (activeTab === 'wykroje') finalSku = `WYK-${Date.now()}-${i}`;
                else if (activeTab === 'polprodukty') finalSku = `PP-${Date.now()}-${i}`;
                else if (activeTab === 'surowce') finalSku = `SUR-${Date.now()}-${i}`;
                else finalSku = null;
              }

              // Sprawdz duplikaty tylko w pliku CSV (nie w magazynie, bo aktualizujemy)
              if (nazwaLower && importedNames.has(nazwaLower)) {
                skippedDuplicates.push(`"${nazwa}" - duplikat w pliku CSV`);
                continue;
              }
            } else {
              // Tryb normalny - pomijaj duplikaty
              if (!finalSku) {
                if (activeTab === 'wykroje') finalSku = `WYK-${Date.now()}-${i}`;
                else if (activeTab === 'polprodukty') finalSku = `PP-${Date.now()}-${i}`;
                else if (activeTab === 'surowce') finalSku = `SUR-${Date.now()}-${i}`;
                else finalSku = null;
              }

              // Sprawdz duplikaty nazw
              if (nazwaLower && existingNames.has(nazwaLower)) {
                skippedDuplicates.push(`"${nazwa}" - juz istnieje w magazynie`);
                continue;
              }
              if (nazwaLower && importedNames.has(nazwaLower)) {
                skippedDuplicates.push(`"${nazwa}" - duplikat w pliku CSV`);
                continue;
              }
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
            await fetchInventory(activeTab, true);
            let message = '';

            // Buduj komunikat z podzialem na nowe i zaktualizowane
            if (data.updated > 0 && data.imported > 0) {
              message = `Dodano ${data.imported} nowych pozycji, zaktualizowano ${data.updated} istniejacych (z ${data.total} w pliku)`;
            } else if (data.updated > 0) {
              message = `Zaktualizowano ${data.updated} pozycji (z ${data.total} w pliku)`;
            } else {
              message = `Zaimportowano ${data.imported} z ${data.total} pozycji`;
            }

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
    setImportUpdateMode(false);
  };

  const getTabLabel = (key) => {
    return tabs.find(t => t.key === key)?.label || key;
  };

  // Opcje sortowania
  const sortOptions = [
    { value: 'ostrzezenie-asc', label: 'Ostrzezenie (krytyczne pierwsze)' },
    { value: 'ostrzezenie-desc', label: 'Ostrzezenie (OK pierwsze)' },
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
        case 'ostrzezenie':
          comparison = getWarningLevel(a) - getWarningLevel(b);
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">WMS - Warehouse Management System</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Zarzadzanie stanami magazynowymi i zapasami</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleOpenHistory}
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Historia zmian
            </button>
            <button
              onClick={() => { setShowTasksModal(true); fetchWmsTasks(); }}
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1"
            >
              Zadania
              {wmsTasks.filter(t => t.status === 'pending' && t.assigned_to === currentUser?.username).length > 0 && (
                <span className="bg-white text-orange-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {wmsTasks.filter(t => t.status === 'pending' && t.assigned_to === currentUser?.username).length}
                </span>
              )}
            </button>
            <Link
              href="/magazyny/bol"
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              BOM
            </Link>
            <button
              onClick={() => handleExportCSV()}
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
              <div key={tab.key} className={`bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-3 lg:p-4 border-l-4 ${tab.borderColor}`}>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tab.icon} {tab.label}</p>
                <p className={`text-xl lg:text-2xl font-bold ${tab.textColor}`}>{items.length}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-1 mb-1">pozycji w magazynie</p>
                <div className="flex flex-col gap-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-500">{totalStan.toFixed(2)} szt.</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">stan magazynu</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${tab.textColor}`}>{totalValue.toFixed(2)} zl</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">wartosc</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 mb-4">
          <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors whitespace-nowrap px-4 ${
                  activeTab === tab.key
                    ? `${tab.textColor} border-b-2 ${tab.borderColor} ${tab.bgLight}`
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sub-zakładki dla Surowce - WZ, RW, Lista */}
        {activeTab === 'surowce' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 mb-4">
            <div className="flex border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setSurowceSubTab('wz')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  surowceSubTab === 'wz'
                    ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>📥</span>
                <span>Dokument WZ</span>
              </button>
              <button
                onClick={() => setSurowceSubTab('rw')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  surowceSubTab === 'rw'
                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>📤</span>
                <span>Dokument RW</span>
              </button>
              <button
                onClick={() => setSurowceSubTab('lista')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  surowceSubTab === 'lista'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>📋</span>
                <span>Lista surowców</span>
              </button>
            </div>
          </div>
        )}

        {/* Panel WZ - Przyjęcie towaru */}
        {activeTab === 'surowce' && surowceSubTab === 'wz' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-green-600">📥</span>
              Dokument WZ - Przyjęcie zewnętrzne
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Wypełnij dokument WZ, aby przyjąć towar od zewnętrznego dostawcy. Ilości zostaną DODANE do stanów magazynowych.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numer dokumentu *</label>
                <input
                  type="text"
                  value={wzDocument.numer}
                  onChange={(e) => setWzDocument({ ...wzDocument, numer: e.target.value })}
                  placeholder="np. WZ/2025/001"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Firma (dostawca) *</label>
                <input
                  type="text"
                  value={wzDocument.firma}
                  onChange={(e) => setWzDocument({ ...wzDocument, firma: e.target.value })}
                  placeholder="np. Dostawca ABC Sp. z o.o."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pozycje dokumentu</label>
              <div className="space-y-3">
                {wzDocument.pozycje.map((pozycja, index) => (
                  <div key={index} className="flex flex-wrap gap-2 items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1 min-w-[200px] relative">
                      <input
                        type="text"
                        value={pozycja.nazwa}
                        onChange={(e) => {
                          const newPozycje = [...wzDocument.pozycje];
                          newPozycje[index].nazwa = e.target.value;
                          newPozycje[index].produktId = null;
                          setWzDocument({ ...wzDocument, pozycje: newPozycje });
                          handleProductSearch(e.target.value, index, 'wz');
                        }}
                        placeholder="Wpisz nazwe surowca..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      {activeSuggestionIndex === index && productSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {productSuggestions.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => handleSelectProduct(product, index, 'wz')}
                              className="w-full px-3 py-2 text-left hover:bg-green-50 dark:hover:bg-green-900/30 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            >
                              <span className="font-medium">{product.nazwa}</span>
                              <span className="text-gray-400 ml-2">({product.stan} {product.jednostka || 'szt'})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-24">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={pozycja.ilosc}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, '');
                          const newPozycje = [...wzDocument.pozycje];
                          newPozycje[index].ilosc = val;
                          setWzDocument({ ...wzDocument, pozycje: newPozycje });
                        }}
                        placeholder="Ilość"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="w-20">
                      <select
                        value={pozycja.jednostka}
                        onChange={(e) => {
                          const newPozycje = [...wzDocument.pozycje];
                          newPozycje[index].jednostka = e.target.value;
                          setWzDocument({ ...wzDocument, pozycje: newPozycje });
                        }}
                        className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="szt">szt</option>
                        <option value="m">m</option>
                        <option value="mb">mb</option>
                        <option value="m2">m2</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeDocumentRow(index, 'wz')}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                      title="Usuń pozycję"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addDocumentRow('wz')}
                className="mt-3 px-4 py-2 text-sm text-green-600 dark:text-green-400 border border-green-300 dark:border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30"
              >
                + Dodaj pozycję
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setSurowceSubTab('lista');
                  setWzDocument({
                    numer: '',
                    firma: '',
                    pozycje: [{ produktId: null, nazwa: '', ilosc: '', jednostka: 'szt' }]
                  });
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Anuluj
              </button>
              <button
                onClick={handleSubmitWZ}
                disabled={savingDocument}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {savingDocument ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    Przyjmij towar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Panel RW - Rozchód wewnętrzny */}
        {activeTab === 'surowce' && surowceSubTab === 'rw' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-red-600">📤</span>
              Dokument RW - Rozchód wewnętrzny
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Wypełnij dokument RW, aby wydać surowce z magazynu. Ilości zostaną ODJĘTE od stanów magazynowych.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numer dokumentu *</label>
                <input
                  type="text"
                  value={rwDocument.numer}
                  onChange={(e) => setRwDocument({ ...rwDocument, numer: e.target.value })}
                  placeholder="np. RW/2025/001"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Firma</label>
                <input
                  type="text"
                  value={rwDocument.firma}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Automatycznie ustawiona na POOM</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pozycje dokumentu</label>
              <div className="space-y-3">
                {rwDocument.pozycje.map((pozycja, index) => (
                  <div key={index} className="flex flex-wrap gap-2 items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1 min-w-[200px] relative">
                      <input
                        type="text"
                        value={pozycja.nazwa}
                        onChange={(e) => {
                          const newPozycje = [...rwDocument.pozycje];
                          newPozycje[index].nazwa = e.target.value;
                          newPozycje[index].produktId = null;
                          setRwDocument({ ...rwDocument, pozycje: newPozycje });
                          handleProductSearch(e.target.value, index, 'rw');
                        }}
                        placeholder="Wpisz nazwe surowca..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      {activeSuggestionIndex === index && productSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {productSuggestions.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => handleSelectProduct(product, index, 'rw')}
                              className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/30 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            >
                              <span className="font-medium">{product.nazwa}</span>
                              <span className="text-gray-400 ml-2">({product.stan} {product.jednostka || 'szt'})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-24">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={pozycja.ilosc}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, '');
                          const newPozycje = [...rwDocument.pozycje];
                          newPozycje[index].ilosc = val;
                          setRwDocument({ ...rwDocument, pozycje: newPozycje });
                        }}
                        placeholder="Ilość"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="w-20">
                      <select
                        value={pozycja.jednostka}
                        onChange={(e) => {
                          const newPozycje = [...rwDocument.pozycje];
                          newPozycje[index].jednostka = e.target.value;
                          setRwDocument({ ...rwDocument, pozycje: newPozycje });
                        }}
                        className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="szt">szt</option>
                        <option value="m">m</option>
                        <option value="mb">mb</option>
                        <option value="m2">m2</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeDocumentRow(index, 'rw')}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                      title="Usuń pozycję"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addDocumentRow('rw')}
                className="mt-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                + Dodaj pozycję
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setSurowceSubTab('lista');
                  setRwDocument({
                    numer: '',
                    firma: 'POOM',
                    pozycje: [{ produktId: null, nazwa: '', ilosc: '', jednostka: 'szt' }]
                  });
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Anuluj
              </button>
              <button
                onClick={handleSubmitRW}
                disabled={savingDocument}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {savingDocument ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    Wydaj towar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Content - Lista surowców */}
        {(activeTab !== 'surowce' || surowceSubTab === 'lista') && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{getTabLabel(activeTab)}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Laczny stan: {totalItems.toFixed(2)} szt.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Sortuj:</label>
                <select
                  value={`${sortBy}-${sortDirection}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Wskaznik przewijania na mobile */}
          <div className="lg:hidden flex items-center justify-end gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <span>Przesun w prawo</span>
            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>

          {loading ? (
            <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              Ladowanie danych...
            </div>
          ) : (
            <div className="relative">
              {/* Bulk action toolbar */}
              {selectedIds.size > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
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
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Wyczysc zaznaczenie
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === 'surowce' && (
                      <button
                        onClick={() => {
                          setBulkYellow('');
                          setBulkRed('');
                          setShowBulkWarningModal(true);
                        }}
                        className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
                      >
                        <span>⚠️</span>
                        <span>Ustaw ostrzezenie ({selectedIds.size})</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const allItems = magazyny[activeTab] || [];
                        const selected = allItems.filter(i => selectedIds.has(i.id));
                        handleExportCSV(selected);
                      }}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                    >
                      <span>📥</span>
                      <span>Eksport CSV ({selectedIds.size})</span>
                    </button>
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
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-2 py-3 text-center w-[40px] min-w-[40px] max-w-[40px] sticky left-0 bg-gray-50 dark:bg-gray-700 z-20">
                      <input
                        type="checkbox"
                        checked={currentItems.length > 0 && currentItems.every(item => selectedIds.has(item.id))}
                        onChange={toggleSelectPage}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        title="Zaznacz strone"
                      />
                    </th>
                    <th className="px-2 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-[80px] sm:w-auto sm:min-w-[150px] sticky left-[39px] bg-gray-50 dark:bg-gray-700 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nazwa produktu</th>
                    <th className="px-2 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32 sm:w-40">SKU</th>
                    {(activeTab === 'wykroje' || activeTab === 'polprodukty') && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-40">Tkanina</th>
                    )}
                    {activeTab === 'gotowe' && (
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">EAN-13</th>
                    )}
                    {activeTab !== 'surowce' && (
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">Receptura</th>
                    )}
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">Stan</th>
                    {activeTab === 'surowce' && (
                      <>
                        <th className="px-2 py-3 text-center text-xs font-medium text-green-600 uppercase w-24">Przyjęcie</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-red-600 uppercase w-24">Rozchód</th>
                      </>
                    )}
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">
                      {activeTab === 'gotowe' ? 'Cena' : 'Wart. Jedn. Netto'}
                    </th>
                    {activeTab !== 'gotowe' && (
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-28">Wart. Suma Netto</th>
                    )}
                    {activeTab === 'gotowe' && (
                      <>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">Koszt wytw.</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">Net profit</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20">Czas</th>
                      </>
                    )}
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'gotowe' ? 11 : (activeTab === 'wykroje' || activeTab === 'polprodukty') ? 9 : activeTab === 'surowce' ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                        {searchQuery
                          ? 'Brak wynikow dla wyszukiwania'
                          : 'Brak pozycji w magazynie. Dodaj recznie lub zaimportuj z CSV.'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item) => (
                      <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedIds.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                        <td className={`px-2 py-2 text-center w-[40px] min-w-[40px] max-w-[40px] sticky left-0 z-10 ${selectedIds.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-white dark:bg-gray-800'}`}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelectItem(item.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className={`px-2 py-2 text-[7px] sm:text-sm text-gray-700 dark:text-gray-300 w-[80px] max-w-[80px] sm:w-auto sm:min-w-[150px] sm:max-w-none break-words sticky left-[39px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${selectedIds.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-white dark:bg-gray-800'}`} title={item.nazwa}>{item.nazwa}</td>
                        <td className="px-2 py-2 w-32 sm:w-40 min-w-[128px] sm:min-w-[160px]">
                          <span className="font-mono text-[10px] sm:text-xs text-gray-900 dark:text-white whitespace-nowrap">{item.sku}</span>
                        </td>
                        {(activeTab === 'wykroje' || activeTab === 'polprodukty') && (
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{item.tkanina || '-'}</td>
                        )}
                        {activeTab === 'gotowe' && (
                          <td className="px-2 py-2 text-center">
                            <span className="font-mono text-xs text-gray-500">{item.ean || '-'}</span>
                          </td>
                        )}
                        {activeTab !== 'surowce' && (
                          <td className="px-2 py-2 text-center">
                            {item.receptura && item.receptura.count > 0 ? (
                              <div className="relative group flex items-center justify-center gap-1">
                                {item.receptura.ingredients.map((ing, idx) => {
                                  const colors = ['bg-blue-500', 'bg-yellow-400', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-pink-400', 'bg-orange-400', 'bg-teal-400'];
                                  return (
                                    <span
                                      key={idx}
                                      className={`inline-block w-3.5 h-3.5 rounded-full ${colors[idx % colors.length]}`}
                                    />
                                  );
                                })}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 pointer-events-none" style={{transitionDelay:'0ms'}}>
                                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                    {item.receptura.ingredients.map((ing, idx) => {
                                      const dotColors = ['text-blue-400', 'text-yellow-400', 'text-green-400', 'text-purple-400', 'text-red-400', 'text-pink-400', 'text-orange-400', 'text-teal-400'];
                                      return (
                                        <div key={idx} className="flex items-center gap-1.5">
                                          <span className={dotColors[idx % dotColors.length]}>{'●'}</span>
                                          <span>{ing.ingredient_nazwa || ing.nazwa}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1"></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
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
                                className={`px-3 py-1 rounded text-sm font-bold min-w-[50px] text-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all whitespace-nowrap ${getStanColor(item)}`}
                                title={item.yellow_threshold != null || item.red_threshold != null ? `Progi: czerwony < ${item.red_threshold ?? '-'}, żółty < ${item.yellow_threshold ?? '-'}` : 'Kliknij aby edytowac'}
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
                        {activeTab === 'surowce' && (
                          <>
                            {/* Przyjęcie - dodawanie do stanu */}
                            <td className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={przyjęcieValues[item.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                                    setPrzyjęcieValues(prev => ({ ...prev, [item.id]: val }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handlePrzyjęcie(item, przyjęcieValues[item.id]);
                                    }
                                  }}
                                  placeholder="0"
                                  className="w-16 px-2 py-1 text-center text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50"
                                />
                                <button
                                  onClick={() => handlePrzyjęcie(item, przyjęcieValues[item.id])}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 font-medium"
                                  title="Dodaj do stanu"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            {/* Rozchód - odejmowanie ze stanu */}
                            <td className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={rozchódValues[item.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                                    setRozchódValues(prev => ({ ...prev, [item.id]: val }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRozchód(item, rozchódValues[item.id]);
                                    }
                                  }}
                                  placeholder="0"
                                  className="w-16 px-2 py-1 text-center text-sm border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                                />
                                <button
                                  onClick={() => handleRozchód(item, rozchódValues[item.id])}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 font-medium"
                                  title="Odejmij ze stanu"
                                >
                                  -
                                </button>
                              </div>
                            </td>
                          </>
                        )}
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
                            {activeTab === 'gotowe' && item.ean && (
                              <button
                                onClick={() => handlePrintLabel(item)}
                                className="text-green-600 hover:text-green-800 text-xs font-medium px-1.5 py-0.5 bg-green-50 rounded hover:bg-green-100"
                                title="Drukuj etykiete z kodem EAN"
                              >
                                Etykieta
                              </button>
                            )}
                            {(activeTab === 'polprodukty' || activeTab === 'wykroje') && item.sku && (
                              <button
                                onClick={() => handlePrintLabelSKU(item)}
                                className="text-green-600 hover:text-green-800 text-xs font-medium px-1.5 py-0.5 bg-green-50 rounded hover:bg-green-100"
                                title="Drukuj etykiete z kodem SKU"
                              >
                                Etykieta
                              </button>
                            )}
                            {activeTab === 'surowce' && (
                              <button
                                onClick={() => handleOpenColorModal(item)}
                                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                  item.yellow_threshold != null || item.red_threshold != null
                                    ? 'text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100'
                                    : 'text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100'
                                }`}
                                title={item.yellow_threshold != null || item.red_threshold != null ? `Progi ustawione: żółty < ${item.yellow_threshold ?? '-'}, czerwony < ${item.red_threshold ?? '-'}` : 'Ustaw progi kolorów'}
                              >
                                Ostrzezenie
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
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Poprzednia
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Nastepna
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dodaj pozycje do: {getTabLabel(activeTab)}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SKU {(activeTab === 'wykroje' || activeTab === 'polprodukty' || activeTab === 'surowce') && <span className="text-gray-400 font-normal">(opcjonalne)</span>}
                  </label>
                  <input
                    type="text"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={activeTab === 'wykroje' ? 'np. WYK-001 (generowane automatycznie)' : activeTab === 'polprodukty' ? 'np. PP-001 (generowane automatycznie)' : activeTab === 'surowce' ? 'np. SUR-001 (generowane automatycznie)' : 'np. MIKI-001'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nazwa produktu</label>
                  <input
                    type="text"
                    value={newItem.nazwa}
                    onChange={(e) => setNewItem({ ...newItem, nazwa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="np. Pufa Miki Rosa"
                  />
                </div>
                {(activeTab === 'wykroje' || activeTab === 'polprodukty') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tkanina <span className="text-gray-400 font-normal">(opcjonalne)</span>
                    </label>
                    <input
                      type="text"
                      value={newItem.tkanina}
                      onChange={(e) => setNewItem({ ...newItem, tkanina: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. Velvet Rosa"
                    />
                  </div>
                )}
                {activeTab === 'gotowe' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      EAN-13 <span className="text-gray-400 font-normal">(opcjonalne)</span>
                    </label>
                    <input
                      type="text"
                      value={newItem.ean}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                        setNewItem({ ...newItem, ean: val });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stan</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newItem.stan}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                        setNewItem({ ...newItem, stan: val });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. 25 lub 12,50"
                    />
                  </div>
                  {activeTab === 'surowce' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jednostka</label>
                      <select
                        value={newItem.jednostka}
                        onChange={(e) => setNewItem({ ...newItem, jednostka: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {activeTab === 'gotowe' ? 'Cena PLN' : 'Wart. netto PLN'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.cena}
                      onChange={(e) => setNewItem({ ...newItem, cena: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. 99.99"
                    />
                  </div>
                </div>
                {activeTab === 'gotowe' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Czas produkcji (min)</label>
                    <input
                      type="number"
                      value={newItem.czas_produkcji}
                      onChange={(e) => setNewItem({ ...newItem, czas_produkcji: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edytuj pozycje</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingItem.sku}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nazwa produktu</label>
                  <input
                    type="text"
                    value={editingItem.nazwa}
                    onChange={(e) => setEditingItem({ ...editingItem, nazwa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {(activeTab === 'wykroje' || activeTab === 'polprodukty') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tkanina <span className="text-gray-400 font-normal">(opcjonalne)</span>
                    </label>
                    <input
                      type="text"
                      value={editingItem.tkanina || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, tkanina: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="np. Velvet Rosa"
                    />
                  </div>
                )}
                {activeTab === 'gotowe' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      EAN-13 <span className="text-gray-400 font-normal">(opcjonalne)</span>
                    </label>
                    <input
                      type="text"
                      value={editingItem.ean || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                        setEditingItem({ ...editingItem, ean: val });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stan</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editingItem.stan}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                        setEditingItem({ ...editingItem, stan: val });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {activeTab === 'surowce' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jednostka</label>
                      <select
                        value={editingItem.jednostka || 'szt'}
                        onChange={(e) => setEditingItem({ ...editingItem, jednostka: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {activeTab === 'gotowe' ? 'Cena PLN' : 'Wart. netto PLN'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem.cena || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, cena: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {activeTab === 'gotowe' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Czas produkcji (min)</label>
                    <input
                      type="number"
                      value={editingItem.czas_produkcji || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, czas_produkcji: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import CSV do: {getTabLabel(activeTab)}</h3>

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

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importUpdateMode}
                    onChange={(e) => setImportUpdateMode(e.target.checked)}
                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-medium text-purple-800">Aktualizuj istniejace pozycje</span>
                    <p className="text-xs text-purple-600 mt-1">
                      Jesli nazwa lub SKU juz istnieje w magazynie, zaktualizuj dane (np. EAN, stan, cena) zamiast pomijac jako duplikat.
                    </p>
                  </div>
                </label>
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
                  onClick={() => { setShowImportModal(false); setImportUpdateMode(false); }}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-4xl w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Szczegoly produktu</h3>
                  <p className="text-sm text-gray-500 break-words">{recipeItem.sku} - {recipeItem.nazwa}</p>
                </div>
                <button
                  onClick={() => {
                    setShowRecipeModal(false);
                    setRecipeItem(null);
                    setRecipeIngredients([]);
                    setIngredientSearchPolprodukty('');
                    setIngredientSearchWykroje('');
                    setIngredientSearchSurowce('');
                    // Odswież liste produktow tylko jesli byly zmiany
                    if (recipeChanged) {
                      fetchInventory(activeTab, true);
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Kalkulator kosztow wytworzenia - tylko dla gotowych produktow */}
              {activeTab === 'gotowe' && (() => {
                const MINUTE_RATE = 0.417; // 25 zl/h netto (najnizsza krajowa)
                const ingredientsCost = recipeIngredients.reduce((sum, ing) => sum + (ing.ingredientCena || 0) * ing.quantity, 0);
                const productionTime = recipeItem.czas_produkcji || 0;
                const laborCost = productionTime * MINUTE_RATE;
                const totalCost = ingredientsCost + laborCost;
                const margin = recipeItem.cena - totalCost;
                const marginPercent = totalCost > 0 ? ((margin / totalCost) * 100) : (recipeItem.cena > 0 ? 100 : 0);

                return (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 p-3">
                    {/* Czas produkcji - edytowalny */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">⏱️ Czas produkcji:</span>
                        <input
                          type="number"
                          value={editingCzasId === recipeItem.id ? editingCzasValue : productionTime}
                          onChange={(e) => {
                            if (editingCzasId !== recipeItem.id) {
                              setEditingCzasId(recipeItem.id);
                            }
                            setEditingCzasValue(e.target.value);
                          }}
                          onBlur={() => handleCzasSubmit(recipeItem)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCzasSubmit(recipeItem);
                            if (e.key === 'Escape') setEditingCzasId(null);
                          }}
                          className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium"
                          min="0"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">min</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Koszt: <span className="font-medium text-orange-600 dark:text-orange-400">{laborCost.toFixed(2)} zl</span>
                      </div>
                    </div>

                    {/* Podsumowanie kosztow */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white dark:bg-gray-700 rounded p-2">
                        <p className="text-gray-500 dark:text-gray-400">Skladniki</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400">{ingredientsCost.toFixed(2)} zl</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded p-2">
                        <p className="text-gray-500 dark:text-gray-400">Praca</p>
                        <p className="font-bold text-orange-600 dark:text-orange-400">{laborCost.toFixed(2)} zl</p>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/30 rounded p-2">
                        <p className="text-gray-500 dark:text-gray-400">Razem</p>
                        <p className="font-bold text-green-600 dark:text-green-400">{totalCost.toFixed(2)} zl</p>
                      </div>
                    </div>

                    {/* Marza */}
                    {recipeItem.cena > 0 && (
                      <div className={`mt-2 rounded p-2 text-xs flex justify-between items-center ${margin >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <span className="text-gray-600 dark:text-gray-400">Marza (cena: {recipeItem.cena.toFixed(2)} zl)</span>
                        <span className={`font-bold ${margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {margin >= 0 ? '+' : ''}{margin.toFixed(2)} zl ({marginPercent.toFixed(0)}%)
                        </span>
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
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Skladniki ({recipeIngredients.length})</h4>
                    {recipeIngredients.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 dark:bg-gray-700 rounded">
                        Brak skladnikow. Dodaj skladniki z listy ponizej.
                      </p>
                    ) : (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <table className="w-full text-sm min-w-[600px]">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">SKU</th>
                              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nazwa</th>
                              <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20">Ilosc</th>
                              <th className="px-2 sm:px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">Cena</th>
                              <th className="px-2 sm:px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">Suma</th>
                              <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20">Stan</th>
                              <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-16">Akcja</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {recipeIngredients.map(ing => (
                              <tr key={ing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-2 sm:px-3 py-2">
                                  <span className="font-mono text-[10px] text-gray-600 dark:text-gray-400 break-all">{ing.sku}</span>
                                </td>
                                <td className="px-2 sm:px-3 py-2">
                                  <span className="text-sm text-gray-900 dark:text-white">{ing.nazwa}</span>
                                </td>
                                <td className="px-2 sm:px-3 py-2 text-center">
                                  <input
                                    type="number"
                                    value={ing.quantity}
                                    onChange={(e) => handleUpdateIngredientQty(ing.id, parseFloat(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    min="0.01"
                                    step="0.01"
                                  />
                                </td>
                                <td className="px-2 sm:px-3 py-2 text-right text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                  {(ing.ingredientCena || 0).toFixed(2)} zl
                                </td>
                                <td className="px-2 sm:px-3 py-2 text-right font-medium text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                  {((ing.ingredientCena || 0) * ing.quantity).toFixed(2)} zl
                                </td>
                                <td className="px-2 sm:px-3 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    ing.ingredientStan > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                  }`}>
                                    {ing.ingredientStan}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-3 py-2 text-center">
                                  <button
                                    onClick={() => handleRemoveIngredient(ing.id)}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
                                  >
                                    Usun
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Dodaj skladnik */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Dodaj skladnik z magazynu</h4>

                    <div className="space-y-4">
                      {/* Polprodukty - tylko dla gotowych produktow */}
                      {activeTab === 'gotowe' && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wide">Polprodukty</p>
                          <input
                            type="text"
                            value={ingredientSearchPolprodukty}
                            onChange={(e) => setIngredientSearchPolprodukty(e.target.value)}
                            placeholder="Szukaj polproduktow..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <div className="max-h-52 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            {(magazyny.polprodukty || []).length === 0 ? (
                              <p className="text-sm text-gray-400 p-3 text-center">Brak polproduktow</p>
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
                                  <p className="text-sm text-gray-400 p-3 text-center">{ingredientSearchPolprodukty ? 'Brak wynikow' : 'Wszystkie dodane'}</p>
                                ) : (
                                  filtered.slice(0, 100).map(p => (
                                    <button
                                      key={p.id}
                                      onClick={() => handleAddIngredient(p.id)}
                                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center justify-between gap-3 transition-colors"
                                    >
                                      <span className="text-gray-700 dark:text-gray-300">{p.nazwa}</span>
                                      <span className="text-blue-500 text-xl flex-shrink-0 font-bold">+</span>
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
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-2 uppercase tracking-wide">Wykroje</p>
                          <input
                            type="text"
                            value={ingredientSearchWykroje}
                            onChange={(e) => setIngredientSearchWykroje(e.target.value)}
                            placeholder="Szukaj wykrojow..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <div className="max-h-52 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            {(magazyny.wykroje || []).length === 0 ? (
                              <p className="text-sm text-gray-400 p-3 text-center">Brak wykrojow</p>
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
                                  <p className="text-sm text-gray-400 p-3 text-center">{ingredientSearchWykroje ? 'Brak wynikow' : 'Wszystkie dodane'}</p>
                                ) : (
                                  filtered.slice(0, 100).map(p => (
                                    <button
                                      key={p.id}
                                      onClick={() => handleAddIngredient(p.id)}
                                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-yellow-100 dark:hover:bg-yellow-900/40 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center justify-between gap-3 transition-colors"
                                    >
                                      <span className="text-gray-700 dark:text-gray-300">{p.nazwa}</span>
                                      <span className="text-yellow-600 text-xl flex-shrink-0 font-bold">+</span>
                                    </button>
                                  ))
                                );
                              })()
                            )}
                          </div>
                        </div>
                      )}

                      {/* Surowce - dla wszystkich (gotowe, polprodukty, wykroje) */}
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 uppercase tracking-wide">Surowce</p>
                        <input
                          type="text"
                          value={ingredientSearchSurowce}
                          onChange={(e) => setIngredientSearchSurowce(e.target.value)}
                          placeholder="Szukaj surowcow..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <div className="max-h-52 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          {(magazyny.surowce || []).length === 0 ? (
                            <p className="text-sm text-gray-400 p-3 text-center">Brak surowcow</p>
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
                                <p className="text-sm text-gray-400 p-3 text-center">{ingredientSearchSurowce ? 'Brak wynikow' : 'Wszystkie dodane'}</p>
                              ) : (
                                filtered.slice(0, 100).map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() => handleAddIngredient(p.id)}
                                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-green-100 dark:hover:bg-green-900/40 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center justify-between gap-3 transition-colors"
                                  >
                                    <span className="text-gray-700 dark:text-gray-300">{p.nazwa}</span>
                                    <span className="text-green-600 text-xl flex-shrink-0 font-bold">+</span>
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
                        // Odswież liste produktow tylko jesli byly zmiany
                        if (recipeChanged) {
                          fetchInventory(activeTab, true);
                        }
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

        {/* Historia zmian Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-4xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historia zmian magazynu</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Filtry */}
              <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 items-center">
                <select
                  value={historyFilterUser}
                  onChange={(e) => {
                    setHistoryFilterUser(e.target.value);
                    fetchHistory(1, e.target.value, historyFilterAction, historyFilterDateFrom, historyFilterDateTo, historyPerPage);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Wszyscy uzytkownicy</option>
                  {historyUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
                <select
                  value={historyFilterAction}
                  onChange={(e) => {
                    setHistoryFilterAction(e.target.value);
                    fetchHistory(1, historyFilterUser, e.target.value, historyFilterDateFrom, historyFilterDateTo, historyPerPage);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Wszystkie akcje</option>
                  <option value="STAN_CHANGE">Zmiana stanu</option>
                  <option value="PRICE_CHANGE">Zmiana ceny</option>
                  <option value="PRODUCT_ADD">Dodanie produktu</option>
                  <option value="PRODUCT_MODIFY">Modyfikacja produktu</option>
                  <option value="PRODUCT_DELETE">Usuniecie produktu</option>
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Od:</span>
                  <input
                    type="date"
                    value={historyFilterDateFrom}
                    onChange={(e) => {
                      setHistoryFilterDateFrom(e.target.value);
                      fetchHistory(1, historyFilterUser, historyFilterAction, e.target.value, historyFilterDateTo, historyPerPage);
                    }}
                    className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Do:</span>
                  <input
                    type="date"
                    value={historyFilterDateTo}
                    onChange={(e) => {
                      setHistoryFilterDateTo(e.target.value);
                      fetchHistory(1, historyFilterUser, historyFilterAction, historyFilterDateFrom, e.target.value, historyPerPage);
                    }}
                    className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleExportHistoryCSV}
                  className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  CSV ({historyTotal})
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-xs text-gray-400 mr-1">Na stronie:</span>
                  {[50, 200, 500].map(n => (
                    <button
                      key={n}
                      onClick={() => {
                        setHistoryPerPage(n);
                        fetchHistory(1, historyFilterUser, historyFilterAction, historyFilterDateFrom, historyFilterDateTo, n);
                      }}
                      className={`px-2 py-0.5 text-xs rounded ${historyPerPage === n ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
                  Razem: {historyTotal} zmian
                </span>
              </div>

              {/* Lista zmian */}
              <div className="flex-1 overflow-y-auto">
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : historyData.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">Brak historii zmian</p>
                ) : (
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Data</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Uzytkownik</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Akcja</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Produkt</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Zmiana</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Zrodlo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {historyData.map((entry) => {
                        const actionLabels = {
                          'STAN_CHANGE': { label: 'Zmiana stanu', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
                          'PRICE_CHANGE': { label: 'Zmiana ceny', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
                          'PRODUCT_ADD': { label: 'Dodanie', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
                          'PRODUCT_MODIFY': { label: 'Modyfikacja', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
                          'PRODUCT_DELETE': { label: 'Usuniecie', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
                        };
                        const action = actionLabels[entry.action_type] || { label: entry.action_type, color: 'bg-gray-100 text-gray-800' };
                        const sourceLabels = {
                          'CSV_IMPORT': 'Import CSV',
                          'MANUAL': 'Reczna zmiana',
                          'API': 'API'
                        };

                        return (
                          <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-600 dark:text-gray-300">
                              {new Date(entry.created_at).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white">
                              {entry.username || '-'}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${action.color}`}>
                                {action.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                              <div className="font-medium">{entry.sku}</div>
                              <div className="truncate max-w-[150px] text-gray-400">{entry.nazwa}</div>
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {entry.field_changed === 'stan' && (
                                <span className="text-gray-600 dark:text-gray-300">
                                  {parseFloat(entry.old_value || 0).toFixed(2)} → <span className="font-bold text-blue-600">{parseFloat(entry.new_value || 0).toFixed(2)}</span>
                                  {parseFloat(entry.new_value) > parseFloat(entry.old_value) ? (
                                    <span className="ml-1 text-green-600">(+{(parseFloat(entry.new_value) - parseFloat(entry.old_value)).toFixed(2)})</span>
                                  ) : (
                                    <span className="ml-1 text-red-600">({(parseFloat(entry.new_value) - parseFloat(entry.old_value)).toFixed(2)})</span>
                                  )}
                                </span>
                              )}
                              {entry.field_changed === 'cena' && (
                                <span className="text-gray-600 dark:text-gray-300">
                                  {parseFloat(entry.old_value || 0).toFixed(2)} zl → <span className="font-bold text-yellow-600">{parseFloat(entry.new_value || 0).toFixed(2)} zl</span>
                                </span>
                              )}
                              {entry.action_type === 'PRODUCT_ADD' && (
                                <span className="text-green-600">Nowy produkt</span>
                              )}
                              {entry.action_type === 'PRODUCT_DELETE' && (
                                <span className="text-red-600">Usuniety</span>
                              )}
                              {entry.action_type === 'PRODUCT_MODIFY' && !entry.field_changed && (
                                <span className="text-purple-600">Dane zaktualizowane</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-400">
                              {sourceLabels[entry.source] || entry.source || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Paginacja */}
              {historyTotal > historyPerPage && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => fetchHistory(historyPage - 1, historyFilterUser, historyFilterAction, historyFilterDateFrom, historyFilterDateTo, historyPerPage)}
                    disabled={historyPage <= 1}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                  >
                    Poprzednia
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
                    Strona {historyPage} z {Math.ceil(historyTotal / historyPerPage)}
                  </span>
                  <button
                    onClick={() => fetchHistory(historyPage + 1, historyFilterUser, historyFilterAction, historyFilterDateFrom, historyFilterDateTo, historyPerPage)}
                    disabled={historyPage >= Math.ceil(historyTotal / historyPerPage)}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                  >
                    Nastepna
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks Modal */}
        {showTasksModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-2xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Zadania WMS</h3>
                <button
                  onClick={() => setShowTasksModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Formularz dodawania zadania */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-3">Dodaj nowe zadanie</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Przypisz do:</label>
                    <select
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Wybierz pracownika...</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.username}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tresc zadania:</label>
                    <textarea
                      value={newTaskContent}
                      onChange={(e) => setNewTaskContent(e.target.value)}
                      placeholder="Opisz zadanie do wykonania..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                  <button
                    onClick={handleAddTask}
                    disabled={taskSending || !newTaskContent.trim() || !newTaskAssignee}
                    className="w-full px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {taskSending ? 'Dodawanie...' : 'Dodaj zadanie'}
                  </button>
                </div>
              </div>

              {/* Lista zadan */}
              <div className="flex-1 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lista zadan ({wmsTasks.length})</h4>

                {tasksLoading ? (
                  <div className="text-center py-8 text-gray-500">Ladowanie...</div>
                ) : wmsTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">Brak zadan</div>
                ) : (
                  <div className="space-y-2">
                    {wmsTasks.map(task => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border ${
                          task.status === 'completed'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : task.assigned_to === currentUser?.username
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                              {task.content}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>Od: <span className="font-medium">{task.created_by}</span></span>
                              <span>→</span>
                              <span>Dla: <span className={`font-medium ${task.assigned_to === currentUser?.username ? 'text-orange-600 dark:text-orange-400' : ''}`}>{task.assigned_to}</span></span>
                              <span>|</span>
                              <span>{new Date(task.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {task.status === 'completed' && task.completed_at && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                ✓ Wykonane przez {task.completed_by} ({new Date(task.completed_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {task.status === 'pending' && (
                              <button
                                onClick={() => handleCompleteTask(task.id)}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                title="Oznacz jako wykonane"
                              >
                                ✓
                              </button>
                            )}
                            {(task.created_by === currentUser?.username || currentUser?.username === 'admin') && (
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                title="Usun zadanie"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Zamknij */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowTasksModal(false)}
                  className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Warning Modal */}
        {showBulkWarningModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Masowe ustawienie progów ostrzeżeń
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Ustawisz progi dla <span className="font-bold">{selectedIds.size}</span> zaznaczonych pozycji
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                    🔴 Czerwony (krytyczny) - stan mniejszy niż:
                  </label>
                  <input
                    type="number"
                    value={bulkRed}
                    onChange={(e) => setBulkRed(e.target.value)}
                    placeholder="np. 30"
                    min="0"
                    className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50 dark:bg-red-900/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                    🟡 Żółty (ostrzeżenie) - stan mniejszy niż:
                  </label>
                  <input
                    type="number"
                    value={bulkYellow}
                    onChange={(e) => setBulkYellow(e.target.value)}
                    placeholder="np. 80"
                    min="0"
                    className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                  />
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    🟢 Zielony - stan równy lub wyższy niż próg żółty
                  </p>
                </div>
              </div>

              <div className="flex justify-between gap-3 mt-6">
                <button
                  onClick={() => {
                    setBulkYellow('');
                    setBulkRed('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Wyczyść progi
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowBulkWarningModal(false);
                      setBulkYellow('');
                      setBulkRed('');
                    }}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleBulkWarning}
                    disabled={savingBulkWarning}
                    className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {savingBulkWarning ? 'Zapisywanie...' : `Zapisz dla ${selectedIds.size} pozycji`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Color Thresholds Modal */}
        {showColorModal && colorItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ustaw progi kolorów
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {colorItem.nazwa}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Aktualny stan: <span className="font-bold">{colorItem.stan} {colorItem.jednostka || 'szt'}</span>
              </p>

              <div className="space-y-4">
                {/* Red threshold */}
                <div>
                  <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                    🔴 Czerwony (krytyczny) - stan mniejszy niż:
                  </label>
                  <input
                    type="number"
                    value={colorRed}
                    onChange={(e) => setColorRed(e.target.value)}
                    placeholder="np. 30"
                    min="0"
                    className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50 dark:bg-red-900/20"
                  />
                </div>

                {/* Yellow threshold */}
                <div>
                  <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                    🟡 Żółty (ostrzeżenie) - stan mniejszy niż:
                  </label>
                  <input
                    type="number"
                    value={colorYellow}
                    onChange={(e) => setColorYellow(e.target.value)}
                    placeholder="np. 80"
                    min="0"
                    className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                  />
                </div>

                {/* Green info */}
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    🟢 Zielony - stan równy lub wyższy niż próg żółty
                  </p>
                </div>

                {/* Preview */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Podgląd dla aktualnego stanu ({colorItem.stan}):</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm font-bold ${
                      colorRed && colorItem.stan < parseInt(colorRed) ? 'bg-red-100 text-red-800' :
                      colorYellow && colorItem.stan < parseInt(colorYellow) ? 'bg-yellow-100 text-yellow-800' :
                      (colorRed || colorYellow) ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {colorItem.stan} {colorItem.jednostka || 'szt'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {colorRed && colorItem.stan < parseInt(colorRed) ? '← Krytyczny' :
                       colorYellow && colorItem.stan < parseInt(colorYellow) ? '← Ostrzeżenie' :
                       (colorRed || colorYellow) ? '← OK' : '← Brak progów'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-3 mt-6">
                <button
                  onClick={() => {
                    setColorYellow('');
                    setColorRed('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Wyczyść progi
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowColorModal(false);
                      setColorItem(null);
                    }}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleSaveColorThresholds}
                    disabled={savingColor}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingColor ? 'Zapisywanie...' : 'Zapisz'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
