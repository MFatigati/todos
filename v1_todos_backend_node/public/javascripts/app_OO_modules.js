import {DOM_CONTENTS} from './modules/dom_contents.js';
import {INPUT_FORM} from './modules/input_form.js';
import {TODO_ITEMS_LOCAL} from './modules/todo_items_local.js';
import {MAIN_DISPLAY} from './modules/main_display.js';
import {EVENT_MANAGER} from './modules/event_manager.js';

document.addEventListener('DOMContentLoaded', () => {
  //DOM_CONTENTS.init();
  TODO_ITEMS_LOCAL.init();
  INPUT_FORM.init();
  INPUT_FORM.populateAllSelectLists();
  MAIN_DISPLAY.init();
  TODO_ITEMS_LOCAL.refreshAllItems();
  EVENT_MANAGER.init();
});