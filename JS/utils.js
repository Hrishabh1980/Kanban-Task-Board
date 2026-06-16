(() => {
  'use strict';

  window.Kanban = window.Kanban || {};

  // Escape HTML characters to prevent XSS
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Escape special regex characters
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Format YYYY-MM-DD to human-readable date format (e.g. "Jun 16, 2026")
  function formatDate(dateString) {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (e) {}
    return dateString;
  }

  // Check if a task date is past today's date (unless in 'Done' column)
  function checkIsOverdue(dueDateString, columnId) {
    if (!dueDateString) return false;
    
    // Done column tasks are marked completed and never marked overdue
    const col = window.Kanban.state && window.Kanban.state.columns.find(c => c.id === columnId);
    if (col && col.title.toLowerCase() === 'done') {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const parts = dueDateString.split('-');
      const due = new Date(parts[0], parts[1] - 1, parts[2]);
      due.setHours(0, 0, 0, 0);
      return due < today;
    } catch (e) {
      return false;
    }
  }

  // Export utilities to namespace
  window.Kanban.utils = {
    escapeHTML,
    escapeRegExp,
    formatDate,
    checkIsOverdue
  };
})();
