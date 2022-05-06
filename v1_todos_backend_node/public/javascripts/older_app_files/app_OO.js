import {DOM_CONTENTS} from './modules/dom_contents.js';
import {INPUT_FORM} from './modules/input_form.js'


const COMMUNICATE = {
  deleteItem(event) {
    return new Promise((resolve, reject) => {
      let idToDelete = event.target.parentElement.parentElement.dataset.itemid;
      let deleteItemReq = new XMLHttpRequest();
      deleteItemReq.open('DELETE', `/api/todos/${idToDelete}`);
      deleteItemReq.addEventListener('load', event => {
        if (deleteItemReq.status === 204) {
          resolve(idToDelete);
        } else if (deleteItemReq.status === 404) {
          reject(deleteItemReq.response);
        };
       });
      deleteItemReq.send();
    });
  },

  saveItem(form) {
    return new Promise((resolve, reject) => {
      let data = new FormData(form);
      data.append('completed', false);
      data = INPUT_FORM.formDataToJson(data);
      let saveItemReq = new XMLHttpRequest();
      saveItemReq.open('POST', '/api/todos');
      saveItemReq.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
      saveItemReq.addEventListener('load', event => {
        if (saveItemReq.status === 201) {
          let response = JSON.parse(saveItemReq.response);
          form.reset();
          resolve();
        } else if (saveItemReq.status === 400) {
          alert('Status 400: Todo cannot be saved.');
          reject();
        };
       });
      saveItemReq.send(data);
      DOM_CONTENTS.modalContainer.style.visibility = 'hidden';
    })
  },

  getAllItems() {
    return new Promise((resolve, reject) => {
      let getAllItemsReq = new XMLHttpRequest();
      getAllItemsReq.open('GET', '/api/todos');
      getAllItemsReq.addEventListener('load', event => {
        let response = JSON.parse(getAllItemsReq.response);
        if (getAllItemsReq.status === 200) {
          resolve(response);
        } else {
          alert(getAllItemsReq.response)
          reject();
        };
       });
      getAllItemsReq.send();
    })
  },

  updateItem(form, itemCompleted) {
    return new Promise((resolve, reject) => {
      let data = new FormData(form);
      if (itemCompleted) {
        data.set('completed', true);
      } else {
        data.set('completed', false);
      }
      data = INPUT_FORM.formDataToJson(data);
      let updateItemReq = new XMLHttpRequest();
      updateItemReq.open('PUT', `/api/todos/${INPUT_FORM.idToUpdate}`);
      updateItemReq.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
      updateItemReq.addEventListener('load', event => {
        if (updateItemReq.status === 200) {
          let response = JSON.parse(updateItemReq.response);
          form.reset();
          resolve();
        } else {
          if (updateItemReq.status === 400) {
            alert('Status 400: Invalid Input.');
          if (updateItemReq.status === 404) {
            alert('Status 404: The todo could not be found.');
          }
          reject();
        }
        };
       });
      updateItemReq.send(data);
      DOM_CONTENTS.modalContainer.style.visibility = 'hidden';
    })
  },

  completeItem(form) {
    return new Promise((resolve, reject) => {
      resolve(this.updateItem(form, true))
    });
  },

  uncompleteItem(form) {
    return new Promise((resolve, reject) => {
      resolve(this.updateItem(form, false))
    });
  }
}

