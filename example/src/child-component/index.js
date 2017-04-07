import { withState, injectState } from "../../..";
import { default as React } from "react";

import * as effectDefs from "./effects";
import initialState from "./initial-state";
import computed from "./computed";

export const addState = withState({ effects: effectDefs, initialState, computed });

export const ChildComponent = ({ state, effects }) => (
  <div>
    <div>This is a subcomponent, with its own state!</div>
    <div>{`Here is a local value '${state.localValue}' and its computed length '${state.localValueLength}'`}</div>
    <div>
      <div>{`It can access parent state and effects too (!): ${state.todosLength}`}</div>
      <button onClick={() => effects.fetchTodos("https://jsonplaceholder.typicode.com/todos")}>
        Click me to fetch from inside the child!
      </button>
    </div>
  </div>
);

export default addState(injectState(ChildComponent));
