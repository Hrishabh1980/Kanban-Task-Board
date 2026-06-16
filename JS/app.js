(() => {
  'use strict';

  window.Kanban = window.Kanban || {};

  // Toggle dark/light theme preference in state and save
  function toggleTheme() {
    const state = window.Kanban.state;
    if (!state) return;
    
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    window.Kanban.stateManager.saveState();
    updateThemeUI();
  }

  // Update DOM classes based on theme settings
  function updateThemeUI() {
    const state = window.Kanban.state;
    if (!state) return;

    const root = document.documentElement;
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const toggleBtn = document.getElementById('theme-toggle-btn');

    if (!toggleBtn) return; // Guard page ready status

    root.setAttribute('data-theme', state.theme);

    if (state.theme === 'light') {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
      toggleBtn.title = "Switch to Dark Theme";
      toggleBtn.setAttribute('aria-label', "Switch to Dark Theme");
    } else {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
      toggleBtn.title = "Switch to Light Theme";
      toggleBtn.setAttribute('aria-label', "Switch to Light Theme");
    }
  }

  // Add column button trigger callback
  function handleAddColumn() {
    const colName = prompt("Enter new column title:");
    if (colName === null) return; // User pressed Cancel
    
    const cleanName = colName.trim();
    if (!cleanName) {
      if (window.Kanban.toast) {
        window.Kanban.toast.show("Column name cannot be blank", "error");
      }
      return;
    }

    window.Kanban.stateManager.addColumn(cleanName);
    
    if (window.Kanban.toast) {
      window.Kanban.toast.show(`Column "${cleanName}" created`, "success");
    }

    window.Kanban.renderer.renderBoard();
    
    // Auto-scroll to show newly created columns
    setTimeout(() => {
      const container = document.querySelector('.board-container');
      if (container) {
        container.scrollLeft = container.scrollWidth;
      }
    }, 100);
  }

  // App startup routine
  function init() {
    // Hydrate state from storage
    if (window.Kanban.stateManager && typeof window.Kanban.stateManager.loadState === 'function') {
      window.Kanban.stateManager.loadState();
    }
    
    // Initial UI render
    if (window.Kanban.renderer && typeof window.Kanban.renderer.renderBoard === 'function') {
      window.Kanban.renderer.renderBoard();
    }

    // Bind triggers
    const addColBtn = document.getElementById('add-column-btn');
    if (addColBtn) addColBtn.addEventListener('click', handleAddColumn);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

    // Bind search operations
    const searchInput = document.getElementById('board-search');
    const searchClear = document.getElementById('search-clear-btn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (window.Kanban.renderer) {
          window.Kanban.renderer.setSearchQuery(query);
        }
        if (searchClear) {
          searchClear.style.display = query.trim() ? 'block' : 'none';
        }
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        if (window.Kanban.renderer) {
          window.Kanban.renderer.setSearchQuery('');
        }
        searchClear.style.display = 'none';
        searchInput.focus();
      });
    }

    if (window.Kanban.toast) {
      window.Kanban.toast.show("Kanban Board loaded!", "info");
    }
  }

  // Bind theme updates on renderer module import
  window.Kanban.updateThemeUI = updateThemeUI;

  // Run initializer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