const MAIN_DISPLAY = {
  init() {
    this.filterStatus = 'all';
    this.filterList = "";
    this.filterMonth = "";
    this.filterYear = "";
  },

  updateTotalItemsDisplay() {
    let currentItems = document.querySelectorAll('.main-item-container');
    let potentiallyVisible = currentItems.length;
    document.querySelectorAll('.main-item-container').forEach(item => {
      if (item.style.display === 'none') {
        potentiallyVisible -= 1;
      };
    })
    let actuallyVisible = potentiallyVisible;
    DOM_CONTENTS.totalItemsElem.textContent = actuallyVisible;
  },
  
  renderAllTodos() {
    let singleItemFunc = Handlebars.compile(DOM_CONTENTS.singleItemTempl);
    DOM_CONTENTS.mainList.textContent = "";
    TODO_ITEMS_LOCAL.allItems.forEach(item => {
      let dueDate;
      if (item.month && item.year) {
        dueDate = `${item.month}/${item.year.slice(2)}`
      }
      let newItem = singleItemFunc({
        id: item.id,
        title: item.title,
        due: dueDate ? dueDate : 'No due date',
        completed: item.completed
      });
      DOM_CONTENTS.mainList.insertAdjacentHTML('beforeend', newItem);
    })
    this.filterView();
  },

  filterView() {
    if (this.filterStatus === 'all') {
      this.filterShowAll();
    } else if (this.filterStatus === 'completed') {
      this.filterShowCompleted();
    } else if (this.filterStatus === 'detailed') {
      this.filterViewDetailed();
    }
    this.updateTotalItemsDisplay();
  },

  filterViewDetailed() {
    if (this.filterMonth && this.filterYear) {
      DOM_CONTENTS.mainHeader.textContent = `${this.filterMonth}/${this.filterYear}`;
    } else {
      DOM_CONTENTS.mainHeader.textContent = "No Due Date";
    }
    let filteredItems = TODO_ITEMS_LOCAL.allItems.slice();
    if (this.filterList === 'completed') {
      filteredItems = filteredItems.filter(item => item.completed === true);
    }
    filteredItems = filteredItems.filter(item => item.year.slice(2) === this.filterYear && item.month === this.filterMonth);
    let idsToShow = filteredItems.map(item => item.id);
    let currentItems = document.querySelectorAll('.main-item-container');
    currentItems.forEach(item => {
      if (idsToShow.includes(Number(item.dataset.itemid))) {
        item.style.display = 'grid';
      } else {
        item.style.display = 'none';
      }
    });
  },

  filterShowAll() {
    DOM_CONTENTS.mainHeader.textContent = "All Todos";
    let currentItems = document.querySelectorAll('.main-item-container');
    currentItems.forEach(item => {
      item.style.display = 'grid';
    });
  },

  filterShowCompleted() {
    DOM_CONTENTS.mainHeader.textContent = "Completed";
    let filteredItems = TODO_ITEMS_LOCAL.allItems.slice();
    filteredItems = filteredItems.filter(item => item.completed === true);
    let idsToShow = filteredItems.map(item => item.id);
    let currentItems = document.querySelectorAll('.main-item-container');
    currentItems.forEach(item => {
      if (idsToShow.includes(Number(item.dataset.itemid))) {
        item.style.display = 'grid';
      } else {
        item.style.display = 'none';
      }
    });
  }
}

const SIDEBAR_DISPLAY = {
  populateAllTodosSidebar() {
    let sidebarItemFunc = Handlebars.compile(DOM_CONTENTS.sidebarItemTempl);
    TODO_ITEMS_LOCAL.allByMonthAsc.forEach(item => {
      let sidebarItem = sidebarItemFunc({
        date: item[0],
        count: item[1]
      });
      DOM_CONTENTS.sidebarAllTodosList.insertAdjacentHTML('beforeend', sidebarItem);
      let nodes = DOM_CONTENTS.sidebarAllTodosList.querySelectorAll('dt');
      let currentDT = nodes[nodes.length - 1];
      currentDT.dataset.list = "all";
      if (item[0] === "No Due Date") {
        currentDT.dataset.month = "";
        currentDT.dataset.year = "";
      } else {
        currentDT.dataset.month = item[0].slice(0, 2);
        currentDT.dataset.year = item[0].slice(3);
      }
      //$(DOM_CONTENTS.sidebarAllTodosList).find('dt').last().data('date', `${item[0]}`);
    })
  },

  populateCompletedTodosSideBar() {
    let sidebarItemFunc = Handlebars.compile(DOM_CONTENTS.sidebarItemTempl);
    TODO_ITEMS_LOCAL.completedByMonthAsc.forEach(item => {
      let sidebarItem = sidebarItemFunc({
        date: item[0],
        count: item[1]
      });
      DOM_CONTENTS.sidebarCompletedTodosList.insertAdjacentHTML('beforeend', sidebarItem);
      let nodes = DOM_CONTENTS.sidebarCompletedTodosList.querySelectorAll('dt');
      let currentDT = nodes[nodes.length - 1];
      currentDT.dataset.list = "completed";
      if (item[0] === "No Due Date") {
        currentDT.dataset.month = "";
        currentDT.dataset.year = "";
      } else {
        currentDT.dataset.month = item[0].slice(0, 2);
        currentDT.dataset.year = item[0].slice(3);
      }
      //$(DOM_CONTENTS.sidebarCompletedDiv).find('dt').last().data('date', `${item[0]}`);
    })
  },

  updateSidebarTotals() {
    DOM_CONTENTS.sidebarAllCount.textContent = TODO_ITEMS_LOCAL.allItems.length;
    TODO_ITEMS_LOCAL.updateCompletedCount();
    DOM_CONTENTS.sidebarCompletedCount.textContent = TODO_ITEMS_LOCAL.completedCount;
  },

  refreshSidebar() {
    DOM_CONTENTS.sidebarAllTodosList.textContent = "";
    DOM_CONTENTS.sidebarCompletedTodosList.textContent = "";
    this.populateAllTodosSidebar();
    this.populateCompletedTodosSideBar();
    this.updateSidebarTotals();
  }
}

