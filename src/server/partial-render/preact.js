import { syncSetState } from "../set-state";

const assign = Object.assign;
const isPreactComponent = node => node && typeof node.nodeName === "function";
const isPreactVdom = node => node && typeof node.nodeName === "string";


export const partialRender = (node, context) => {
  if (isPreactComponent(node)) {
    return renderComponent(node, context);
  } else if (isPreactVdom(node)) {
    return partiallyRenderVdom(node, context);
  } else {
    return node;
  }
};

let Component;
const isStatefulComponent = node => {
  if (!Component) { Component = require("preact").Component; }
  return node.nodeName.prototype instanceof Component;
};


const getNodeProps = node => {
  const defaultProps = node.nodeName.defaultProps;
  const props = assign({}, defaultProps || node.attributes);
  if (node.children) { props.children = node.children; }
  return props;
};

const renderComponent = (node, context) => {
  const props = getNodeProps(node);
  if (!(isStatefulComponent(node))) {
    // Vanilla SFC.
    return partialRender(node.nodeName(props, context), context);
  }

  // eslint-disable-next-line new-cap
  const instance = new node.nodeName(props, context);

  if (typeof instance.componentWillMount === "function") {
    instance.setState = syncSetState;
    instance.componentWillMount();
  }

  const renderInstance = () => {
    const childContext = typeof instance.getChildContext === "function" ?
      assign({}, context, instance.getChildContext()) :
      context;
    return partialRender(instance.render(props, instance.state, context), childContext);
  };

  return instance.effects && typeof instance.effects.initialize === "function" ?
    instance.effects.initialize().then(renderInstance) :
    renderInstance();
};


const partiallyRenderVdom = (node, context) => {
  if (node.children) {
    const children = Array.isArray(node.children) ?
      node.children.map(child => partialRender(child, context)) :
      partialRender(node.children, context);

    node = assign({}, node, { children });
  }
  return node;
};

