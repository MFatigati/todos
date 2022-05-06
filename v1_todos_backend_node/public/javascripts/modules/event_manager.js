import {DOM_CONTENTS} from './dom_contents.js';
import {TODO_ITEMS_LOCAL} from './todo_items_local.js';
import {INPUT_FORM} from './input_form.js';
import {MAIN_DISPLAY} from './main_display.js';
import {COMMUNICATE} from './communicate.js';
import {SEED_DATA} from './seed_data.js';

export const EVENT_MANAGER = {
  init() {
    DOM_CONTENTS.modalForm.addEventListener('click', this.handleModalInternalClicks.bind(this));
    DOM_CONTENTS.revealModal.addEventListener('click', this.handleRevealModalClick);
    DOM_CONTENTS.modalBackground.addEventListener('click', this.handleCloseModal);
    DOM_CONTENTS.sidebarDiv.addEventListener('click', this.handleSidebarClicks);
    DOM_CONTENTS.logStateButton.addEventListener('click', this.handleLogLocalState);
    DOM_CONTENTS.loadSeedButton.addEventListener('click', this.handleLoadSeed);
    DOM_CONTENTS.resetDB.addEventListener('click', this.handleResetDB);
    this.delegatedListeningIndividualItems();
  },

  delegatedListeningIndividualItems() {
    document.addEventListener('click', event => {
      if (event.target.parentElement.classList.contains('delete')) {
        this.handleDeleteItem(event);
      } else if (event.target.classList.contains('item-title-display')) {
        DOM_CONTENTS.modalHeader.textContent = "Update Item";
        this.handleOpenUpdateForm(event);
      } else if (event.target.closest('.item-quick-info')) {
        this.handleCompleteOutsideModal(event);
      }
    });
  },

  handleResetDB() {
    COMMUNICATE.resetDatabase()
      .then(TODO_ITEMS_LOCAL.refreshAllItems)
      .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY))
      .then(() => {
        alert('Database successfully reset.');
      })
      .catch((err) => {
        alert(err);
      });
  },

  handleLoadSeed() {
    SEED_DATA.seedData.forEach(item => {
      COMMUNICATE.loadSeed(item)
        .then(TODO_ITEMS_LOCAL.refreshAllItems)
        .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY))
        .catch(err => {
          alert(err);
        });
    });
  },

  handleLogLocalState() {
    console.log(TODO_ITEMS_LOCAL.allItems);
  },

  handleRevealModalClick() {
    INPUT_FORM.update = false;
    DOM_CONTENTS.modalHeader.textContent = "Create New Item";
    DOM_CONTENTS.modalContainer.style.visibility = 'visible';
  },

  handleCloseModal() {
    DOM_CONTENTS.modalContainer.style.visibility = 'hidden';
    DOM_CONTENTS.modalForm.reset();
    DOM_CONTENTS.modalHeader.textContent = "Create New Item";
  },

  handleSidebarClicks(event) {
    if (event.target.tagName === "H1" || event.target.tagName === "DT") {
      let priorSelection = document.querySelector('.filter-selection');
      if (priorSelection) {
        priorSelection.classList.remove('filter-selection');
      }
      event.target.classList.add('filter-selection');
      if (event.target.tagName === "H1") {
        let filterSelection = event.target.textContent;
        if (filterSelection === "All Todos") {
          MAIN_DISPLAY.filterStatus = 'all';
          MAIN_DISPLAY.filterView();
        } else if (filterSelection === "Completed") {
          MAIN_DISPLAY.filterStatus = 'completed';
          MAIN_DISPLAY.filterView();
        }
      } else if (event.target.tagName === "DT") {
        MAIN_DISPLAY.filterStatus = 'detailed';
        MAIN_DISPLAY.filterList = event.target.dataset.list;
        MAIN_DISPLAY.filterYear = event.target.dataset.year;
        MAIN_DISPLAY.filterMonth = event.target.dataset.month;
        MAIN_DISPLAY.filterView();
      }
      MAIN_DISPLAY.updateTotalItemsDisplay();
    }
  },

  handleDeleteItem(event) {
    let confirmation = confirm('Are you sure you want to delete this item?');
    if (confirmation) {
      COMMUNICATE.deleteItem(event)
        .then(id => {
          alert(`Item with ID ${id} deleted.`);
        })
        .then(TODO_ITEMS_LOCAL.refreshAllItems)
        .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY))
        .catch(response => {
          alert(response);
        });
    }
  },

  handleModalInternalClicks(event) {
    console.log(this);
    console.log(event.currentTarget);
    event.preventDefault();
    if (event.target.getAttribute('id') === "save-item") {
      this.handleSaveItem();
    }
    if (event.target.getAttribute('id') === "complete-item") {
      this.handleCompleteItem();
    }
  },

  handleSaveItem() {
    if (DOM_CONTENTS.modalForm.querySelector('#title').validity.valueMissing) {
      alert('Title required.');
    } else if (DOM_CONTENTS.modalForm.querySelector('#title').validity.tooShort) {
      alert('Title must be at least 3 characters.');
    } else {
      // INPUT_FORM.update is toggled at various points to facilitate
      // either populating the form with previously existing data
      // or reseting the form for new data
      if (INPUT_FORM.update) {
        COMMUNICATE.updateItem(DOM_CONTENTS.modalForm)
          .then(TODO_ITEMS_LOCAL.refreshAllItems)
          .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY))
          .catch(function(error) {
            alert(error);
          });
        INPUT_FORM.update = false;
        DOM_CONTENTS.modalHeader.textContent = "Create New Item";
      } else {
        COMMUNICATE.saveItem(DOM_CONTENTS.modalForm)
          .then(TODO_ITEMS_LOCAL.refreshAllItems)
          .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY))
          .catch(function(error) {
            alert(error);
          });
      }
    }
  },

  // when I complete an item from within the modal
  // then next add item modifies the item with the previous id

  handleCompleteItem() {
    if (!(DOM_CONTENTS.modalHeader.textContent === "Create New Item")) {
      COMMUNICATE.completeItem(DOM_CONTENTS.modalForm)
        .then(TODO_ITEMS_LOCAL.refreshAllItems)
        .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY));
      DOM_CONTENTS.modalContainer.style.visibility = 'hidden';
    } else {
      alert('Cannot complete uncreated item.');
    }
  },

  handleOpenUpdateForm(event) {
    INPUT_FORM.update = true;
    INPUT_FORM.idToUpdate = event.target.parentElement.parentElement.parentElement.dataset.itemid;
    INPUT_FORM.populateUpdateForm();
    DOM_CONTENTS.modalContainer.style.visibility = 'visible';
  },

  handleCompleteOutsideModal(event) {
    INPUT_FORM.update = true;
    INPUT_FORM.idToUpdate = event.target.closest('.main-item-container').dataset.itemid;
    INPUT_FORM.populateUpdateForm();
    EVENT_MANAGER.toggleCompleteStatus();
  },

  toggleCompleteStatus() {
    if (!TODO_ITEMS_LOCAL.isItemComplete()) {
      COMMUNICATE.completeItem(DOM_CONTENTS.modalForm)
        .then(TODO_ITEMS_LOCAL.refreshAllItems)
        .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY));
      INPUT_FORM.update = false;
    } else {
      COMMUNICATE.uncompleteItem(DOM_CONTENTS.modalForm)
        .then(TODO_ITEMS_LOCAL.refreshAllItems)
        .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY));
      INPUT_FORM.update = false;
    }
  }
};