// Create separate arrays in the local store for
  // Number of todos by month
    // Use format  [[yy, mm, count], [yy, mm, count]]
  // Number of completed todos by month
    // if completed
    // Use format   [[yy, mm, count], [yy, mm, count]]
  // sort first by month, then by year
  // For each array, render in order
// Populate sidebar with relevant information
// Use data from sidebar to filter main display


const TODO_ITEMS_LOCAL = {
  init() {
    this.allItems = null;
    this.allByMonth = {};
    this.completedByMonth = {};
    this.allByMonthAsc = [];
    this.completedByMonthAsc = [];
    this.completedCount = 0;
  },

  refreshAllItems() {
    COMMUNICATE.getAllItems()
      .then(allItems => TODO_ITEMS_LOCAL.allItems = allItems)
      .then(TODO_ITEMS_LOCAL.sortByDoneStatus.bind(TODO_ITEMS_LOCAL))
      .then(MAIN_DISPLAY.updateTotalItemsDisplay)
      .then(TODO_ITEMS_LOCAL.updateAscendingSidebarValues.bind(TODO_ITEMS_LOCAL))
      .then(SIDEBAR_DISPLAY.refreshSidebar.bind(SIDEBAR_DISPLAY))
      .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY));
  },

  staticRetrieval(itemID) {
    return TODO_ITEMS_LOCAL.allItems.filter(item => item.id === Number(itemID))[0];
  },

  isItemComplete() {
    let completed = false;
    this.allItems.forEach(item => {
      if (Number(INPUT_FORM.idToUpdate) === Number(item.id) && item.completed === true) {
        completed = true;
      }
    })
    return completed;
  },

  sortByDoneStatus() {
    this.allItems.sort((item1, item2) => {
      if (item1.completed === false) {
        return -1
      } else if (item2.completed === false) {
        return 1
      } else return 0;
    })
  },

  itemExists(itemID) {
    return this.staticRetrieval(itemID);
  },

  compileAllByMonth() {
    this.allByMonth = {};
    this.allItems.forEach(item => {
      let key;
      if (item.month && item.year) {
        key = item.month + "/" + item.year.slice(2);
      } else {
        key = 'No Due Date';
      }
      this.allByMonth[key] = this.allByMonth[key] ? this.allByMonth[key] += 1 : 1;
    }, TODO_ITEMS_LOCAL);
  },

  compileCompletedByMonth() {
    this.completedByMonth = {};
    this.allItems.forEach(item => {
      let key;
      if (item.completed === true) {
        if (item.month && item.year) {
          key = item.month + "/" + item.year.slice(2);
        } else {
          key = 'No Due Date';
        }
        this.completedByMonth[key] = this.completedByMonth[key] ? this.completedByMonth[key] += 1 : 1;
      }
    }, TODO_ITEMS_LOCAL);
  },
  
  sortAscending(obj) {
    let unsorted = Object.entries(obj);
    let sorted = unsorted.sort(((entryA, entryB) => {
      if (entryA[0] === "No Due Date") {
        return -1
      } else if (entryB[0] === "No Due Date") {
        return 1
      } else {
        let yearA = entryA[0].slice(3);
        let monthA = entryA[0].slice(0, 2);
        let yearB = entryB[0].slice(3);
        let monthB = entryB[0].slice(0, 2);
        if (yearA === yearB) {
          if (monthA < monthB) {
            return -1;
          } else return 1;
        } else if (yearA < yearB) {
          return -1;
        } else return 1;
  
      }
    }))
    return sorted;
  },

  updateAscendingSidebarValues() {
    this.compileAllByMonth();
    this.compileCompletedByMonth();
    this.allByMonthAsc = this.sortAscending(this.allByMonth);
    this.completedByMonthAsc = this.sortAscending(this.completedByMonth);
  },

  updateCompletedCount() {
    this.completedCount = this.allItems.filter(item => item.completed === true).length
  }
}

