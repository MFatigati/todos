const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
// const TodoList = require("./lib/todolist");
// const Todo = require("./lib/todo");
// const { sortTodos } = require("./lib/sort");
const store = require("connect-loki");
// const SeedData = require("./lib/seed-data"); // Temporary code!
const pgPersistence = require('./lib/pg-persistence');
const catchError = require("./lib/catch-error");

const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session);

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LokiStore({}),
}));

app.use(flash());

// // Set up persistent session data
// app.use((req, res, next) => {
//   // req.session.todoLists = SeedData; // Temporary code!
//   let todoLists = [];
//   if ("todoLists" in req.session) {
//     req.session.todoLists.forEach(todoList => {
//       todoLists.push(TodoList.makeTodoList(todoList));
//     });
//   }

//   req.session.todoLists = todoLists;
//   next();
// });

// create a new datastore
app.use((req, res, next) => {
  // passing data from the request to the module, modifying it as necessary
  // then passing it along to the res.locals.store object to be used below 
 res.locals.store = new pgPersistence(req.session);
 next();
})

// Extract session info
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

const requiresAuthentication = (req, res, next) => {
  if (!res.locals.signedIn) {
    console.log("Unauthorized.");
    res.redirect(302, "/users/signin");
  } else {
    next();
  }
};

// Redirect start page
app.get("/", (req, res) => {
  res.redirect("/lists");
});

// Render the list of todo lists
app.get("/lists", requiresAuthentication, catchError(
  async (req, res) => {
    let store = res.locals.store;
    let todoLists = await store.sortedTodoLists();
  
    let todosInfo = todoLists.map(todoList => ({
      countAllTodos: todoList.todos.length,
      countDoneTodos: todoList.todos.filter(todo => todo.done).length,
      isDone: store.isDoneTodoList(todoList)
    }))
  
    res.render("lists", {
      todoLists,
      todosInfo
    });
  })
);

// Render new todo list page
app.get("/lists/new", requiresAuthentication, (req, res) => {
  res.render("new-list");
});

// Render individual todo list and its todos
app.get("/lists/:todoListId", requiresAuthentication, catchError(
  async (req, res, next) => {
    let todoListId = req.params.todoListId;
    let store = res.locals.store;
    let todoList = await store.loadTodoList(+todoListId);
    if (todoList === undefined) {
      next(new Error("Not found."));
    } else {
      res.render("list", {
        todoList: todoList,
        todos: todoList.todos,
        // todos: res.locals.store.sortedTodos(todoList),
        countAllTodos: todoList.todos.length,
        isDone: store.isDoneTodoList(todoList),
        hasUndoneTodos: await store.hasUndoneTodos(todoList)
      });
    }
  })
);

// Render edit todo list form
app.get("/lists/:todoListId/edit", requiresAuthentication, catchError(
  async (req, res, next) => {
    let todoListId = req.params.todoListId;
    let todoList = await res.locals.store.loadTodoList(+todoListId);
    if (!todoList) {
      next(new Error("Not found."));
    } else {
      res.render("edit-list", { todoList });
    }
  })
);

app.get("/users/signin", (req, res, next) => {
  req.flash("info", "Please sign in.");
  res.render("signin", {
    flash: req.flash()
  });
});

app.post("/users/signin", catchError(
  async (req, res, next) => {
    let username = req.body.username.trim();
    let password = req.body.password;
   
    let successfulLogin = await res.locals.store.checkCredentials(username, password);
   
    if (successfulLogin) {
      req.flash("success", "Welcome!");
      req.session.username = username;
      req.session.signedIn = true;
      res.redirect("/lists");
    } else {
     req.flash("failed", "Invalid credentials.");
     res.render("signin", {
       flash: req.flash(),
       username
     });
    }
   })
);

app.post("/users/signout", (req, res, next) => {
 delete req.session.username;
 delete req.session.signedIn;
 res.redirect("/users/signin");
});

// CURRENT
// Create a new todo list
app.post("/lists", requiresAuthentication,
  [
    body("todoListTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters.")
      // .custom((title, { req }) => {
      //   let todoLists = req.session.todoLists;
      //   let duplicate = todoLists.find(list => list.title === title);
      //   return duplicate === undefined;
      // })
      // .withMessage("List title must be unique."),
  ],

  catchError(
    async (req, res) => {
      function rerenderNewListPage() {
        res.render("new-list", {
          flash: req.flash(),
          todoListTitle: req.body.todoListTitle,
        });
      }
      let newTitle = req.body.todoListTitle;
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        rerenderNewListPage();
      } else {
        let created = await res.locals.store.createNewList(newTitle);
        if (!created) {
          req.flash("error", "The list title must be unique");
          rerenderNewListPage();
        } else {
          req.flash("success", "The todo list has been created.");
          res.redirect("/lists");
        }
      }   
    }
  )
  
);

