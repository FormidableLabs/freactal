import "isomorphic-fetch";
import { hardUpdate } from "../../..";

const IS_BROWSER = typeof window === "object";


const wrapWithPending = (effects, cb) =>
  effects.setDataPending(true)
    .then(cb)
    .then(value => effects.setDataPending(false).then(() => value));

export const setDataPending = (effects, value) => hardUpdate({ pending: !!value });

const delay = ms => val => new Promise(resolve => setTimeout(() => resolve(val), ms));

export const fetchTodos = (effects, url) => wrapWithPending(
  effects,
  () => fetch(url).then(delay(2000))
    .then(result => result.json())
    .then(json => update({ todos: json }))
);

export const initialize = effects =>
  IS_BROWSER ?
  Promise.resolve() :
  fetch("https://jsonplaceholder.typicode.com/todos")
    .then(result => result.json())
    .then(json => update({ todos: json }));
