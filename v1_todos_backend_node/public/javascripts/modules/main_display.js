import {DOM_CONTENTS} from './dom_contents.js';
import {TODO_ITEMS_LOCAL} from './todo_items_local.js';

export const MAIN_DISPLAY = {
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
      }
    });
    let actuallyVisible = potentiallyVisible;
    DOM_CONTENTS.totalItemsElem.textContent = actuallyVisible;
  },

  renderAllTodos() {
    let singleItemFunc = Handlebars.compile(DOM_CONTENTS.singleItemTempl);
    DOM_CONTENTS.mainList.textContent = "";
    TODO_ITEMS_LOCAL.allItems.forEach(item => {
      let dueDate;
      if (item.month && item.year) {
        dueDate = `${item.month}/${item.year.slice(2)}`;
      }
      let newItem = singleItemFunc({
        id: item.id,
        title: item.title,
        due: dueDate ? dueDate : 'No due date',
        completed: item.completed
      });
      DOM_CONTENTS.mainList.insertAdjacentHTML('beforeend', newItem);
      this.strikethroughIfCompleted(item);
    });
    this.filterView();
  },

  strikethroughIfCompleted(newItem) {
    let allItems = DOM_CONTENTS.mainList.querySelectorAll('.item-quick-info');
    let currentItem = allItems[allItems.length - 1];
    if (newItem.completed) {
      currentItem.querySelector('div').style.textDecoration = "line-through";
    }
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
    filteredItems = filteredItems.filter(item => item.year.slice(2) ===
      this.filterYear && item.month === this.filterMonth);
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
};