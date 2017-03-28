# fr(e)actal

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
import { Component } from 'preact';

import { myEffect } from './effects';

// ... <MyComponent /> is defined here

const addState = withState(Component)({
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
const addState = withState(Component)({
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

Although it's normally inadvisable, this is actually a reasonable place to mutate the state object directly (i.e. `Object.assign(state, { myNew: "value" }).  This way you don't have to proxy the getters, and you leave all the computed values working in place.


## Waiting on effects

**TODO**

```javascript
import { StatefulComponent } from './stateful';
import { renderFullPage } from './render-full-page';

function handleRender(req, res) {
  StatefulComponent
    .awaitEffects({ /* ...props */ })
    .then((vdom, state) => ({ html: renderToString(vdom), state}))
    .then(({ html, state}) => renderFullPage(html, state))
    .then(res.send.bind(res));
}
```

Maybe hook into `rapscallion`'s SSR mechanism that can wait for a particular component before rendering.  This will depend on
