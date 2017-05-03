import { partialRender } from "./partial-render";
import { resolvePromiseTree } from "./resolve-promise-tree";
import { constructCapture, captureState } from "./capture";


export const initialize = rootNode => {
  const { state, context } = constructCapture();
  const isPreact = !!rootNode.nodeName;
  return resolvePromiseTree(partialRender(rootNode, context), isPreact)
    .then(vdom => ({ vdom, state }));
};

export { captureState };
