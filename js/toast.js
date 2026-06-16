(() => {
  'use strict';

  window.Kanban = window.Kanban || {};

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose appropriate SVG icon based on toast type
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" style="width:1.25rem; height:1.25rem; fill:var(--low-color);"><path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M10,17L17,10L15.58,8.59L10,14.17L7.42,11.59L6,13L10,17Z"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg viewBox="0 0 24 24" style="width:1.25rem; height:1.25rem; fill:var(--high-color);"><path d="M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" style="width:1.25rem; height:1.25rem; fill:var(--urgent-color);"><path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" style="width:1.25rem; height:1.25rem; fill:var(--accent-color);"><path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/></svg>';
    }

    const cleanMsg = window.Kanban.utils ? window.Kanban.utils.escapeHTML(message) : message;
    toast.innerHTML = `${iconSvg}<span>${cleanMsg}</span>`;
    container.appendChild(toast);

    // Slide-in animation trigger
    requestAnimationFrame(() => {
      toast.classList.add('is-show');
    });

    // Cleanup toast after timeout
    setTimeout(() => {
      toast.classList.remove('is-show');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      });
    }, 3000);
  }

  // Export to namespace
  window.Kanban.toast = {
    show: showToast
  };
})();