// Toggle completion status of a todo
app.post("/lists/:todoListId/todos/:todoId/toggle", requiresAuthentication, catchError(
  async (req, res) => {
    let { todoListId, todoId } = { ...req.params };
    let toggled = await res.locals.store.toggleDoneStatus(+todoListId, +todoId);
    if (!toggled) throw new Error("Not found.");
    
    let todo = await res.locals.store.loadTodo(+todoListId, +todoId);
    let title = todo.title;
    if (todo.done) {
      req.flash("success", `"${title}" marked as NOT done!`);
    } else {
      req.flash("success", `"${title}" marked done.`);
    }
    res.redirect(`/lists/${todoListId}`);
  })
);

// Delete a todo
app.post("/lists/:todoListId/todos/:todoId/destroy",
  requiresAuthentication,
  catchError(
  async (req, res) => {
    let { todoListId, todoId } = { ...req.params };
    let deleted = await res.locals.store.deleteTodo(+todoListId, +todoId);

    if (!deleted) throw new Error("Not found.");

    req.flash("success", "The todo has been deleted.");
    res.redirect(`/lists/${todoListId}`);
  }
));

// Mark all todos as done
app.post("/lists/:todoListId/complete_all", requiresAuthentication, catchError(
  async (req, res, next) => {
    let todoListId = req.params.todoListId;
    let allCompleted = await res.locals.store.markAllDone(+todoListId);
  
    if (!allCompleted) throw new Error("Not found.");
  
    req.flash("success", "All todos have been marked as done.");
    res.redirect(`/lists/${todoListId}`);
  })
);

// Create a new todo and add it to the specified list
app.post("/lists/:todoListId/todos", requiresAuthentication,
  [
    body("todoTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The todo title is required.")
      .isLength({ max: 100 })
      .withMessage("Todo title must be between 1 and 100 characters."),
  ],

  catchError(
    async (req, res, next) => {
      let todoListId = req.params.todoListId;
      let newTodoTitle = req.body.todoTitle;

      let errors = validationResult(req);
        if (!errors.isEmpty()) {
          errors.array().forEach(message => req.flash("error", message.msg));
  
          res.render("list", {
            flash: req.flash(),
            todoList: todoList,
            todos: res.locals.store.sortedTodos(todoList),
            countAllTodos: todoList.todos.length,
            isDone: res.locals.store.isDoneTodoList(todoList),
            hasUndoneTodos: res.locals.store.hasUndoneTodos(todoList)
          });
        } else {
          let newTodoCreated = await res.locals.store.addTodo(+todoListId, newTodoTitle)
          if (!newTodoCreated) throw new Error("Not found.");
          req.flash("success", "The todo has been created.");
          res.redirect(`/lists/${todoListId}`);
        }
    }
  )
);

// Delete todo list
app.post("/lists/:todoListID/destroy", requiresAuthentication, catchError(
  async (req, res, next) => {
    let todoListID = req.params.todoListID;
  
    let listDeleted = await res.locals.store.deleteList(+todoListID);
    if (!listDeleted) throw new Error("Not found.");
  
    req.flash("success", "Todo list deleted.");
    res.redirect("/lists");
  })
);

// Edit todo list title
app.post("/lists/:todoListId/edit",
  requiresAuthentication,
  [
    body("todoListTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters.")
      // .custom((title, { req }) => {
      //   let todoLists = req.session.todoLists;
      //   let duplicate = todoLists.find(list => list.title === title);
      //   return duplicate === undefined;
      // })
      // .withMessage("List title must be unique."),
  ],

  catchError(
    async (req, res, next) => {
      let store = res.locals.store;
      let todoListId = req.params.todoListId;
      let todoList = await res.locals.store.loadTodoList(+todoListId);
      let newTitle = req.body.todoListTitle;
  
      const rerenderEditList = () => {
        if (!todoList) {
          next(new Error("Not found."));
        } else {
          res.render("edit-list", {
            flash: req.flash(),
            todoListTitle: newTitle,
            todoList: todoList,
          });
        }
      }

      try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
          errors.array().forEach(message => req.flash("error", message.msg));
          rerenderEditList();
        } else if (await store.existsTodoListTitle(newTitle)) {
          req.flash("error", "This list title must be unique");
          rerenderEditList();
        } else {
          let titleUpdated = await store.setListTitle(+todoListId, newTitle);
          if (!titleUpdated) throw new Error("List not found.");
  
          req.flash("success", "Todo list updated.");
          res.redirect(`/lists/${todoListId}`);
          }
        } catch (err) {
          if (store.isUniqueConstraintViolation(error)) {
            req.flash("error", "The list title must be unique.");
            rerenderEditList();
          } else {
            throw error;
          }
      }
    },
  )
);

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});
