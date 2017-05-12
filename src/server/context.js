import assign from "lodash/assign";
import keys from "lodash/keys";

/**
 * Code originally borrowed from the Rapscallion project:
 * https://github.com/FormidableLabs/rapscallion/blob/44014d86a0855f7c3e438e6a9ee1e2ca07ff2cbe/src/render/context.js
 */


const EMPTY_CONTEXT = Object.freeze({});


export function getChildContext (componentPrototype, instance, context) {
  if (componentPrototype.childContextTypes) {
    return assign(Object.create(null), context, instance.getChildContext());
  }
  return context;
}

export function getContext (componentPrototype, context) {
  if (componentPrototype.contextTypes) {
    const contextTypes = componentPrototype.contextTypes;
    return keys(context).reduce(
      (memo, contextKey) => {
        if (contextKey in contextTypes) {
          memo[contextKey] = context[contextKey];
        }
        return memo;
      },
      Object.create(null)
    );
  }
  return EMPTY_CONTEXT;
}

export function getRootContext () {
  return Object.create(null);
}