const EVENT_MANAGER = {
  init() {
    DOM_CONTENTS.modalForm.addEventListener('click', this.handleModalClick);
    DOM_CONTENTS.revealModal.addEventListener('click', event => {
      DOM_CONTENTS.modalHeader.textContent = "Create New Item";
      DOM_CONTENTS.modalContainer.style.visibility = 'visible';
    });
    DOM_CONTENTS.modalBackground.addEventListener('click', event => {
      DOM_CONTENTS.modalContainer.style.visibility = 'hidden';
      DOM_CONTENTS.modalForm.reset();
      DOM_CONTENTS.modalHeader.textContent = "Create New Item";
    });
    DOM_CONTENTS.sidebarDiv.addEventListener('click', this.handeSidebarClick);
    this.delegatedListening();
  },

  delegatedListening() {
    document.addEventListener('click', event => {
      if (event.target.classList.contains('delete')) {
        this.handleDeleteItem(event)
      } else if (event.target.classList.contains('item-title-display')) {
        DOM_CONTENTS.modalHeader.textContent = "Update Item";
        this.handleUpdateItem(event);
      } else if (event.target.closest('.item-quick-info')) {
        this.handleCompleteOutsideModal(event);
      } else if (event.target.getAttribute('id') === 'log-local') {
        console.log(TODO_ITEMS_LOCAL.allItems);
      }
    });
  },

  handeSidebarClick(event) {
    if (event.target.tagName === "H1" || event.target.tagName === "DT") {
      let priorSelection = document.querySelector('.filter-selection');
      if (priorSelection) {
        priorSelection.classList.remove('filter-selection');
      };
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
      MAIN_DISPLAY.updateTotalItemsDisplay()
    }
  },

  handleDeleteItem(event) {
    let confirmation = confirm('Are you sure you want to delete this item?');
    if (confirmation) {
      COMMUNICATE.deleteItem(event)
        .then(id => {
          alert(`Item with ID ${id} deleted.`)
        })
        .then(TODO_ITEMS_LOCAL.refreshAllItems)
        .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY))
        .catch(response => {
          alert(response);
        });
    }
  },

  handleModalClick(event) {
      event.preventDefault();
      if (event.target.getAttribute('id') === "save-item") {
        // if INPUT_FORM.update is not set to false prior to a click
        // in the modal, the app will update whatever was previously in the system,
        // rather than saving something new
        if (INPUT_FORM.update) {
          COMMUNICATE.updateItem(DOM_CONTENTS.modalForm)
            .then(TODO_ITEMS_LOCAL.refreshAllItems)
            .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY));
          INPUT_FORM.update = false;
          DOM_CONTENTS.modalHeader.textContent = "Create New Item";
        } else {
          COMMUNICATE.saveItem(DOM_CONTENTS.modalForm)
            .then(TODO_ITEMS_LOCAL.refreshAllItems)
            .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY));
        }
      }
      if (event.target.getAttribute('id') === "complete-item") {
        if (!(DOM_CONTENTS.modalHeader.textContent === "Create New Item")) {
          COMMUNICATE.completeItem(DOM_CONTENTS.modalForm)
            .then(TODO_ITEMS_LOCAL.refreshAllItems)
            .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY));
          DOM_CONTENTS.modalContainer.style.visibility = 'hidden';
        } else {
          alert('Cannot complete uncreated item.');
        }

      }
  },

  handleUpdateItem(event) {
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
        .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY))
      INPUT_FORM.update = false;
    } else {
      COMMUNICATE.uncompleteItem(DOM_CONTENTS.modalForm)
        .then(TODO_ITEMS_LOCAL.refreshAllItems)
        .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY))
      INPUT_FORM.update = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  DOM_CONTENTS.init();
  TODO_ITEMS_LOCAL.init();
  INPUT_FORM.init();
  INPUT_FORM.populateAllSelectLists();
  MAIN_DISPLAY.init();
  TODO_ITEMS_LOCAL.refreshAllItems();
  EVENT_MANAGER.init();
})

