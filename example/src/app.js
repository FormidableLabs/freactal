import { contextTypes } from "../..";
import { default as React } from "react";

import addState from "./state";


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


export default addState(App);
