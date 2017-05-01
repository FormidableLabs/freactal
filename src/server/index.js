import { partialRender } from "./partial-render";
import { resolvePromiseTree } from "./resolve-promise-tree";
import { constructCapture, captureState } from "./capture";


export const initialize = rootNode => {
  const { state, context } = constructCapture();
  return resolvePromiseTree(partialRender(rootNode, context))
    .then(vdom => ({ vdom, state }));
};

export { captureState };
