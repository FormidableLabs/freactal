# fr(e)actal

`freactal` is a Flux-like-but-not-flux state-management library for React.  It concerves principles of unidirectional flow of data, but embraces some friendlier patterns borrowed from Vue.js, MobX and others.  From your stack, it can replace `redux`, `reselect`, `redux-loop`, `[fill-in-the-blank sub-app composition technique]` and potentially `recompose` (depending on how you're using it) with what is hopefully a simpler and clearer abstraction.

Here are some of the pain-points it addresses and features it brings to the table:

- It eschews boilerplate, which makes it easier to co-locate related pieces of code.
- It does not use a singleton for state, instead allowing you to augment your application with state wherever it makes the most sense.
- Seeing as this ^^^ is the case, it becomes easy to compose multiple "apps" together in a straightforward way - in fact, it's just as straightforward as anything else you'd build.  Ultimately, this allows you to retain the React philosophy of "these are just components and you can compose them however you'd like".
- It obviates the need for libraries like `reselect` through its introduction of computed state values.
- It is easy to access state wherever you are in the component tree (including parent state), without having to `connect`.
- Middleware is dead simple.
- SSR and client-side state hydration are also both dead simple.
- Components and state can easily be tested in isolation.


## Example: Counter

Here `freactal` is used to make a simple incremental counter:

```javascript
import React from "react";
import { contextTypes, withState } from "freactal";

// state and effects are sent in the context of App, not the props
const App = (props, { state, effects }) => (
  <div>
    <h1>{state.value}</h1>
    <button onClick={() => effects.add(1)}>+1</button>
    <button onClick={() => effects.add(10)}>+10</button>
    <button onClick={() => effects.reset()}>reset</button>
  </div>
);

// add freactal's contextTypes, so App can get state and effects from the context
App.contextTypes = contextTypes;

const addState = withState({
  // each effect returns a reducer function which produces a new state
  effects: {
    reset: (effects) => state => Object.assign({}, state, { value: 0 }),  
    add: (effects, amount) => state => Object.assign({}, state, { value: state.value + amount }),
  },
  initialState: () => ({ value: 0 }),
});

// finally, we add the `freactal` state and effects to our App component
export default addState(App);
```

## Effects

Effects are functions that return a promise.  They accept two or more arguments, where the first two arguments are the same for every effect.  Here's what an effect looks like:

```javascript
export const myEffect = (
    // One effect can trigger another, to represent intermediate states or
    // to decompose complex behaviors.
    trigger,
    // The effect may take any number of additional arguments.
    ...args
) => {
  // An effect must return a promise.
  return fetch("http://url.url/url", {
    method: "POST",
    body: JSON.stringify(arg)
  // The promise must resolve to a function that returns a new state.
  }).then(result => (state, parentState) =>
    Object.assign({}, state, { inputValue: result })
  );
}
```

Don't let the last piece of the example slip you by - every effect is terminated by a reducer function, i.e. a function that transforms old state into new state.


## Triggering an Effect

Your effects will be grafted onto a particular component subtree by a state higher-order-component.  More on that in a section below.  First, let's look at how you might trigger an effect from a leaf-node component.

```const exampleComponent = (props, { state, effects }) => {
  const onChange = ev => effects.myEffect(ev.target.value);

  return (
    <input onChange={onChange}>
      {state.inputValue}
    </input>
  );
};
```


## State HOC

```javascript
import { withState } from 'freactal';
import { Component } from 'react';

import { myEffect } from './effects';

// ... <MyComponent /> is defined here

const addState = withState({
  effects: { myEffect },
  initialState: () => ({ inputValue: "" }),
  computed: {
    // Computed values are calculated on the first `get` and are cached.
    // Cached values are invalidated when their dependencies change.
    inputValueType: ({ inputValue }) => typeof inputValue,
    // Computed values can depend on other computed values.
    inputValueWithType: ({ inputValue, inputValueType }) => `${inputValueType}: ${inputValue}`
  }
});

export default addState(MyComponent);
```

Computed values are cached to avoid unnecessary work.  When their dependencies change, the cached computations are invalidated and are recomputed the next time they're accessed.  For example, `inputValue` is a dependency of `inputValueType` in the example above, and its cached value would be invalidated as soon as `inputValue` changed.


## Middleware

Freactal supports a simple middleware interface.

When calling `withState` to create your stateful wrapper, you can pass in a `middleware` property.  The corresponding value should be an array of functions.  Each function accepts a single object argument of shape `{ state, effects }` and returns an object of the same shape.

These middleware functions can add properties to the `state`, generate new computed properties, wrap effect functions, etc.

Here's an example:

```javascript
const addState = withState({
  effects: { ... },
  initialState: () => ({ ... }),
  computed: { ... },
  middleware: [
    ({ state, effects }) => ({
      state,
      effects: {
        ...effects,
        log: msg => console.log(msg)
      }
    })
  ]
});
```

In this example, the middleware does nothing to transform the state.  But it does add an extra function to the effects collection: `log`.

When transforming state, keep in mind that any computed values of the object are implemented with a ES5 getter.  This means you should not `Object.assign({}, state, { myNew: "value" })`.  If you do this, `Object.assign` will read the values from the original state object inside your middleware function and they won't be computed at run-time.

Although it's normally inadvisable, this is actually a reasonable place to mutate the state object directly (i.e. `Object.assign(state, { myNew: "value" })`.  This way you don't have to proxy the getters, and you leave all the computed values working in place.


## Waiting on effects during SSR

If you're server-side rendering and want to 1) trigger effects, and 2) wait for them to transform your state before rendering, the following pattern will be of use to you:


```javascript
import { initialize } from "freactal/server";

import { StatefulRootComponent } from './stateful';
import { renderFullPage } from './render-full-page';

function handleRender(req, res) {
  const statefulComponent = new StatefulRootComponent(props, context);

  initialize(<StatefulRootComponent />).then(({ vdom, state }) => {
    const html = renderToString(vdom);
    const fullHTML = renderFullPage(html, state);
    res.send(fullHTML);
  });
}
```

... and then in your client bootstrap code:

```javascript
// stateful.js

import { hydrate } from "freactal";

const addState = withState({
  effects: { ... },
  initialState: IS_BROWSER ?
    hydrate(getSsrStateJsonFromDom()) :
    () => ({ ... }),
  computed: { ... },
  middleware: [ ... ]
});

export const StatefulRootComponent = addState(StatelessRootComponent);

// bootstrap.js

import { render } from "react-dom";
import { StatefulRootComponent } from './stateful';
render(<StatefulRootComponent />, document.querySelector("#app"));
```
