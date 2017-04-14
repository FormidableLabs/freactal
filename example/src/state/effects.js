import "isomorphic-fetch";
import { softUpdate } from "../../..";

const IS_BROWSER = typeof window === "object";

const update = newState => state => Object.assign({}, state, newState);

const wrapWithPending = cb => (effects, ...args) => effects.setDataPending(true)
  .then(() => cb(...args))
  .then(value => effects.setDataPending(false).then(() => value));

export const setDataPending = softUpdate((state, value) => ({ pending: value }));

const delay = ms => val => new Promise(resolve => setTimeout(() => resolve(val), ms));

export const fetchTodos = wrapWithPending(url =>
  fetch(url)
    .then(delay(2000))
    .then(result => result.json())
    .then(json => update({ todos: json }))
);

export const initialize = effects =>
  IS_BROWSER ?
  Promise.resolve() :
  fetch("https://jsonplaceholder.typicode.com/todos")
    .then(result => result.json())
    .then(json => update({ todos: json.slice(0, 10) }));
