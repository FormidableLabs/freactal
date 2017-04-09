# fr(e)actal

`freactal` is a composable state management library for React.

The library grew from the idea that state should be just as flexible as your React code; the state containers you build with `freactal` are just components, and you can compose them however you'd like.  In this way, it attempts to address the often exponential relationship between application size and complexity as projects grow.

Like [`redux`](http://redux.js.org/) and React in general, `freactal` builds on the principle of unidirectional flow of data.  However, it does so in a way that feels idiomatic to ES2015+ and doesn't get in your way.

When building an application, it can replace [`redux`](redux.js.org), [`reselect`](https://github.com/reactjs/reselect), [`redux-loop`](https://github.com/redux-loop/redux-loop), [`redux-thunk`](https://github.com/gaearon/redux-thunk), [`redux-saga`](https://github.com/redux-saga/redux-saga), `[fill-in-the-blank sub-app composition technique]`, and potentially [`recompose`](https://github.com/acdlite/recompose), depending on how you're using it.

It's design philosophy aligns closely with the [Zen of Python](https://www.python.org/dev/peps/pep-0020/):

```
Beautiful is better than ugly.
  Explicit is better than implicit.
    Simple is better than complex.
  Complex is better than complicated.
    Flat is better than nested.
  Sparse is better than dense.
Readability counts.
```


----

## Table of Contents

- [Guide](#guide)
  - [Containing state with an HOC](#containing-state-with-an-hoc)
  - [Accessing state from a top-level component](#accessing-state-from-a-top-level-component)
  - [Accessing state from a child component](#accessing-state-from-a-child-component)
  - [Transforming state](#transforming-state)
  - [Transforming state asynchronously](#transforming-state-asynchronously)
  - [Transforming state from a child](#transforming-state-from-a-child)
  - [Intermediate state](#intermediate-state)
  - [Computed state values](#computed-state-values)
  - [Composing multiple state containers](#composing-multiple-state-containers)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
  - [`provideState`](#providestate)
    - [`initialState`](#initialstate)
    - [`effects`](#effects)
    - [`computed`](#computed)
    - [`middleware`](#middleware)
  - [`injectState`](#injectstate)
  - [`hydrate`](#hydrate)
- [Helper functions](#helper-functions)
  - [`hardUpdate`](#hardupdate)
  - [`spread`](#spread)
- [Server-side Rendering](#server-side-rendering)
  - [with `React#renderToString`](#with-reactrendertostring)
  - [with Rapscallion](#with-rapscallion)
- [FAQ](#faq)


----

<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>

----

## Guide

**TODO**


### Containing state with an HOC

**TODO**


### Accessing state from a top-level component

**TODO**


### Accessing state from a child component

**TODO**


### Transforming state

**TODO**


### Transforming state asynchronously

**TODO**


### Transforming state from a child

**TODO**


### Intermediate state

**TODO**


### Computed state values

**TODO**


### Composing multiple state containers

**TODO**


----

<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>

----

## Architecture

**TODO**


----

<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>

----

## API Documentation

### `provideState`

**TODO**

#### `initialState`

**TODO**

#### `effects`

**TODO**

#### `computed`

**TODO**

#### `middleware`

**TODO**

### `injectState`

**TODO**

### `hydrate`

**TODO**


----

<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>

----

## Helper functions

**TODO**

### `hardUpdate`

**TODO**

### `spread`

**TODO**


----

<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>

----

## Server-side Rendering

**TODO**

### with `React#renderToString`

**TODO**

### with Rapscallion

**TODO**


----

<a href="#table-of-contents"><p align="center" style="margin-top: 400px"><img src="https://cloud.githubusercontent.com/assets/5016978/24835268/f983b58e-1cb1-11e7-8885-6c029cbbd224.png" height="60" width="60" /></p></a>

----

## FAQ

**Do you support time-traveling?**

TODO

**What middleware is available?**

- [freactal-devtools](https://github.com/FormidableLabs/freactal-devtools)
- [freactal-logger](https://github.com/FormidableLabs/freactal-logger)

**TODO**
