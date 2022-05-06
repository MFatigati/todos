import {INPUT_FORM} from './input_form.js';
import {MAIN_DISPLAY} from './main_display.js';
import {COMMUNICATE} from './communicate.js';
import {SIDEBAR_DISPLAY} from './sidebar_display.js';

export const TODO_ITEMS_LOCAL = {
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
      .then(function(allItems) {
        TODO_ITEMS_LOCAL.allItems = allItems;
      })
      .then(TODO_ITEMS_LOCAL.sortByDoneStatus.bind(TODO_ITEMS_LOCAL))
      .then(MAIN_DISPLAY.updateTotalItemsDisplay)
      .then(TODO_ITEMS_LOCAL.updateAscendingSidebarValues.bind(TODO_ITEMS_LOCAL))
      .then(SIDEBAR_DISPLAY.refreshSidebar.bind(SIDEBAR_DISPLAY))
      .then(MAIN_DISPLAY.renderAllTodos.bind(MAIN_DISPLAY))
      .catch(function(error) {
        alert(error);
      });
  },

  staticRetrieval(itemID) {
    return TODO_ITEMS_LOCAL.allItems
      .filter(item => item.id === Number(itemID))[0];
  },

  isItemComplete() {
    let completed = false;
    this.allItems.forEach(item => {
      if (Number(INPUT_FORM.idToUpdate) === Number(item.id)
            && item.completed === true) {
        completed = true;
      }
    });
    return completed;
  },

  sortByDoneStatus() {
    this.allItems.sort((item1, item2) => {
      if (item1.completed === false) {
        return -1;
      } else if (item2.completed === false) {
        return 1;
      } else return 0;
    });
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
        this.completedByMonth[key] = this.completedByMonth[key] ?
          this.completedByMonth[key] += 1 : 1;
      }
    }, TODO_ITEMS_LOCAL);
  },

  sortAscending(obj) {
    let unsorted = Object.entries(obj);
    let sorted = unsorted.sort(((entryA, entryB) => {
      if (entryA[0] === "No Due Date") {
        return -1;
      } else if (entryB[0] === "No Due Date") {
        return 1;
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
    }));
    return sorted;
  },

  updateAscendingSidebarValues() {
    this.compileAllByMonth();
    this.compileCompletedByMonth();
    this.allByMonthAsc = this.sortAscending(this.allByMonth);
    this.completedByMonthAsc = this.sortAscending(this.completedByMonth);
  },

  updateCompletedCount() {
    this.completedCount = this.allItems.filter(item => item.completed === true).length;
  }
};