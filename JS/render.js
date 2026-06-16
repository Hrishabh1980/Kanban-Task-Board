(() => {
  'use strict';

  window.Kanban = window.Kanban || {};

  let searchQuery = '';

  // Main board renderer
  function renderBoard() {
    const canvas = document.getElementById('board-canvas');
    if (!canvas) return;
    
    canvas.innerHTML = '';

    const stateObj = window.Kanban.state;
    if (!stateObj || !stateObj.columns) return;

    stateObj.columns.forEach((column, columnIndex) => {
      const columnElement = createColumnDOM(column, columnIndex);
      canvas.appendChild(columnElement);
    });

    // Sync theme visuals
    if (typeof window.Kanban.updateThemeUI === 'function') {
      window.Kanban.updateThemeUI();
    }
  }

  // Create Column Element
  function createColumnDOM(column, columnIndex) {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'kanban-column';
    columnDiv.id = column.id;
    columnDiv.setAttribute('data-column-index', columnIndex);
    
    // Search filtering
    const filteredCards = column.cards.filter(card => 
      card.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Header Setup
    const headerDiv = document.createElement('div');
    headerDiv.className = 'column-header';
    
    const titleContainer = document.createElement('div');
    titleContainer.className = 'column-header-title-container';
    
    const titleText = document.createElement('h3');
    titleText.className = 'column-title-text';
    titleText.textContent = column.title;
    titleText.title = "Double-click to rename column";
    
    titleText.addEventListener('dblclick', () => {
      enableColumnRename(column, titleText, titleContainer);
    });

    const countBadge = document.createElement('span');
    countBadge.className = 'column-card-count';
    if (searchQuery) {
      countBadge.textContent = `${filteredCards.length}/${column.cards.length}`;
    } else {
      countBadge.textContent = column.cards.length;
    }

    titleContainer.appendChild(titleText);
    titleContainer.appendChild(countBadge);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'column-header-actions';

    const deleteColBtn = document.createElement('button');
    deleteColBtn.className = 'column-action-btn';
    deleteColBtn.title = "Delete column";
    deleteColBtn.setAttribute('aria-label', `Delete column ${column.title}`);
    deleteColBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>';
    deleteColBtn.addEventListener('click', () => handleDeleteColumn(column.id));

    actionsDiv.appendChild(deleteColBtn);
    headerDiv.appendChild(titleContainer);
    headerDiv.appendChild(actionsDiv);
    columnDiv.appendChild(headerDiv);

    // Cards list setup
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'column-cards';
    cardsContainer.setAttribute('data-column-id', column.id);

    filteredCards.forEach((card, index) => {
      const cardDOM = createCardDOM(card, column.id, index);
      cardsContainer.appendChild(cardDOM);
    });

    columnDiv.appendChild(cardsContainer);

    // Footer section setup
    const footerDiv = document.createElement('div');
    footerDiv.className = 'add-card-wrapper';
    
    const addTrigger = document.createElement('button');
    addTrigger.className = 'add-card-trigger';
    addTrigger.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg><span>Add card</span>';
    
    addTrigger.addEventListener('click', () => {
      if (window.Kanban.modal) {
        window.Kanban.modal.openCardAdd(column.id, (cardData) => {
          window.Kanban.stateManager.addCard(column.id, cardData.title, cardData.priority, cardData.dueDate);
          if (window.Kanban.toast) {
            window.Kanban.toast.show("Task card created successfully");
          }
          renderBoard();
        });
      }
    });

    footerDiv.appendChild(addTrigger);
    columnDiv.appendChild(footerDiv);

    // Bind drag over column target handlers
    if (window.Kanban.dragdrop && typeof window.Kanban.dragdrop.bindColumn === 'function') {
      window.Kanban.dragdrop.bindColumn(cardsContainer);
    }

    return columnDiv;
  }

  // Column double click inline rename
  function enableColumnRename(column, titleTextNode, containerNode) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'column-title-input';
    input.value = column.title;
    
    containerNode.replaceChild(input, titleTextNode);
    input.focus();
    input.select();

    const saveRename = () => {
      const val = input.value.trim();
      if (val && val !== column.title) {
        window.Kanban.stateManager.renameColumn(column.id, val);
        if (window.Kanban.toast) {
          window.Kanban.toast.show(`Column renamed to "${val}"`);
        }
        renderBoard();
      } else {
        containerNode.replaceChild(titleTextNode, input);
      }
    };

    const cancelRename = () => {
      containerNode.replaceChild(titleTextNode, input);
    };

    input.addEventListener('blur', saveRename);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveRename();
      } else if (e.key === 'Escape') {
        cancelRename();
      }
    });
  }

  // Create Card Element
  function createCardDOM(card, columnId, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'kanban-card';
    cardDiv.id = card.id;
    cardDiv.draggable = true;
    cardDiv.setAttribute('data-card-id', card.id);
    cardDiv.setAttribute('data-column-id', columnId);
    cardDiv.setAttribute('data-card-index', index);
    cardDiv.setAttribute('tabindex', '0'); // Accessibility

    // Badges area
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'card-badges';

    // Priority label
    const priorityBadge = document.createElement('span');
    const pri = card.priority || 'none';
    priorityBadge.className = `badge badge-${pri}`;
    priorityBadge.textContent = pri === 'none' ? '' : pri;
    badgesContainer.appendChild(priorityBadge);

    // Due Date Label
    if (card.dueDate && window.Kanban.utils) {
      const dateTag = document.createElement('span');
      dateTag.className = 'date-tag';
      
      const isOverdue = window.Kanban.utils.checkIsOverdue(card.dueDate, columnId);
      if (isOverdue) {
        dateTag.classList.add('overdue');
      }
      
      const icon = '<svg viewBox="0 0 24 24"><path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/></svg>';
      dateTag.innerHTML = `${icon} <span>${window.Kanban.utils.formatDate(card.dueDate)}</span>`;
      if (isOverdue) {
        dateTag.title = "This task is overdue!";
      }
      badgesContainer.appendChild(dateTag);
    }

    cardDiv.appendChild(badgesContainer);

    // Title setup
    const titleEl = document.createElement('div');
    titleEl.className = 'card-title';
    titleEl.innerHTML = getHighlightedText(card.title, searchQuery);
    
    // Double click card detail modal trigger
    cardDiv.addEventListener('dblclick', (e) => {
      if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
        handleCardEdit(card, columnId);
      }
    });

    cardDiv.appendChild(titleEl);

    // Actions & Mobile Fallback Selection
    const footerDiv = document.createElement('div');
    footerDiv.className = 'card-footer';

    // Mobile move fallback selection
    const selectMenu = document.createElement('select');
    selectMenu.className = 'mobile-move-select';
    selectMenu.setAttribute('aria-label', "Move task to column");
    
    const defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.textContent = "Move to →";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    selectMenu.appendChild(defaultOpt);

    window.Kanban.state.columns.forEach(col => {
      if (col.id !== columnId) {
        const opt = document.createElement('option');
        opt.value = col.id;
        opt.textContent = col.title;
        selectMenu.appendChild(opt);
      }
    });

    selectMenu.addEventListener('change', (e) => {
      const targetColId = e.target.value;
      if (targetColId) {
        window.Kanban.stateManager.moveCard(card.id, columnId, targetColId, 9999);
        if (window.Kanban.toast) {
          const destCol = window.Kanban.state.columns.find(c => c.id === targetColId);
          window.Kanban.toast.show(`Moved to "${destCol ? destCol.title : 'another column'}"`, "info");
        }
        renderBoard();
      }
    });

    footerDiv.appendChild(selectMenu);

    // Buttons Container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'card-footer-buttons';

    const editBtn = document.createElement('button');
    editBtn.className = 'card-btn';
    editBtn.title = "Edit Card Details";
    editBtn.setAttribute('aria-label', `Edit details for card ${card.title}`);
    editBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.07,6.18L3,17.25Z"/></svg>';
    editBtn.addEventListener('click', () => handleCardEdit(card, columnId));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-btn';
    deleteBtn.title = "Delete card";
    deleteBtn.setAttribute('aria-label', `Delete card ${card.title}`);
    deleteBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>';
    deleteBtn.addEventListener('click', () => handleDeleteCard(columnId, card.id));

    buttonsContainer.appendChild(editBtn);
    buttonsContainer.appendChild(deleteBtn);
    footerDiv.appendChild(buttonsContainer);
    cardDiv.appendChild(footerDiv);

    // Bind card drag capabilities
    if (window.Kanban.dragdrop && typeof window.Kanban.dragdrop.bindCard === 'function') {
      window.Kanban.dragdrop.bindCard(cardDiv);
    }

    // Keyboard accessibility trigger
    cardDiv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.activeElement === cardDiv) {
        handleCardEdit(card, columnId);
      }
    });

    return cardDiv;
  }

  // Handle Edit Card Detail saves
  function handleCardEdit(card, columnId) {
    if (window.Kanban.modal) {
      window.Kanban.modal.openCardEdit(card, columnId, (updates) => {
        window.Kanban.stateManager.updateCard(updates.columnId, updates.id, {
          title: updates.title,
          priority: updates.priority,
          dueDate: updates.dueDate
        });
        if (window.Kanban.toast) {
          window.Kanban.toast.show("Task details updated", "success");
        }
        renderBoard();
      });
    }
  }

  // Handle delete card click
  async function handleDeleteCard(columnId, cardId) {
    if (window.Kanban.modal) {
      const confirmed = await window.Kanban.modal.confirm(
        "Delete Task?",
        "Are you sure you want to delete this task? This action cannot be undone.",
        "Delete"
      );
      if (confirmed) {
        const deleted = window.Kanban.stateManager.deleteCard(columnId, cardId);
        if (deleted) {
          if (window.Kanban.toast) {
            window.Kanban.toast.show("Task card deleted", "warning");
          }
          renderBoard();
        }
      }
    }
  }

  // Handle delete column click
  async function handleDeleteColumn(columnId) {
    const col = window.Kanban.state.columns.find(c => c.id === columnId);
    if (!col) return;

    const warningMsg = col.cards.length > 0 
      ? `This column contains ${col.cards.length} task(s). Deleting the column will permanently delete these tasks. This cannot be undone.`
      : "Are you sure you want to delete this column?";

    if (window.Kanban.modal) {
      const confirmed = await window.Kanban.modal.confirm(
        `Delete column "${col.title}"?`,
        warningMsg,
        "Delete Column"
      );
      if (confirmed) {
        window.Kanban.stateManager.deleteColumn(columnId);
        if (window.Kanban.toast) {
          window.Kanban.toast.show(`Column "${col.title}" deleted`, "warning");
        }
        renderBoard();
      }
    }
  }

  // Match highlight formatter helper
  function getHighlightedText(text, word) {
    if (!word || !window.Kanban.utils) return escapeHTMLForHighlight(text);
    const cleanText = escapeHTMLForHighlight(text);
    const cleanWord = window.Kanban.utils.escapeHTML(word);
    
    const regex = new RegExp(`(${window.Kanban.utils.escapeRegExp(cleanWord)})`, 'gi');
    return cleanText.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  function escapeHTMLForHighlight(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Set Search filter query
  function setSearchQuery(val) {
    searchQuery = val.trim();
    renderBoard();
  }

  // Export module interface
  window.Kanban.renderer = {
    renderBoard,
    setSearchQuery
  };
})();
