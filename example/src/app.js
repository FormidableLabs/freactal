import { withState, contextTypes } from "../..";
import { default as React } from "react";

import * as effects from "./effects";


export const App = (props, { state, effects }) => {
  return (
    <div>
      <div>{ state.todosInfo }</div>
      <button onClick={() => effects.fetchTodos("https://jsonplaceholder.typicode.com/todos")}>
        Click me to fetch!
      </button>
    </div>
  );
};

App.contextTypes = contextTypes;

export const addState = withState({
  effects,
  initialState: () => ({
    pending: false,
    todos: null
  }),
  computed: {
    todosType: ({ todos }) => typeof todos,
    todosLength: ({ todos }) => todos && todos.length,
    todosInfo: ({ todosType, todosLength, pending }) =>
      pending ?
        `waiting on the data...` :
        `got a response of type '${todosType}' of length: ${todosLength}`
  }
});

export default addState(App);
