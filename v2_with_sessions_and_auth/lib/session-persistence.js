const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");
const { sortTodos, sortTodoLists } = require("./sort");
const Todo = require("./todo");
const nextId = require('./next-id');

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists;
  }

  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 &&
            todoList.todos.every(todo => todo.done);
  }

  hasUndoneTodos(todoList) {
    return todoList.todos.length > 0 &&
      !todoList.todos.every(todo => todo.done);
  }

  sortedTodoLists() {
    let todoLists = deepCopy(this._todoLists);
    let undone = todoLists.filter(todoList => !this.isDoneTodoList(todoList));
    let done = todoLists.filter(todoList => this.isDoneTodoList(todoList));
    return sortTodoLists(undone, done);
  }

  // Find a todo list with the indicated ID. Returns `undefined` if not found.
// Note that `todoListId` must be numeric.
  loadTodoList(todoListId) {
  let desiredList = this._todoLists.find(todoList => todoList.id === todoListId);
  return deepCopy(desiredList);
  }

  loadTodo(todoListId, todoId) {
    let list = this.loadTodoList(todoListId);
    if (list) {
      let todo = list.todos.find(todo => todo.id === todoId);
      return todo;
    } else return undefined;
  }

  _loadActualList(todoListID) {
    let list = this._todoLists.find(list => list.id === todoListID);
    return list;
  }

  _loadActualTodo(todoListID, todoID) {
    let list = this._loadActualList(todoListID);
    let todo = list.todos.find(todo => todo.id === todoID);
    return todo;
  }

  toggle(todoListID, todoID) {
    let todo = this._loadActualTodo(todoListID, todoID);
    if (todo.done === true) {
      todo.done = false
    } else (todo.done = true);
  }

  sortedTodos(todoList) {
    // I chose to keep the sort logic primarily in the sort module, contra LS
    // pp 3: https://launchschool.com/lessons/8c75a08c/assignments/5455bc53
    return sortTodos(deepCopy(todoList));
  }

  deleteTodo(todoListID, todoID) {
    let list = this._loadActualList(todoListID);
    let idxToDelete = list.todos.findIndex(todo => todo.id === todoID);
    list.todos.splice(idxToDelete, 1);
    return true;
  }

  deleteList(todoListID) {
    let idxToDelete = this._todoLists.findIndex(list => list.id === todoListID);
    console.log(this._todoLists, idxToDelete);
    this._todoLists.splice(idxToDelete, 1);
    return true;
  }

  markAllDone(todoListID) {
    let list = this._loadActualList(todoListID);
    list.todos.forEach(todo => todo.done = true);
    return true;
  }

  addTodo(todoListID, title) {
    let list = this._loadActualList(todoListID);
    list.todos.push({
      id: nextId(),
      title: title,
      done: false,
    });
    return true;
  }

  setListTitle(todoListId, newTitle) {
    let list = this._loadActualList(todoListId);
    console.log(todoListId, list);
    list.title = newTitle;
    return true;
  }

  existsTodoListTitle(title) {
    return this._todoLists.some(todoList => todoList.title === title);
  }

  createNewList(title) {
    this._todoLists.push(
      {
        id: nextId(),
        title: title,
        todos: []
      }
    )
    return true;
  }
};