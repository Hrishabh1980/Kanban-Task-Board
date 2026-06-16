(() => {
  'use strict';

  window.Kanban = window.Kanban || {};

  let draggedCardId = null;
  let draggedSourceColumnId = null;

  // Bind drag capabilities to individual card element
  function bindCard(cardEl) {
    cardEl.addEventListener('dragstart', (e) => {
      draggedCardId = cardEl.getAttribute('data-card-id');
      draggedSourceColumnId = cardEl.getAttribute('data-column-id');
      
      cardEl.classList.add('is-dragging');
      
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedCardId);
    });

    cardEl.addEventListener('dragend', () => {
      cardEl.classList.remove('is-dragging');
      
      // Remove drop indicators across columns
      document.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
      document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('column-dragover'));
      
      draggedCardId = null;
      draggedSourceColumnId = null;
    });
  }

  // Bind column target events to cards container element
  function bindColumn(cardsContainerEl) {
    const colEl = cardsContainerEl.closest('.kanban-column');
    if (!colEl) return;

    cardsContainerEl.addEventListener('dragover', (e) => {
      e.preventDefault(); // Required to allow drop
      e.dataTransfer.dropEffect = 'move';

      const draggingCard = document.querySelector('.is-dragging');
      if (!draggingCard) return;

      // Determine hover index inside card children list
      const afterElement = getDragAfterElement(cardsContainerEl, e.clientY);
      
      let placeholder = cardsContainerEl.querySelector('.drag-placeholder');
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder';
      }

      if (afterElement == null) {
        cardsContainerEl.appendChild(placeholder);
      } else {
        cardsContainerEl.insertBefore(placeholder, afterElement);
      }
    });

    cardsContainerEl.addEventListener('dragenter', (e) => {
      e.preventDefault();
      colEl.classList.add('column-dragover');
    });

    cardsContainerEl.addEventListener('dragleave', (e) => {
      // Clean highlight only when boundary leaves column
      if (!colEl.contains(e.relatedTarget)) {
        colEl.classList.remove('column-dragover');
      }
    });

    cardsContainerEl.addEventListener('drop', (e) => {
      e.preventDefault();
      colEl.classList.remove('column-dragover');

      const placeholder = cardsContainerEl.querySelector('.drag-placeholder');
      if (!placeholder) return;

      // Calculate index of drop placeholder
      const children = [...cardsContainerEl.children];
      const placeholderIndex = children.indexOf(placeholder);

      placeholder.remove();

      if (draggedCardId && draggedSourceColumnId) {
        const targetColId = cardsContainerEl.getAttribute('data-column-id');
        
        // Update state and refresh UI
        window.Kanban.stateManager.moveCard(draggedCardId, draggedSourceColumnId, targetColId, placeholderIndex);
        window.Kanban.renderer.renderBoard();
      }
    });
  }

  // Find the exact vertical insertion element based on mouse pointer
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.is-dragging):not(.drag-placeholder)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Export module interface
  window.Kanban.dragdrop = {
    bindCard,
    bindColumn
  };
})();
