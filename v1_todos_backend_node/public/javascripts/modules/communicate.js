import {DOM_CONTENTS} from './dom_contents.js';
import {INPUT_FORM} from './input_form.js';

export const COMMUNICATE = {
  deleteItem(event) {
    return new Promise((resolve, reject) => {
      let idToDelete = event.target.parentElement.parentElement.parentElement.dataset.itemid;
      let deleteItemReq = new XMLHttpRequest();
      deleteItemReq.open('DELETE', `/api/todos/${idToDelete}`);
      deleteItemReq.addEventListener('load', () => {
        if (deleteItemReq.status === 204) {
          resolve(idToDelete);
        } else if (deleteItemReq.status === 404) {
          reject(deleteItemReq.response);
        }
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
      saveItemReq.addEventListener('load', () => {
        if (saveItemReq.status === 201) {
          form.reset();
          resolve();
        } else if (saveItemReq.status === 400) {
          reject(saveItemReq.response);
        }
      });
      saveItemReq.send(data);
      DOM_CONTENTS.modalContainer.style.visibility = 'hidden';
    });
  },

  getAllItems() {
    return new Promise((resolve, reject) => {
      let getAllItemsReq = new XMLHttpRequest();
      getAllItemsReq.open('GET', '/api/todos');
      getAllItemsReq.addEventListener('load', () => {
        let response = JSON.parse(getAllItemsReq.response);
        if (getAllItemsReq.status === 200) {
          resolve(response);
        } else {
          reject(response);
        }
      });
      getAllItemsReq.send();
    });
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
      updateItemReq.addEventListener('load', () => {
        if (updateItemReq.status === 200) {
          let response = JSON.parse(updateItemReq.response);
          form.reset();
          resolve(response);
        } else if (updateItemReq.status === 400) {
          reject(new Error('Status 400: Invalid Input.'));
          if (updateItemReq.status === 404) {
            reject(new Error('Status 404: The todo could not be found.'));
          }
        }
      });
      updateItemReq.send(data);
      DOM_CONTENTS.modalContainer.style.visibility = 'hidden';
    });
  },

  completeItem(form) {
    return new Promise((resolve) => {
      resolve(this.updateItem(form, true));
    });
  },

  uncompleteItem(form) {
    return new Promise((resolve) => {
      resolve(this.updateItem(form, false));
    });
  },

  resetDatabase() {
    return new Promise((resolve, reject) => {
      let resetReq = new XMLHttpRequest();
      resetReq.open('GET', '/api/reset');
      resetReq.addEventListener('load', () => {
        if (resetReq.status === 200) {
          resolve();
        } else {
          reject(new Error());
        }
      });
      resetReq.send();
    });
  },

  loadSeed(item) {
    return new Promise((resolve, reject) => {
      let data = JSON.stringify(item);
      let postSeedReq = new XMLHttpRequest();
      postSeedReq.open('POST', 'api/todos');
      postSeedReq.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
      postSeedReq.addEventListener('load', () => {
        if (postSeedReq.status === 201) {
          resolve();
        } else if (postSeedReq.status === 400) {
          reject(new Error ('Seed data submission failed.'));
        }
      });
      postSeedReq.send(data);
    });
  }
};