import { getContext, getChildContext } from "./context";
import { syncSetState } from "./set-state";


const isReactComponent = node => node && typeof node.type === "function";
const isReactVdom = node => node && typeof node.type === "string";

export const partialRender = (node, context) => {
  if (isReactComponent(node)) {
    return renderComponent(node, context);
  } else if (isReactVdom(node)) {
    return partiallyRenderVdom(node, context);
  } else {
    return node;
  }
};

const isStatefulComponent = node => node.type.prototype && node.type.prototype.isReactComponent;

const renderComponent = (node, context) => {
  const componentContext = getContext(node.type, context);

  if (!(isStatefulComponent(node))) {
    // Vanilla SFC.
    return partialRender(node.type(node.props, componentContext), context);
  } else {
    // eslint-disable-next-line new-cap
    const instance = new node.type(node.props, componentContext);

    if (typeof instance.componentWillMount === "function") {
      instance.setState = syncSetState;
      instance.componentWillMount();
    }

    const renderInstance = () => {
      const childContext = getChildContext(node.type, instance, context);
      return partialRender(instance.render(), childContext);
    };

    return instance.effects && typeof instance.effects.initialize === "function" ?
      instance.effects.initialize().then(renderInstance) :
      renderInstance();
  }
};

const assign = Object.assign;

const partiallyRenderVdom = (node, context) => {
  if (node.props.children) {
    const children = Array.isArray(node.props.children) ?
      node.props.children.map(child => partialRender(child, context)) :
      partialRender(node.props.children, context);

    node = assign({}, node, {
      props: assign({}, node.props, { children })
    });
  }
  return node;
};

