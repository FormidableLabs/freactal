# fr(e)actal

[![CircleCI](https://circleci.com/gh/FormidableLabs/freactal.svg?style=svg)](https://circleci.com/gh/FormidableLabs/freactal)

`freactal` is a composable state management library for React.

The library grew from the idea that state should be just as flexible as your React code; the state containers you build with `freactal` are just components, and you can compose them however you'd like.  In this way, it attempts to address the often exponential relationship between application size and complexity in growing projects.

Like Flux and React in general, `freactal` builds on the principle of unidirectional flow of data.  However, it does so in a way that feels idiomatic to ES2015+ and doesn't get in your way.

When building an application, it can replace [`redux`](https://redux.js.org), [`MobX`](https://mobx.js.org), [`reselect`](https://github.com/reactjs/reselect), [`redux-loop`](https://github.com/redux-loop/redux-loop), [`redux-thunk`](https://github.com/gaearon/redux-thunk), [`redux-saga`](https://github.com/redux-saga/redux-saga), `[fill-in-the-blank sub-app composition technique]`, and potentially [`recompose`](https://github.com/acdlite/recompose), depending on how you're using it.

Its design philosophy aligns closely with the [Zen of Python](https://www.python.org/dev/peps/pep-0020/):

```
Beautiful is better than ugly.
Explicit is better than implicit.
Simple is better than complex.
Complex is better than complicated.
Flat is better than nested.
Sparse is better than dense.
Readability counts.
```

<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


## Submitting Bugs

If you encounter an issue with freactal, please [look to see](https://github.com/FormidableLabs/freactal/issues) if the issue has already been reported.  If it has not, please [open a new issue](https://github.com/FormidableLabs/freactal/issues/new).  

When submitting a bug report, make sure to include a repro.  The best way to do this, is to fork the [freactal-sketch sandbox](https://codesandbox.io/s/github/divmain/freactal-sketch/tree/master/), modify it so that the bug is observable, and include a link in your bug report.


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


## Table of Contents

- [Guide](#guide)
  - [Containing state](#containing-state)
  - [Accessing state from a child component](#accessing-state-from-a-child-component)
  - [Transforming state](#transforming-state)
  - [Transforming state (cont.)](#transforming-state-cont)
  - [Intermediate state](#intermediate-state)
  - [Effect arguments](#effect-arguments)
  - [Computed state values](#computed-state-values)
  - [Composing multiple state containers](#composing-multiple-state-containers)
  - [Testing](#testing)
    - [Stateless functional components](#stateless-functional-components)
    - [State and effects](#state-and-effects)
  - [Conclusion](#conclusion)
- [API Documentation](#api-documentation)
  - [`provideState`](#providestate)
    - [`initialState`](#initialstate)
    - [`effects`](#effects)
      - [`initialize`](#initialize)
    - [`computed`](#computed)
    - [`middleware`](#middleware)
  - [`injectState`](#injectstate)
  - [`hydrate` and `initialize`](#hydrate-and-initialize)
- [Helper functions](#helper-functions)
  - [`update`](#update)
  - ['mergeIntoState'](#mergeintostate)
- [Server-side Rendering](#server-side-rendering)
  - [with `React#renderToString`](#with-reactrendertostring)
  - [with Rapscallion](#with-rapscallion)
  - [Hydrate state on the client](#hydrate-state-on-the-client)


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


## Guide

This guide is intended to get you familiar with the `freactal` way of doing things.  If you're looking for something specific, take a look at the [API Documentation](#api-documentation).  If you're just starting out with `freactal`, read on!


### Containing state

Most state management solutions for React put all state in one place.  `freactal` doesn't suffer from that constraint, but it is a good place to start.  So let's see what that might look like.

```javascript
import { provideState } from "freactal";

const wrapComponentWithState = provideState({
  initialState: () => ({ counter: 0 })
});
```

In the above example, we define a new state container type using `provideState`, and provide it an argument.  You can think about the arguments passed to `provideState` as the schema for your state container; we'll get more familiar with the other possible arguments later in the guide.

The `initialState` function is invoked whenever the component that it is wrapping is instantiated.  But so far, our state container is not wrapping anything, so let's expand our example a bit.

```javascript
import React, { Component } from "react";
import { render } from "react-dom";

const Parent = ({ state }) => (
  <div>
    { `Our counter is at: ${state.counter}` }
  </div>
);

render(<Parent />, document.getElementById("root"));
```

That's a _very_ basic React app.  Let's see what it looks like to add some very basic state to that application.

```javascript
import React, { Component } from "react";
import { render } from "react-dom";
import { provideState } from "freactal";

const wrapComponentWithState = provideState({
  initialState: () => ({ counter: 0 })
});

const Parent = wrapComponentWithState(({ state }) => (
  <div>
    { `Our counter is at: ${state.counter}` }
  </div>
));

render(<Parent />, document.getElementById("root"));
```

Alright, we're getting close.  But we're missing one important piece: `injectState`.

Like `provideState`, `injectState` is a component wrapper.  It links your application component with the state that it has access to.

It may not be readily apparent to you why `injectState` is necessary, so let's make it clear what each `freactal` function is doing.  With `provideState`, you define a state template that can then be applied to any component.  Once applied, that component will act as a "headquarters" for a piece of state and the effects that transform it (more on that later).  If you had a reason, the same template could be applied to multiple components, and they'd each have their own state based on the template you defined.

But that only _tracks_ state.  It doesn't make that state accessible to the developer.  That's what `injectState` is for.

In early versions of `freactal`, the state was directly accessible to the component that `provideState` wrapped.  However, that meant that whenever a state change occurred, the entire tree would need to re-render.  `injectState` intelligently tracks the pieces of state that you actually access, and a re-render only occurs when _those_ pieces of state undergo a change.

Alright, so let's finalize our example with all the pieces in play.

```javascript
import React, { Component } from "react";
import { render } from "react-dom";
import { provideState, injectState } from "freactal";

const wrapComponentWithState = provideState({
  initialState: () => ({ counter: 0 })
});

const Parent = wrapComponentWithState(injectState(({ state }) => (
  <div>
    { `Our counter is at: ${state.counter}` }
  </div>
)));

render(<Parent />, document.getElementById("root"));
```

That'll work just fine!


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


### Accessing state from a child component

As was mentioned above, the `provideState`-wrapped component isn't really the one that provides access to state.  That's `injectState`'s job.  So what would stop you from injecting state into a child component that isn't containing state itself?  The answer is nothing!

Let's modify the example so that we're injecting state into a child component.

```javascript
import React, { Component } from "react";
import { render } from "react-dom";
import { provideState, injectState } from "freactal";


const Child = injectState(({ state }) => (
  <div>
    { `Our counter is at: ${state.counter}` }
  </div>
));

const wrapComponentWithState = provideState({
  initialState: () => ({ counter: 0 })
});

const Parent = wrapComponentWithState(({ state }) => (
  <Child />
));


render(<Parent />, document.getElementById("root"));
```

Let's review what's going on here.

1. Using `provideState`, we define a state-container template intended to store a single piece of state: the `counter`.
2. That template is applied to the `Parent` component.
3. When the `Parent` is rendered, we see that it references a `Child` component.
4. That `Child` component is wrapped with `injectState`.
5. Because `Child` is contained within the subtree where `Parent` is the root node, it has access to the `Parent` component's state.

We could insert another component at the end, and `injectState` into the `GrandChild` component, and it would work the same.


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


### Transforming state

Alright, so we know how to setup state containers, give them an initial state, and consume that state from child components.  But all of this is not very useful if state is never updated.  That's where effects come in.

Effects are the one and only way to change `freactal` state in your application.  These effects are defined as part of your state container template when calling `provideState`, and they can be invoked from anywhere that state has been injected (with `injectState`).

Let's take a look at that first part.

```javascript
const wrapComponentWithState = provideState({
  initialState: () => ({ counter: 0 }),
  effects: {
    addOne: () => state => Object.assign({}, state, { counter: state.counter + 1 })
  }
});
```

You might be wondering why we have that extra `() =>` right before `state =>` in the `addOne` definition.  That'll be explained in the next section - for now, let's look at all the other pieces.

In the above example, we've defined an effect that, when invoked, will update the `counter` in our state container by adding `1`.

Since updating an element of state based on previous state (and potentially new information) is something you'll be doing often, `freactal` [provides a shorthand](#update) to make this a bit more readable:

```javascript
const wrapComponentWithState = provideState({
  initialState: () => ({ counter: 0 }),
  effects: {
    addOne: update(state => ({ counter: state.counter + 1 }))
  }
});
```

Now let's look at how you might trigger this effect:

```javascript
const Child = injectState(({ state, effects }) => (
  <div>
    { `Our counter is at: ${state.counter}` }
    <button onClick={effects.addOne}>Add one</button>
  </div>
));
```

Wherever your `<Child />` is in your application, the state and effects it references will be accessible, so long as the state container is somewhere further up in the tree.

<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


### Transforming state (cont.)

If you've used Redux, effects are roughly comparable to an action-reducer pair, with a couple of important differences.

The first of those differences relates to asychronicity.  Under the hood, `freactal` relies heavily on `Promise`s to schedule state updates.  In fact, the following effects are all functionally equivalent:

```javascript
addOne: () => state => Object.assign({}, state, { counter: state.counter + 1 })
/* vs */
addOne: () => Promise.resolve(state => Object.assign({}, state, { counter: state.counter + 1 }))
/* vs */
addOne: () => new Promise(resolve => resolve(state => Object.assign({}, state, { counter: state.counter + 1 })))
```

To put it explicitly, the value you provide for each key in your `effects` object is:

1. A function that takes in some arguments (we'll cover those shortly) and returns...
2. A promise that resolves to...
3. A function that takes in state and returns...
4. The updated state.

Step 2 can optionally be omitted, since `freactal` wraps these values in `Promise.resolve`.

For most developers, this pattern is probably the least familiar of those that `freactal` relies upon.  But it allows for some powerful and expressive state transitions with basically no boilerplate.

For example, any number of things can occur between the time that an effect is invoked and the time that the state is updated.  These "things" might include doing calculations, or talking to an API, or integrating with some other JS library.

So, you might define the following effect:

```javascript
updatePosts: () => fetch("/api/posts")
  .then(result => result.json())
  .then(({ posts }) => state => Object.assign({}, state, { posts }))
```

In other words, any action that your application might take, that ultimately _could_ result in a state change can be simply expressed as an effect.  Not only that, but this pattern also allows for effects and UI components to be tested with clean separation.

And, perhaps most importantly, this pattern allows for intermediate state.


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


### Intermediate state

So far, we haven't see any arguments to the first, outer-most function in our effect definitions.  In simple scenarios, this outer-function may seem unnecessary, as in the illustration above.

But what about cases where you want state to be updated part-way through an operation?  You _could_ put all this logic in your UI code, and invoke effects from there multiple times.  But that's not ideal for a number of reasons:

1. A single effect might be invoked from multiple places in your application.
2. The code that influences how state might be transformed is now living in multiple places.
3. It is much harder to test.

Fundamentally, the problem is that this pattern violates the principle of separation of concerns.

So, what's the alternative?

Well, we've already defined an effect as a function that, when invoked, will resolve to another function that transforms state.  Why couldn't we re-use this pattern to represent this "part-way" (or intermediate) state?  The answer is: nothing is stopping us!

The first argument passed to an effect in the outer function is the same `effects` object that is exposed to components where state has been injected.  And these effects can be invoked in the same way.  Even more importantly, because effects always resolve to a `Promise`, we can wait for an intermediate state transition to complete before continuing with our original state transition.

That might be a lot to take in, so let's look at an example:

```javascript
const wrapComponentWithState = provideState({
  initialState: () => ({
    posts: null,
    postsPending: false
  }),
  effects: {
    setPostsPending: update((state, postsPending) => ({ postsPending })),
    getPosts: effects => effects.setPostsPending(true)
      .then(() => fetch("/api/posts"))
      .then(result => result.json())
      .then(({ posts }) => effects.setPostsPending(false).then(() => posts))
      .then(posts => state => Object.assign({}, state, { posts }))
  }
});
```

There's a lot going on there, so let's go through it piece by piece.

- The initial state is set with two keys, `posts` and `postsPending`.
  + `posts` will eventually contain an array of blog posts or something like that.
  + `postsPending` is a flag that, when `true`, indicates that we are currently fetching the `posts`.
- Two `effects` are defined.
  + `setPostsPending` sets the `postsPending` flag to either `true` or `false`.
  + `getPosts` does a number of things:
    * It invokes `setPostsPending`, setting the pending flag to `true`.
    * It waits for the `setPostsPending` effect to complete before continuing.
    * It fetches some data from an API.
    * It parses that data into JSON.
    * It invokes `setPostsPending` with a value of `false`, and waits for it to complete.
    * It resolves to a function that updates the `posts` state value.

In the above example, `setPostsPending` has a synchronous-like behavior - it immediately resolves to a state update function.  But it could just as easily do something asynchronous, like make an AJAX call or interact with the IndexedDB API.

And because all of this is just `Promise` composition, you can put together helper functions that give consistency to intermediate state updates.  Here's an example:

```javascript
const wrapWithPending = (pendingKey, cb) => effects  =>
  effects.setFlag(pendingKey, true)
    .then(cb)
    .then(value => effects.setFlag(pendingKey, false).then(() => value));
```

Which could be consumed like so:

```javascript
const wrapComponentWithState = provideState({
  initialState: () => ({
    posts: null,
    postsPending: false
  }),
  effects: {
    setFlag: update((state, key, value) => ({ [key]: value })),
    getPosts: wrapWithPending("postsPending", () => fetch("/api/posts")
      .then(result => result.json())
      .then(({ posts }) => state => Object.assign({}, state, { posts }))
    )
  }
});
```


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


### Effect arguments

But what if you want to update state with some value that you captured from the user?  In Redux parlance: what about action payloads?

If you were looking closely, you may have noticed we already did something like that when we invoked `setPostsPending`.

Whether you are invoking an effect from your UI code or from another effect, you can pass arguments directly with the invocation.  Those arguments will show up after the `effects` argument in your effect definition.

Here's an example:

```javascript
const wrapComponentWithState = provideState({
  initialState: () => ({ thing: "val" }),
  effects: {
    setThing: (effects, newVal) => state => Object.assign({}, state, { thing: newVal })
  }
});
```

And it could invoked from your component like so:

```javascript
const Child = injectState(({ state, effects }) => {
  const onClick = () => effects.setThing("new val");
  return (
    <div>
      { `Our "thing" value is: ${state.thing}` }
      <button onClick={onClick}>Click here to change the thing!</button>
    </div>
  );
});
```


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


### Computed state values

As an application grows, it becomes increasingly important to have effective organizational tools.  This is especially true for how you store and transform data.

Consider the following state container:

```javascript
const wrapComponentWithState = provideState({
  initialState: () => ({
    givenName: "Walter",
    familyName: "Harriman"
  }),
  effects: {
    setGivenName: update((state, val) => ({ givenName: val })),
    setFamilyName: update((state, val) => ({ familyName: val }))
  }
});
```

Let's say that we're implementing a component and we want to display the user's full name.  We might write that component like this:

```javascript
const WelcomeMessage = injectState(({ state }) => {
  const fullName = `${state.givenName} ${state.familyName}`;
  return (
    <div>
      {`Hi, ${fullName}, and welcome!`}
    </div>
  );
});
```

That seems like a pretty reasonable piece of code.  But, even for a small piece of data like a full name, things can get more complex as the application grows.

What if we're displaying that full name in multiple components?  Should we compute it in all those places, or maybe inject state further up the tree and pass it down as a prop?  That can get messy to the point where you're passing down dozens of props.

What if the user is in a non-English locale, where they may not place given names before family names?  We would have to remember to do that everywhere.

And what if we want to derive another value off of the generated `fullName` value?  What about multiple derived values, derived from other derived values?  What if we're not dealing with names, but more complex data structures instead?

`freactal`'s answer to this is computed values.

You've probably run into something like this before.  Vue.js has computed properties.  MobX has computed values.  Redux outsources this concern to libraries like `reselect`.  Ultimately, they all serve the same function: exposing compound values to the UI based on simple state values.

Here's how you define computed values in `freactal`, throwing in some of the added complexities we mentioned:

```javascript
const wrapComponentWithState = provideState({
  initialState: () => ({
    givenName: "Walter",
    familyName: "Harriman",
    locale: "en-us"
  }),
  effects: {
    setGivenName: update((state, val) => ({ givenName: val })),
    setFamilyName: update((state, val) => ({ familyName: val }))
  },
  computed: {
    fullName: ({ givenName, familyName, locale }) => startsWith(locale, "en") ?
      `${givenName} ${familyName}` :
      `${familyName} ${givenName}`,
    greeting: ({ fullName, locale }) => startsWith(locale, "en") ?
      `Hi, ${fullName}, and welcome!` :
      `Helló ${fullName}, és szívesen!`
  }
});
```

_**Note:** This is not a replacement for a proper internationalization solution like `react-intl`, and is for illustration purposes only._

Here we see two computed values, `fullName` and `greeting`.  They both rely on the `locale` state value, and `greeting` actually relies upon `fullName`, whereas `fullName` relies on the given and family names.

How might that be consumed?

```javascript
const WelcomeMessage = injectState(({ state }) => (
  <div>
    {state.greeting}
  </div>
));
```

In another component, we might want to just use the `fullName` value:

```javascript
const Elsewhere = injectState(({ state }) => (
  <div>
    {`Are you sure you want to do that, ${state.fullName}?`}
  </div>
));
```

Hopefully you can see that this can be a powerful tool to help you keep your code organized and readable.

Here are a handful of other things that will be nice for you to know.

- Computed values are generated _lazily_.  This means that if the `greeting` value above is never accessed, it will never be computed.
- Computed values are _cached_.  Once a computed value is calculated once, a second state retrieval will return the cached value.
- Cached values are _invalidated_ when dependencies change.  If you were to trigger the `setGivenName` effect with a new name, the `fullName` and `greeting` values would be recomputed as soon as React re-rendered the UI.

That's all you need to know to use computed values effectively!


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


### Composing multiple state containers

We started this guide by noting that, while most React state libraries contain state in a single place, `freactal` approaches things differently.

Before we dive into how that works, let's briefly consider some of the issues that arise with the centralized approach to state management:

- Oftentimes, it is hard to know how to organize state-related code.  Definitions for events or actions live separately from the UI that triggers them, which lives separately from functions that reduce those events into state, which also live separately from code that transforms state into more complex values.
- While React components are re-usable ([see](http://www.material-ui.com/) [component](http://elemental-ui.com/) [libraries](https://github.com/brillout/awesome-react-components)), complex stateful components are a hard nut to crack.  There's this fuzzy line when addressing complexity in your own code that, when crossed, means you should be using a state library vs React's own `setState`.  But how do you make that work DRY across applications and team boundaries?
- Sometimes you might want to compose full SPAs together in various ways, but if they need to interact on the page or share state in some way, how do you go about accomplishing this?  The results here are almost universally ad-hoc.
- It is an often arduous process when it comes time to refactor your application and move state-dependant components into different parts of your application.  Wiring everything up can be tedious as hell.

These are constraints that `freactal` aims to address.  Let's take a look at a minimal example:

```javascript
const Child = injectState(({ state }) => (
  <div>
    This is the Child.
    {state.fromParent}
    {state.fromGrandParent}
  </div>
));

const Parent = provideState({
  initialState: () => ({ fromParent: "ParentValue" })
})(() => (
  <div>
    This is the Parent.
    <Child />
  </div>
));

const GrandParent = provideState({
  initialState: () => ({ fromGrandParent: "GrandParentValue" })
})(() => (
  <div>
    This is the GrandParent.
    <Parent />
  </div>
));
```

Its important to notice here that `Child` was able to access state values from both its `Parent` and its `GrandParent`.  All state keys will be accessible from the `Child`, unless there is a key conflict between `Parent` and `GrandParent` (in which case `Parent` "wins").

This pattern allows you to co-locate your code by feature, rather than by function.  In other words, if you're rolling out a new feature for your application, all of that new code - UI, state, effects, etc - can go in one place, rather than scattered across your code-base.

Because of this, refactoring becomes easier.  Want to move a component to a different part of your application?  Just move the directory and update the import from the parents.  What if this component accesses parent state?  If that parent is still an ancestor, you don't have to change a thing.  If it's not, moving that state to a more appropriate place should be part of the refactor anyway.

But one word of warning: accessing parent state can be powerful, and very useful, but it also necessarily couples the child state to the parent state.  While the coupling is a "loose" coupling, it still may introduce complexity that should be carefully thought-out.

One more thing.

Child effects can also trigger parent effects.  Let's say your UX team has indicated that, whenever an API call is in flight, a global spinner should be shown.  But maybe the data is only needed in certain parts of the application.  In this scenario, you could define `beginApiCall` and `completeApiCall` effects that track how many API calls are active.  If above `0`, you show a spinner.  These effects can be accessed by call-specific effects further down in the state hierarchy, like so:

```javascript
const Child = injectState(({ state, effects }) => (
  <div>
    This is the Child.
    {state.fromParent}
    {state.fromGrandParent}
    <button
      onClick={() => effects.changeBothStates("newValue")}
    >
      Click me!
    </button>
  </div>
));

const Parent = provideState({
  initialState: () => ({ fromParent: "ParentValue" }),
  effects: {
    changeParentState: (effects, fromParent) => state =>
      Object.assign({}, state, { fromParent }),
    changeBothStates: (effects, value) =>
      effects.changeGrandParentState(value).then(state =>
        Object.assign({}, state, { fromParent: value })
      )
  }
})(() => (
  <div>
    This is the Parent.
    <Child />
  </div>
));

const GrandParent = provideState({
  initialState: () => ({ fromGrandParent: "GrandParentValue" }),
  effects: {
    changeGrandParentState: (effects, fromGrandParent) => state =>
      Object.assign({}, state, { fromGrandParent })
  }
})(() => (
  <div>
    This is the GrandParent.
    <Parent />
  </div>
));
```


## Testing

Before wrapping up, let's take a look at one additional benefit that `freactal` brings to the table: the ease of test-writing.

If you hadn't noticed already, all of the examples we've looked at in this guide have relied upon [stateless functional components](https://hackernoon.com/react-stateless-functional-components-nine-wins-you-might-have-overlooked-997b0d933dbc).  This is no coincidence - from the beginning, a primary goal of `freactal` was to encapsulate _all_ state in `freactal` state containers.  That means you shouldn't need to use React's `setState` at all.

**Here's the bottom line:** because _all_ state can be contained within `freactal` state containers, the rest of your application components can be ["dumb components"](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0).

This approach allows you to test your state and your components completely independent from one another.

Let's take a look at a simplified example from above, and then dive into how you might test this application.  For the purposes of this example, I assume you're using Mocha, Chai, Sinon, sinon-chai, and Enzyme.

First, our application code:

```javascript
/*** app.js ***/

import { wrapComponentWithState } from "./state";


export const App = ({ state, effects }) => {
  const { givenName, familyName, fullName, greeting } = state;
  const { setGivenName, setFamilyName } = effects;

  const onChangeGiven = ev => setGivenName(ev.target.value);
  const onChangeFamily = ev => setFamilyName(ev.target.value);

  return (
    <div>
      <div id="greeting">
        { greeting }
      </div>
      <div>
        <label for="given">Enter your given name</label>
        <input id="given" onChange={onChangeGiven} value={givenName}/>
        <label for="family">Enter your family name</label>
        <input id="family" onChange={onChangeFamily} value={familyName}/>
      </div>
    </div>
  );
};

/* Notice that we're exporting both the unwrapped and the state-wrapped component... */
export default wrapComponentWithState(App);
```

And then our state template:

```javascript
/*** state.js ***/

import { provideState, update } from "freactal";

export const wrapComponentWithState = provideState({
  initialState: () => ({
    givenName: "Walter",
    familyName: "Harriman"
  }),
  effects: {
    setGivenName: update((state, val) => ({ givenName: val })),
    setFamilyName: update((state, val) => ({ familyName: val }))
  },
  computed: {
    fullName: ({ givenName, familyName }) => `${givenName} ${familyName}`,
    greeting: ({ fullName }) => `Hi, ${fullName}, and welcome!`
  }
});
```

Next, let's add a few tests!


### Stateless functional components

Remember, our goal here is to test state and UI in isolation.  Read through the following example to see how you might make assertions about 1) data-driven UI content, and 2) the ways in which your UI might trigger an effect.

```javascript
/*** app.spec.js ***/

import { mount } from "enzyme";
// Make sure to import the _unwrapped_ component here!
import { App } from "./app";


// We'll be re-using these values, so let's put it here for convenience.
const state = {
  givenName: "Charlie",
  familyName: "In-the-box",
  fullName: "Charlie In-the-box",
  greeting: "Howdy there, kid!"
};

describe("my app", () => {
  it("displays a greeting to the user", () => {
    // This test should be easy - all we have to do is ensure that
    // the string that is passed in is displayed correctly!

    // We're not doing anything with effects here, so let's not bother
    // setting them for now...
    const effects = {};

    // First, we mount the component, providing the expected state and effects.
    const el = mount(<App state={state} effects={effects}/>);

    // And then we can make assertions on the output.
    expect(el.find("#greeting").text()).to.equal("Howdy there, kid!");
  });

  it("accepts changes to the given name", () => {
    // Next we're testing the conditions under which our component might
    // interact with the provided effects.
    const effects = {
      setGivenName: sinon.spy(),
      setFamilyName: sinon.spy()
    };

    const el = mount(<App state={state} effects={effects}/>);

    // Using `sinon-chai`, we can make readable assertions about whether
    // a spy function has been called.  We don't expect our effect to
    // be invoked when the component mounts, so let's make that assertion
    // here.
    expect(effects.setGivenName).not.to.have.been.called;
    // Next, we can simulate a input-box value change.
    el.find("input.given").simulate("change", {
      target: { value: "Eric" }
    });
    // And finally, we can assert that the effect - or, rather, the Sinon
    // spy that is standing in for the effect - was invoked with the expected
    // value.
    expect(effects.setGivenName).to.have.been.calledWith("Eric");
  });
});
```

That takes care of your SFCs.  This should really be no different than how you might have been testing your presentational components in the past, except that with `freactal`, this is the _only_ sort of testing you need to do for your React components.


### State and effects

Next up is state.  As you read through the example below, take note that we can make assertions about the initial state and any expected transformations to that state without involving a React component or rendering to the DOM.

```javascript
/*** state.spec.js ***/

import { wrapComponentWithState } from "./state";

describe("state container", () => {
  it("supports fullName", () => {
    // Normally, you'd pass a component as the first argument to your
    // state template.  However, if you pass no argument to the state
    // template, you'll get back a test instance that you can extract
    // `state` and `effects` from.  Just don't try to render the thing!
    const { effects, getState } = wrapComponentWithState();

    expect(getState().fullName).to.equal("Walter Harriman");

    // Since effects return a Promise, we're going to make it easy
    // on ourselves and wrap all of our assertions from this point on
    // inside a Promise.
    return Promise.resolve()
      // When a Promise is provided as the return value to a Promise's
      // `.then` callback, the outer Promise awaits the inner before
      // any subsequent callbacks are fired.
      .then(() => effects.setGivenName("Alfred"))
      // Now that `givenName` has been set to "Alfred", we can make an
      // assertion...
      .then(() => expect(getState().fullName).to.equal("Alfred Harriman"))
      // Then we can do the same for the family name...
      .then(() => effects.setFamilyName("Hitchcock"))
      // And make one final assertion.
      .then(() => expect(getState().fullName).to.equal("Alfred Hitchcock"));
  });

  // You could write similar assertions here
  it("supports a greeting");
});
```

That's it for testing!


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


### Conclusion

We hope that you found this guide to be helpful!

If you find that a piece is missing that would've helped you understand `freactal`, please feel free to [open an issue](https://github.com/FormidableLabs/freactal/issues/new).  For help working through a problem, [reach out on Twitter](http://twitter.com/divmain), open an issue, or ping us on [Gitter](https://gitter.im/FormidableLabs/freactal).

You can also read through the API docs below!


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


## API Documentation

### `provideState`

This is used to define a state container, which in turn can wrap one of your application components.

```javascript
const StatefulComponent = provideState({/* options */})(StatelessComponent);
```

The `options` argument is an object with one or more of the following keys: `initialState`, `effects`, `initialize`, and `computed`.


#### `initialState`

A function defining the state of your state container when it is first initialized.

This function is invoked both on the server during a server-side render and on the client.  However, you might employ environment detection in order to yield divergent results.

```javascript
provideState({
  initialState: () => ({
    a: "value will",
    b: "set here"
  })
})
```
Component props can be passed to `initialState` like so : 

```javascript
provideState({
  initialState: ({ value }) => ({
    a: value,
    b: "set here"
  })
})
```


#### `effects`

Effects are the mechanism by which state is updated.

The `effects` value should be an object, where the keys are function names (that you will later) and the values are functions.

Each effect will be provided one or more arguments: an `effects` reference (see note below), and any arguments that are passed to the function when they're invoked in application code.

The return value is either 1) a function that takes in old state and returns new state or, 2) a Promise that resolves to #1.

This may seem opaque, so please refer to the [guide](#effect-arguments) for information on how to use them effectively.

```javascript
provideState({
  effects: {
    doThing: (effects, argA) =>
      Promise.resolve(state => Object.assign({}, state, { val: argA }))
  }
});
```

**NOTE 1:** The effects are called synchronously so you that you can use directly any passed events:

```javascript
provideState({
  effects: {
    onInputChange: (effects, event) => {
      const { value } = event.target
      return state =>
        Object.assign({}, state, { inputValue: value })
    }
  }
});

const MyComponent = injectState(({ effects, state }) => (
  <input onChange={effects.onInputChange} value={state.inputValue} />
))
```

**NOTE 2:** The `effects` object that is passed to each effect is _not_ the same as the outer effects object that you define here.  Instead, that object is a composition of the hierarchy of stateful effects.

##### `initialize`

Each state container can define a special effect called `initialize`.  This effect has props passed in as a second argument and will be implicitly invoked in two circumstances:

1. During SSR, each state container with an `initialize` effect will invoke it, and the rendering process will await the resolution of that effect before continuing with rendering.
2. When running in the browser, each state container with an `initialize` effect will invoke it when the container is mounted into the DOM.

Note: this effect will NOT be passed down to a component's children.


#### `computed`

The `computed` object allows you to define compound state values that depend on basic state values or other computed values.

The value provided as the `computed` option should be an object where each key is the name by which the computed value will be referenced, and each value is a function taking in state and returning a computed value.

```javascript
provideState({
  initialState: () => ({
    a: "value will",
    b: "set here"
  }),
  computed: {
    aPlusB: ({ a, b }) => `${a} + ${b}`, // "value will + set here"
    typeOfAPlusB: ({ aPlusB }) => typeof aPlusB // "string"
  }
})
```

Props can't be passed to `computed` 

#### `middleware`

Middleware is defined per state container, not globally.  Each middleware function will be invoked in the order provided whenever a state change has occurred.

With middleware, you should be able to inject new state values, intercept effects before they begin, track when effects complete, and modify the way in which sub-components interact and respond to state containers further up the tree.

To write middleware effectively, you'll probably want to take a look at the Freactal's internal `buildContext` method.  Fortunately it is pretty straightforward.

The following is an example that will log out whenever an effect is invoked, the arguments it was provided, and when the effect completed:

```javascript
provideState({
  middleware: [
    freactalCxt => Object.assign({}, freactalCxt, {
      effects: Object.keys(freactalCxt.effects).reduce((memo, key) => {
        memo[key] = (...args) => {
          console.log("Effect started", key, args);
          return freactalCxt.effects[key](...args).then(result => {
            console.log("Effect completed", key);
            return result;
          })
        };
        return memo;
      }, {})
    })
  ]
})
```


### `injectState`

While `provideState` supplies the means by which you declare your state and its possible transitions, `injectState` is the means by which you access `state` and `effects` from your UI code.

By default, `injectState` will detect the keys that you access in your component, and will only force a re-render if those keys change in the upstream state container.

```javascript
const StatelessComponent = ({ state: { myValue } }) =>
  <div>{ myValue }</div>
const WithState = injectState(StatelessComponent);
```

In the above example, `StatelessComponent` would only be re-rendered a second time if `myValue` changed in the upstream state container.

However, it is possible to explicitly define which keys you want to "listen" to.  When using this form, the keys that you specify are injected into the wrapped component as props.

```javascript
const StatelessComponent = ({ myValue }) =>
  <div>{ myValue }</div>
const StatefulComponent = injectState(StatelessComponent, ["myValue", "otherValueToo"]);
```

In this example, `StatelessComponent` would re-render when `myValue` changed, but it would also re-render when `otherValueToo` changed, even though that value is not used in the component.


### `hydrate` and `initialize`

These functions are used to deeply initialize state in the SSR context and then re-hydrate that state on the client.  For more information about how to use these functions, see the below documentation on [Server-side Rendering](#server-side-rendering).


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


## Helper functions

You may find the following functions handy, as a shorthand for common tasks.


### `update`

This handy helper provides better ergonomics when defining an effect that updates state.

It can be consumed like so:

```javascript
import { provideState, update } from "freactal";
const wrapComponentWithState = provideState({
  // ...
  effects: {
    myEffect: update({ setThisKey: "to this value..." })
  }
});
```

Which is equivalent to the following:

```javascript
import { provideState } from "freactal";
const wrapComponentWithState = provideState({
  // ...
  effects: {
    myEffect: () => state => Object.assign({}, state, { setThisKey: "to this value..." })
  }
});
```

When your update _is_ dependant on the previous state you can pass a function, like so:

```javascript
import { provideState, update } from "freactal";
const wrapComponentWithState = provideState({
  // ...
  effects: {
    myEffect: update(state => ({ counter: state.counter + 1 }))
  }
});
```

Which is equivalent to the following:

```javascript
import { provideState } from "freactal";
const wrapComponentWithState = provideState({
  // ...
  effects: {
    myEffect: () => state => Object.assign({}, state, { counter: state.counter + 1 })
  }
});
```

Any arguments that are passed to the invocation of your effect will also be passed to the function you provide to `update`.

I.e.

```javascript
effects: {
  updateCounterBy: (effects, addVal) => state => Object.assign({}, state, { counter: state.counter + addVal })
}
```

is equivalent to:

```javascript
effects: {
  myEffect: update((state, addVal) => ({ counter: state.counter + addVal }))
}
```


### `mergeIntoState`

`update` is intended for synchronous updates only.  But writing out a state-update function for asynchronous effects can get tedious.  That's where `mergeIntoState` comes in.

```javascript
mergeIntoState(newData)
```

... is exactly equivalent to...

```javascript
state => Object.assign({}, state, newData)
```

Here's what it might look like in practice:

```javascript
export const getData = (effects, dataId) => fetch(`http://some.url/${dataId}`)
  .then(response => response.json())
  .then(body => mergeIntoState({ data: body.data }));
```


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>


## Server-side Rendering

Historically, server-side rendering of stateful React applications has involved many moving pieces.  `freactal` aims to simplify this area without sacrificing the power of its fractal architecture.

There are two parts to achieving SSR with `freactal`: state initialization on the server, and state hydration on the client.

Keep in mind that, if you have a state container whose state needs to be initialized in a particular way, you should take a look at the [`initialize`](#initialize) effect.

`freactal` supports both React's built-in `renderToString` method, as well as the newer [Rapscallion](https://github.com/FormidableLabs/rapscallion).

### with `React#renderToString`

On the server, you'll need to recursively initialize your state tree.  This is accomplished with the `initialize` function, provided by `freactal/server`.

```javascript
/* First, import renderToString and the initialize function. */
import { renderToString } from "react-dom/server";
import { initialize } from "freactal/server";

/*
  Within the context of your Node.js server route, pass the root component to
  the initialize function.
 */
initialize(<StatefulRootComponent rootProp="hello" />)
  /* This invocation will return a Promise that resolves to VDOM and state */
  .then(({ vdom, state }) => {
    /* Pass the VDOM to renderToString to get HTML out. */
    const appHTML = renderToString(vdom);
    /*
      Pass your application HTML and the application state (an object) to a
      function that inserts application HTML into <html> and <body> tags,
      serializes state, and inserts that state into an accessible part of
      the DOM.
    */
    const html = boilerplate(appHTML, state);
    /* Finally, send the full-page HTML to the client */
    return res.send(html).end();
  })
```

You can find a full `freactal` example, including a server and SSR [here](https://github.com/FormidableLabs/freactal/tree/master/example).


### with Rapscallion

The above method involves a partial render of your application (`initialize`), ultimately relying upon `React.renderToString` to transform the VDOM into an HTML string.  This is because `renderToString` is synchronous, and `freactal` is asynchronous by design.

Because Rapscallion is also asynchronous by design, there is even less ceremony involved.

```javascript
/* First, import Rapscallion's render and the captureState function. */
import { render } from "rapscallion";
import { captureState } from "freactal/server";

/*
  Within the context of your Node.js server route, invoke `captureState` with your root component.
 */
const { Captured, state } = captureState(<StatefulRootComponent rootProp="hello" />);

/* Pass the <Captured /> component to Rapscallion's renderer */
render(<Captured />)
  .toPromise()
  .then(appHTML => {
    /*
      At this point, the `state` object will be fully populated with your
      state tree's data.

      Pass your application HTML and state to a function that inserts
      application HTML into <html> and <body> tags, serializes state, and
      inserts that state into an accessible part of the DOM.
    */
    const html = boilerplate(appHTML, state);
    /* Finally, send the full-page HTML to the client */
    return res.send(html).end();
  });
```


### Hydrate state on the client

Using one of the above methods, you can capture your application state while server-side rendering and insert it into the resulting HTML.  The final piece of the SSR puzzle is re-hydrating your state containers inside the browser.

This is accomplished with `hydrate` in the context of your `initialState` function.

Assuming you've serialized the SSR state and exposed it as `window.__state__`, your root state container should look something like this:

```javascript
import { provideState, hydrate } from "freactal";

const IS_BROWSER = typeof window === "object";
const stateTemplate = provideState({
  initialState: IS_BROWSER ?
    hydrate(window.__state__) :
    () => { /* your typical state values */ },
  effects: { /* ... */ },
  computed: { /* ... */ }
});
```

In SSR, your `typical state values` will be provided as your initial state.  In the browser, the initial state will be read from `window.__state__`.

Assuming you've done this with your root state container, you can similarly re-hydrate nested state containers like so:

```javascript
import { provideState, hydrate } from "freactal";

const IS_BROWSER = typeof window === "object";
const stateTemplate = provideState({
  initialState: IS_BROWSER ?
    hydrate() :
    () => { /* your typical state values */ },
  effects: { /* ... */ },
  computed: { /* ... */ }
});
```

Note that there is no need to pass `window.__state__` to the `hydrate` function for nested state containers.


<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>
