import { partialRender as preactPartialRender } from "./preact";
import { partialRender as reactPartialRender } from "./react";

export const partialRender = (node, context) => {
  if (node.nodeName && node.type) {
    throw new Error("You're attempting to render a VDOM node that may be Preact _or_ React.");
  } else if (node.nodeName) {
    return preactPartialRender(node, context);
  }
  return reactPartialRender(node, context);
};
