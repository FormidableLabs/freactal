import "isomorphic-fetch";
import { update, mergeIntoState } from "../../..";

const IS_BROWSER = typeof window === "object";

const wrapWithPending = cb => (effects, ...args) => effects.setDataPending(true)
  .then(() => cb(...args))
  .then(value => effects.setDataPending(false).then(() => value));

export const setDataPending = update((state, value) => ({ pending: value }));

const delay = ms => val => new Promise(resolve => setTimeout(() => resolve(val), ms));

export const fetchTodos = wrapWithPending(url =>
  fetch(url)
    .then(delay(2000))
    .then(result => result.json())
    .then(json => mergeIntoState({ todos: json }))
);

export const initialize = effects =>
  IS_BROWSER ?
  Promise.resolve() :
  fetch("https://jsonplaceholder.typicode.com/todos")
    .then(result => result.json())
    .then(json => mergeIntoState({ todos: json.slice(0, 10) }));
