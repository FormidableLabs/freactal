import { injectState } from "../..";
import { default as React } from "react";

import addState from "./state";
import ChildComponent from "./child-component";


export const App = ({ rootProp, state, effects }) => {
  return (
    <div>
      <div>{ rootProp }</div>
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


export default addState(injectState(App));
