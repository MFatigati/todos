-- drop database todo-lists;
-- create database todo-lists;

DROP TABLE users CASCADE;
DROP TABLE todolists CASCADE;
DROP TABLE todos;

CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL
);

CREATE TABLE todolists (
  id serial PRIMARY KEY,
  title text UNIQUE NOT NULL,
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE
);

CREATE TABLE todos (
  id serial PRIMARY KEY,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  todolist_id integer NOT NULL REFERENCES todolists(id) ON DELETE CASCADE,
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE
);