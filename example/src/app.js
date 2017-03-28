import { contextTypes } from "../..";
import { default as React } from "react";

import addState from "./state";
import ChildComponent from "./child-component";


export const App = (props, { state, effects }) => {
  return (
    <div>
      <div>{ props.rootProp }</div>
      <div>{ state.todosInfo }</div>
      <button onClick={() => effects.fetchTodos("https://jsonplaceholder.typicode.com/todos")}>
        Click me to fetch!
      </button>
      <div>
        And here's the child:
        <ChildComponent />
      </div>
    </div>
  );
};

App.contextTypes = contextTypes;


export default addState(App);
