import { resolvePromiseTree as resolveReactPromiseTree } from "./react";
import { resolvePromiseTree as resolvePreactPromiseTree } from "./preact";


export const resolvePromiseTree = (obj, isPreact) => isPreact ?
  resolvePreactPromiseTree(obj) :
  resolveReactPromiseTree(obj);
