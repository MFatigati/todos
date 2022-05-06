import {DOM_CONTENTS} from './dom_contents.js';
import {TODO_ITEMS_LOCAL} from './todo_items_local.js';

export const SIDEBAR_DISPLAY = {
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
    });
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
    });
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
};