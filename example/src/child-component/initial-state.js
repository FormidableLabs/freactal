import { hydrate } from "../../..";


const IS_BROWSER = typeof window === "object";


export default IS_BROWSER ?
  hydrate() :
  () => ({ localValue: "local value" });
