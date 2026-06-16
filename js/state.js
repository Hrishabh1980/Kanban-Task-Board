(() => {
  'use strict';

  window.Kanban = window.Kanban || {};

  const STORAGE_KEY = 'kanban-board-data';

  // Seed data structure
  const SEED_STATE = {
    theme: 'dark',
    columns: [
      {
        id: 'col-todo',
        title: 'To Do',
        cards: [
          {
            id: 'card-seed-1',
            title: 'Welcome to your Kanban Board! Double-click a card or click the edit icon to adjust labels and due dates.',
            createdAt: Date.now(),
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days out
            priority: 'medium'
          },
          {
            id: 'card-seed-2',
            title: 'Task overdue example: try dragging this to In Progress or Done.',
            createdAt: Date.now() - 86400000 * 2,
            dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Overdue by 1 day
            priority: 'urgent'
          }
        ]
      },
      {
        id: 'col-inprogress',
        title: 'In Progress',
        cards: [
          {
            id: 'card-seed-3',
            title: 'Drag cards horizontally between columns to reorder task flows.',
            createdAt: Date.now() - 3600000,
            dueDate: '',
            priority: 'high'
          }
        ]
      },
      {
        id: 'col-done',
        title: 'Done',
        cards: [
          {
            id: 'card-seed-4',
            title: 'Completed tasks show priority labels, but are never flagged as overdue.',
            createdAt: Date.now() - 86400000 * 4,
            dueDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
            priority: 'low'
          }
        ]
      }
    ]
  };

  // State pointer
  let state = {
    theme: 'dark',
    columns: []
  };

  // Verifies the columns schema is correct
  function validateStateStructure(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (!Array.isArray(obj.columns)) return false;
    
    for (const col of obj.columns) {
      if (typeof col.id !== 'string' || typeof col.title !== 'string' || !Array.isArray(col.cards)) {
        return false;
      }
      for (const card of col.cards) {
        if (typeof card.id !== 'string' || typeof card.title !== 'string') {
          return false;
        }
      }
    }
    return true;
  }

  // Load state from Storage
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (validateStateStructure(parsed)) {
          state = parsed;
          // Sync back theme variable immediately
          window.Kanban.state = state;
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load local storage state, fallback to seed.", e);
    }
    // Deep clone SEED_STATE
    state = JSON.parse(JSON.stringify(SEED_STATE));
    window.Kanban.state = state;
    saveState();
  }

  // Save state to Storage
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Unable to write state to localStorage.", e);
      if (window.Kanban.toast) {
        window.Kanban.toast.show("Failed to save board data locally.", "error");
      }
    }
  }

  // State Mutators
  
  function addColumn(title) {
    const id = 'col-' + Date.now();
    state.columns.push({
      id: id,
      title: title,
      cards: []
    });
    saveState();
    return id;
  }

  function deleteColumn(columnId) {
    state.columns = state.columns.filter(c => c.id !== columnId);
    saveState();
  }

  function renameColumn(columnId, newTitle) {
    const col = state.columns.find(c => c.id === columnId);
    if (col) {
      col.title = newTitle;
      saveState();
    }
  }

  function addCard(columnId, title, priority = 'none', dueDate = '') {
    const col = state.columns.find(c => c.id === columnId);
    if (!col) return null;

    const newCard = {
      id: 'card-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      title: title,
      createdAt: Date.now(),
      dueDate: dueDate,
      priority: priority
    };

    col.cards.push(newCard);
    saveState();
    return newCard;
  }

  function deleteCard(columnId, cardId) {
    const col = state.columns.find(c => c.id === columnId);
    if (!col) return false;

    const origLen = col.cards.length;
    col.cards = col.cards.filter(c => c.id !== cardId);
    if (col.cards.length < origLen) {
      saveState();
      return true;
    }
    return false;
  }

  function updateCard(columnId, cardId, updates) {
    const col = state.columns.find(c => c.id === columnId);
    if (!col) return false;

    const card = col.cards.find(c => c.id === cardId);
    if (!card) return false;

    // Apply titles, labels, dates
    if (updates.title !== undefined) card.title = updates.title;
    if (updates.priority !== undefined) card.priority = updates.priority;
    if (updates.dueDate !== undefined) card.dueDate = updates.dueDate;

    saveState();
    return true;
  }

  function moveCard(cardId, sourceColId, targetColId, insertionIndex) {
    const srcCol = state.columns.find(c => c.id === sourceColId);
    const destCol = state.columns.find(c => c.id === targetColId);

    if (!srcCol || !destCol) return false;

    const cardIdx = srcCol.cards.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return false;

    // Remove from source array
    const [card] = srcCol.cards.splice(cardIdx, 1);

    // Guard safe insertion index bounds
    let finalIndex = insertionIndex;
    if (sourceColId === targetColId && cardIdx < insertionIndex) {
      finalIndex = Math.max(0, insertionIndex - 1);
    }

    // Insert card into target array
    destCol.cards.splice(finalIndex, 0, card);

    saveState();
    return true;
  }

  // Export module interface
  window.Kanban.state = state;
  window.Kanban.stateManager = {
    loadState,
    saveState,
    addColumn,
    deleteColumn,
    renameColumn,
    addCard,
    deleteCard,
    updateCard,
    moveCard
  };
})();
