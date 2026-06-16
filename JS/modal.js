(() => {
  'use strict';

  window.Kanban = window.Kanban || {};

  // Custom promisified confirm dialog
  function confirmAction(title, message, confirmText = 'Delete') {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirm-modal');
      if (!modal) {
        resolve(false);
        return;
      }
      
      const titleEl = modal.querySelector('.modal-title');
      const messageEl = modal.querySelector('.modal-message');
      const confirmBtn = modal.querySelector('.confirm-btn');
      const cancelBtn = modal.querySelector('.cancel-btn');
      const closeBtn = document.getElementById('confirm-modal-close');

      titleEl.textContent = title;
      messageEl.textContent = message;
      confirmBtn.textContent = confirmText;

      modal.classList.add('is-active');
      confirmBtn.focus();

      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        modal.classList.remove('is-active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        closeBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('keydown', handleEscapeKey);
      };

      const handleOutsideClick = (e) => {
        if (e.target === modal) handleCancel();
      };

      const handleEscapeKey = (e) => {
        if (e.key === 'Escape') handleCancel();
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      closeBtn.addEventListener('click', handleCancel);
      modal.addEventListener('click', handleOutsideClick);
      document.addEventListener('keydown', handleEscapeKey);
    });
  }

  // Opens the modal editor for card details
  function openCardEditModal(card, columnId, onSaveCallback) {
    const modal = document.getElementById('card-modal');
    if (!modal) return;

    const cardIdInput = document.getElementById('modal-card-id');
    const colIdInput = document.getElementById('modal-column-id');
    const titleArea = document.getElementById('modal-card-title');
    const prioritySelect = document.getElementById('modal-card-priority');
    const duedateInput = document.getElementById('modal-card-duedate');

    // Populate the form fields with card properties
    cardIdInput.value = card.id;
    colIdInput.value = columnId;
    titleArea.value = card.title;
    prioritySelect.value = card.priority || 'none';
    duedateInput.value = card.dueDate || '';

    modal.classList.add('is-active');
    titleArea.focus();

    const cancelBtn = document.getElementById('card-modal-cancel');
    const saveBtn = document.getElementById('card-modal-save');
    const closeBtn = document.getElementById('card-modal-close');

    const closeModal = () => {
      modal.classList.remove('is-active');
      cleanup();
    };

    const saveModal = () => {
      const updatedTitle = titleArea.value.trim();
      if (!updatedTitle) {
        if (window.Kanban.toast) {
          window.Kanban.toast.show("Task title cannot be empty.", "error");
        }
        titleArea.focus();
        return;
      }

      // Invoke callback to persist modifications
      if (typeof onSaveCallback === 'function') {
        onSaveCallback({
          id: cardIdInput.value,
          columnId: colIdInput.value,
          title: updatedTitle,
          priority: prioritySelect.value,
          dueDate: duedateInput.value
        });
      }
      closeModal();
    };

    const cleanup = () => {
      cancelBtn.removeEventListener('click', closeModal);
      closeBtn.removeEventListener('click', closeModal);
      saveBtn.removeEventListener('click', saveModal);
      modal.removeEventListener('click', outsideClick);
      document.removeEventListener('keydown', keydownEsc);
    };

    const outsideClick = (e) => {
      if (e.target === modal) closeModal();
    };

    const keydownEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveModal);
    modal.addEventListener('click', outsideClick);
    document.addEventListener('keydown', keydownEsc);
  }

  // Opens the modal editor for creating a new card
  function openCardAddModal(columnId, onCreateCallback) {
    const modal = document.getElementById('add-card-modal');
    if (!modal) return;

    const colIdInput = document.getElementById('modal-add-column-id');
    const titleArea = document.getElementById('modal-add-card-title');
    const prioritySelect = document.getElementById('modal-add-card-priority');
    const duedateInput = document.getElementById('modal-add-card-duedate');

    // Reset fields to default values
    colIdInput.value = columnId;
    titleArea.value = '';
    prioritySelect.value = 'medium';
    duedateInput.value = '';

    modal.classList.add('is-active');
    titleArea.focus();

    const cancelBtn = document.getElementById('add-card-modal-cancel');
    const createBtn = document.getElementById('add-card-modal-create');
    const closeBtn = document.getElementById('add-card-modal-close');

    const closeModal = () => {
      modal.classList.remove('is-active');
      cleanup();
    };

    const createCardAction = () => {
      const titleVal = titleArea.value.trim();
      if (!titleVal) {
        if (window.Kanban.toast) {
          window.Kanban.toast.show("Task title cannot be empty.", "error");
        }
        titleArea.focus();
        return;
      }

      if (typeof onCreateCallback === 'function') {
        onCreateCallback({
          columnId: colIdInput.value,
          title: titleVal,
          priority: prioritySelect.value,
          dueDate: duedateInput.value
        });
      }
      closeModal();
    };

    const cleanup = () => {
      cancelBtn.removeEventListener('click', closeModal);
      closeBtn.removeEventListener('click', closeModal);
      createBtn.removeEventListener('click', createCardAction);
      modal.removeEventListener('click', outsideClick);
      document.removeEventListener('keydown', keydownEsc);
    };

    const outsideClick = (e) => {
      if (e.target === modal) closeModal();
    };

    const keydownEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    createBtn.addEventListener('click', createCardAction);
    modal.addEventListener('click', outsideClick);
    document.addEventListener('keydown', keydownEsc);
  }

  // Export to namespace
  window.Kanban.modal = {
    confirm: confirmAction,
    openCardEdit: openCardEditModal,
    openCardAdd: openCardAddModal
  };
})();
