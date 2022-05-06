import {DOM_CONTENTS} from './dom_contents.js';
import {TODO_ITEMS_LOCAL} from './todo_items_local.js';

export const INPUT_FORM = {
  init() {
    this.START_YEAR = 2014;
    this.days = [...new Array(31)].map((_, idx) => idx + 1);
    this.months = [...new Array(12)].map((_, idx) => idx + 1);
    this.years = [...new Array(12)].map((_, idx) => idx + this.START_YEAR);
    this.update = false;
    this.idToUpdate = null;
  },

  populateUpdateForm() {
    let item = TODO_ITEMS_LOCAL.staticRetrieval(this.idToUpdate);
    DOM_CONTENTS.modalForm.elements.title.value = item.title;
    DOM_CONTENTS.modalForm.elements.description.value = item.description;

    if (item.day) {
      let dayOption = Number(item.day);
      DOM_CONTENTS.selectDays.querySelectorAll('option')[dayOption].selected = true;
    }
    if (item.month) {
      let monthOption = Number(item.month);
      DOM_CONTENTS.selectMonths.querySelectorAll('option')[monthOption].selected = true;
    }
    if (item.year) {
      let yearOption = Number(item.year) - this.START_YEAR + 1;
      DOM_CONTENTS.selectYears.querySelectorAll('option')[yearOption].selected = true;
    }
  },

  populateSelectList(arr, selectElem) {
    arr.forEach(value => {
      let newOption = document.createElement('option');
      newOption.text = value;
      selectElem.add(newOption);
    });
  },

  populateAllSelectLists() {
    this.populateSelectList(this.days, DOM_CONTENTS.selectDays);
    this.populateSelectList(this.months, DOM_CONTENTS.selectMonths);
    this.populateSelectList(this.years, DOM_CONTENTS.selectYears);
  },

  formDataToJson(formData) {
    const json = {};
    for (const pair of formData.entries()) {
      json[pair[0]] = pair[1];
    }
    this.removeEmptyProperties(json);
    this.padDaysMonths(json);
    return JSON.stringify(json);
  },

  removeEmptyProperties(nonJSONObject) {
    for (let prop in nonJSONObject) {
      if (nonJSONObject[prop] === "") {
        delete nonJSONObject[prop];
      }
    }
  },

  padDaysMonths(nonJSONObject) {
    for (let prop in nonJSONObject) {
      if (prop === 'day' || prop === 'month') {
        if (nonJSONObject[prop].length < 2) {
          nonJSONObject[prop] = `0${nonJSONObject[prop]}`;
        }
      }
    }
  }
};