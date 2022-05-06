const Todo = require("./todo");
// const { Client } = require("pg");
const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class pgPersistence {
  constructor(session) {
    this.username = session.username;
  }
  // WHERE username = $1
  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 &&
            todoList.todos.every(todo => todo.done);
  }

  async hasUndoneTodos(todoList) {
    const SELECT_UNDONE =
      "SELECT * FROM todos" +
      " WHERE todolist_id = $1 AND done = false";
    
    let result = await dbQuery(SELECT_UNDONE, todoList.id);
    return result.rowCount > 0;
  }

  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists WHERE username = $1 ORDER BY lower(title) ASC";
    const FIND_TODOS = "SELECT * FROM todos WHERE username = $1";

    let resultTodoLists = dbQuery(ALL_TODOLISTS, this.username);
    let resultTodos = dbQuery(FIND_TODOS, this.username);
    let resultBoth = await Promise.all([resultTodoLists, resultTodos]);

    let allTodoLists = resultBoth[0].rows;
    let allTodos = resultBoth[1].rows;
    if (!allTodoLists || !allTodos) return undefined;

    allTodoLists.forEach(todoList => {
      todoList.todos = allTodos.filter(todo => {
        return todoList.id === todo.todolist_id;
      });
    });

    return this._partitionTodoLists(allTodoLists);
  }

  // does not access db, not asyn
  _partitionTodoLists(todoLists) {
    let undone = [];
    let done = [];

    todoLists.forEach(todoList => {
      if (this.isDoneTodoList(todoList)) {
        done.push(todoList);
      } else {
        undone.push(todoList);
      }
    });

    return undone.concat(done);
  }

  // Find a todo list with the indicated ID. Returns `undefined` if not found.
// Note that `todoListId` must be numeric.
  async loadTodoList(todoListId) {
    const FIND_LIST = "SELECT * FROM todolists WHERE id = $1";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1";

    let list = await dbQuery(FIND_LIST, todoListId);
    list = list.rows[0];

    let todos = await this.sortedTodos(list);   
    list.todos = todos;

    return list;
  }

  async sortedTodos(todoList) {
    // return array of todo objects, sorted first by done/undone, then alpha asc

    const FIND_TODOS_SORTED =
    "SELECT * FROM todos WHERE todolist_id = $1 ORDER BY done ASC, lower(title) ASC";
    let todos = await dbQuery(FIND_TODOS_SORTED, todoList.id);
    return todos.rows;
  }

  async loadTodo(todoListId, todoId) {
    const FIND_TODO =
    "SELECT * FROM todos WHERE todolist_id = $1 AND id = $2";

    let result = await dbQuery(FIND_TODO, todoListId, todoId);
    return result.rows[0];
  }

  async toggleDoneStatus(todoListID, todoID) {
    const TOGGLE_DONE =
      "UPDATE todos SET done = NOT done" +
      "  WHERE todolist_id = $1 AND id = $2";

    let result = await dbQuery(TOGGLE_DONE, todoListID, todoID);
    return result.rowCount > 0;
  }

  async deleteTodo(todoListID, todoID) {
    const DELETE_TODO =
    "DELETE FROM todos" +
    " WHERE todolist_id = $1 AND id = $2";

    let result = await dbQuery(DELETE_TODO, todoListID, todoID);
    return result.rowCount > 0;
  }

  async deleteList(todoListID) {
    const DELETE_LIST =
    "DELETE FROM todolists WHERE id = $1";

    let result = await dbQuery(DELETE_LIST, todoListID);
    return result.rowCount > 0;
  }

  async markAllDone(todoListID) {
    const MARK_ALL_DONE = "UPDATE todos SET done = TRUE"
    + " WHERE todolist_id = $1"; 

    let result = await dbQuery(MARK_ALL_DONE, todoListID);
    return result.rowCount > 0;
  }

  async addTodo(todoListID, title) {

    let ADD_TODO = "INSERT INTO todos (title, todolist_id, username)"
    + "VALUES ($1, $2, $3)"

    let result = await dbQuery(ADD_TODO, title, todoListID, this.username);
    return result.rowCount > 0;
  }

  async setListTitle(todoListId, newTitle) {
    const SET_TITLE = "UPDATE todolists SET title = $1 WHERE id = $2";

    let result = await dbQuery(SET_TITLE, newTitle, todoListId);
    return result.rowCount > 0;
  }

  async existsTodoListTitle(title) {
    const FIND_TODOLIST = "SELECT null FROM todolists" +
                          "  WHERE title = $1 AND username = $2";

    let result = await dbQuery(FIND_TODOLIST, title, this.username);
    return result.rowCount > 0;
  }

  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  // right now we can't create the same title between users... that seems wrong
  // i.e., two users can't have lists with the same names
  async createNewList(title) {
    let CREATE_NEW_LIST = "INSERT INTO todolists (title, username) VALUES ($1, $2)";

    try {
      let result = await dbQuery(CREATE_NEW_LIST, title, this.username);
      return result.rowCount > 0;
    } catch (err) {
      if (this.isUniqueConstraintViolation(err)) return false;
      throw error;
    }
  }

  async checkCredentials(username, password) {
    const FIND_HASHED_PW = "SELECT password FROM USERS" +
      " WHERE username = $1";
    
    let result = await dbQuery(FIND_HASHED_PW, username);
    if (result.rowCount === 0) return false;

    // compares a hashed version `password` to the second argument
    return bcrypt.compare(password, result.rows[0].password);
  }
};