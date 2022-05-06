export class DOM_CONTENTS {
  //init() {
    static modalContainer = document.getElementById('input-modal-container');
    static modalForm = this.modalContainer.querySelector('form');
    static selectDays = document.getElementById('due-date');
    static selectMonths = document.getElementById('due-month');
    static selectYears = document.getElementById('due-year');
    static totalItemsElem = document.getElementById('total-items');
    static singleItemTempl = document.getElementById('single-item-template').innerHTML;
    static mainList = document.getElementById('all-todos-list');
    static revealModal = document.getElementById('reveal-input-modal');
    static modalBackground = document.getElementById('input-modal-background');
    static modalHeader = document.querySelector('#input-modal-dialogue > h1');
    static sidebarItemTempl = document.getElementById('sidebar-item-template').innerHTML;
    static sidebarAllTodosList = document.querySelectorAll('dl')[0];
    static sidebarCompletedTodosList = document.querySelectorAll('dl')[1];
    static sidebarAllCount = document.querySelector('#sidebar > div:nth-child(1) > span');
    static sidebarCompletedCount = document.querySelector('#sidebar > div:nth-child(2) > span');
    static sidebarDiv = document.getElementById('sidebar');
    static sidebarAllDiv = document.getElementById('sidebar-all');
    static sidebarCompletedDiv = document.getElementById('sidebar-completed');
    static mainHeader = document.querySelector('#main > div:nth-child(1) > h1');
    static logStateButton = document.getElementById('log-local');
    static loadSeedButton = document.getElementById('load-seed');
    static resetDB = document.getElementById('reset-database');
  //}
};