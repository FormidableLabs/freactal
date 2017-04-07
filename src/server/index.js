import { partialRender } from "./partial-render";
import { resolvePromiseTree } from "./resolve-promise-tree";


export const initialize = rootNode => {
  const state = [];
  const renderingContext = {
    freactal: { captureState: containerState => state.push(containerState) }
  };

  const renderTree = partialRender(rootNode, renderingContext);

  return resolvePromiseTree(renderTree).then(vdom => {
    return { vdom, state };
  });
};
