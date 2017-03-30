import { hydrate } from "../../..";


const IS_BROWSER = typeof window === "object";


export default IS_BROWSER ?
  hydrate(window.__state__) :
  () => ({
    pending: false,
    todos: null
  });
