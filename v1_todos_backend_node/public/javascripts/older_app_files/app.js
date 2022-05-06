const START_YEAR = 2014;
let days = [...new Array(31)].map((elem, idx) => idx + 1);
let months = [...new Array(12)].map((elem, idx) => idx + 1);
let years = [...new Array(12)].map((elem, idx) => idx + START_YEAR);
let update = false;
let idToUpdate;

function formDataToJson(formData) {
  const json = {};
  for (const pair of formData.entries()){ 
    json[pair[0]] = pair[1];
  }
  removeEmptyProperties(json);
  padDaysMonths(json);
  return JSON.stringify(json);
}

function removeEmptyProperties(nonJSONObject) {
  for (let prop in nonJSONObject) {
    if (nonJSONObject[prop] === "") {
      delete nonJSONObject[prop];
    }
  }
}

function padDaysMonths(nonJSONObject) {
  for (let prop in nonJSONObject) {
    if (prop === 'day' || prop === 'month') {
      if (nonJSONObject[prop].length < 2) {
        nonJSONObject[prop] = `0${nonJSONObject[prop]}`;
      }
    }
  }
}

function populateSelectList(arr, selectElem) {
  arr.forEach(value => {
    let newOption = document.createElement('option');
    newOption.text = value;
    selectElem.add(newOption);
  })
}

function saveItem(form) {
  let modalContainer = document.getElementById('input-modal-container');
  return new Promise((resolve, reject) => {
    let data = new FormData(form);
    data.append('completed', false);
    data = formDataToJson(data);
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
    modalContainer.style.visibility = 'hidden';
  })
}

function updateItem(form) {
  let modalContainer = document.getElementById('input-modal-container');
  return new Promise((resolve, reject) => {
    let data = new FormData(form);
    data.append('completed', false);
    data = formDataToJson(data);
    let updateItemReq = new XMLHttpRequest();
    updateItemReq.open('PUT', `/api/todos/${idToUpdate}`);
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
    modalContainer.style.visibility = 'hidden';
  })
}

function refreshAllItems() {
  return new Promise((resolve, reject) => {
    let getAllItemsReq = new XMLHttpRequest();
    getAllItemsReq.open('GET', '/api/todos');
    getAllItemsReq.addEventListener('load', event => {
      let response = JSON.parse(getAllItemsReq.response);
      if (getAllItemsReq.status === 200) {
        allItems = response;
        resolve();
      } else {
        alert(getAllItemsReq.response)
        reject();
      };
     });
    getAllItemsReq.send();
  })
}

function updateTotalItemsDisplay() {
  let totalItemsElem = document.getElementById('total-items');
  totalItemsElem.textContent = allItems.length;
}

function renderAllTodos() {
  let singleItemTempl = document.getElementById('single-item-template').innerHTML;
  let singleItemFunc = Handlebars.compile(singleItemTempl);
  let list = document.getElementById('all-todos-list');
  list.textContent = "";
  allItems.forEach(item => {
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
    list.insertAdjacentHTML('beforeend', newItem);
  })
}

function populateAllSelectLists() {
  let selectDays = document.getElementById('due-date');
  let selectMonths = document.getElementById('due-month');
  let selectYears = document.getElementById('due-year');

  populateSelectList(days, selectDays);
  populateSelectList(months, selectMonths);
  populateSelectList(years, selectYears);
}

function handleDeleteItem(event) {
  let confirmation = confirm('Are you sure you want to delete this item?');
  if (confirmation) {
    return new Promise((resolve, reject) => {
      idToDelete = event.target.parentElement.dataset.itemid;
      let deleteItemReq = new XMLHttpRequest();
      deleteItemReq.open('DELETE', `/api/todos/${idToDelete}`);
      deleteItemReq.addEventListener('load', event => {
        if (deleteItemReq.status === 204) {
          alert(`Item with ID ${idToDelete} deleted.`)
          resolve();
        } else if (deleteItemReq.status === 404) {
          alert(deleteItemReq.response);
          reject();
        };
       });
      deleteItemReq.send();
    })
  }
}



const INPUT_FORM = {
  populateUpdateForm() {
    let modalContainer = document.getElementById('input-modal-container');
    let modalForm = modalContainer.querySelector('form');
    let item = staticRetrieval(idToUpdate);
    modalForm.elements.title.value = item.title;
    modalForm.elements.description.value = item.description;
    
    let selectDays = document.getElementById('due-date');
    let selectMonths = document.getElementById('due-month');
    let selectYears = document.getElementById('due-year');
    if (item.day) {
      let dayOption = Number(item.day);
      selectDays.querySelectorAll('option')[dayOption].selected = true;
    }
    if (item.month) {
      let monthOption = Number(item.month);
      selectMonths.querySelectorAll('option')[monthOption].selected = true;
    }
    if (item.year) {
      let yearOption = Number(item.year) - START_YEAR + 1;
      selectYears.querySelectorAll('option')[yearOption].selected = true;
    }
  }
};

const EVENT_MANAGER = {

}

const MAIN_DISPLAY = {

}

const SIDEBAR_DISPLAY = {

}

const TODO_ITEMS = {
  init() {
    this.allItems = null;
  },

  staticRetrieval(itemID) {
    return allItems.filter(item => item.id === Number(itemID))[0];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  let revealModal = document.getElementById('reveal-input-modal');
  let modalContainer = document.getElementById('input-modal-container');
  let modalBackground = document.getElementById('input-modal-background');
  let saveItemButton = document.getElementById('save-item');
  let modalForm = modalContainer.querySelector('form');


  populateAllSelectLists();
  refreshAllItems().then(updateTotalItemsDisplay).then(renderAllTodos);

  revealModal.addEventListener('click', event => {
    modalContainer.style.visibility = 'visible';
  });

  modalBackground.addEventListener('click', event => {
    modalContainer.style.visibility = 'hidden';
    modalForm.reset();
  })

  modalForm.addEventListener('click', event => {
    event.preventDefault();
    if (event.target.getAttribute('id') === "save-item") {
      if (update) {
        updateItem(modalForm)
          .then(refreshAllItems)
          .then(updateTotalItemsDisplay)
          .then(renderAllTodos);;
        update = false;
      } else {
        saveItem(modalForm)
        .then(refreshAllItems)
        .then(updateTotalItemsDisplay)
        .then(renderAllTodos);
      }
    }
    if (event.target.getAttribute('id') === "complete-item") {
      console.log('complete');
      modalContainer.style.visibility = 'hidden';
    }
  })

  document.addEventListener('click', event => {
    if (event.target.getAttribute('id') === 'delete') {
      handleDeleteItem(event)
      .then(refreshAllItems)
      .then(updateTotalItemsDisplay)
      .then(renderAllTodos);
    }

    if (event.target.getAttribute('id') === 'item-title-display') {
      update = true;
      idToUpdate = event.target.parentElement.dataset.itemid;
      populateUpdateForm();
      modalContainer.style.visibility = 'visible';
    }
  });
})