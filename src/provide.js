import { default as React, Component } from "react";

import { StateContainer, graftParentState } from "./state";
import { getEffects } from "./effects";
import { contextTypes } from "./context";
import { HYDRATE } from "./common";


export class BaseStatefulComponent extends Component {
  getChildContext () {
    const parentContext = this.context.freactal || {};

    // Capture container state while server-side rendering.
    if (parentContext.captureState) {
      parentContext.captureState(this.stateContainer.state);
    }

    const localContext = this.buildContext();
    this.childContext = Object.assign({}, parentContext, localContext);

    // Provide context for sub-component state re-hydration.
    if (this.stateContainer.state[HYDRATE]) {
      this.childContext.getNextContainerState = this.stateContainer.state[HYDRATE];
      delete this.stateContainer.state[HYDRATE];
    }

    return {
      freactal: this.childContext
    };
  }

  componentDidMount () {
    if (this.effects.initialize) { this.effects.initialize(this.props); }
    this.unsubscribe = this.context.freactal ?
      this.context.freactal.subscribe(this.relayUpdate.bind(this)) :
      () => {};
  }

  componentWillUnmount () {
    if (this.effects.finalize) { this.effects.finalize(); }
    // this.unsubscribe may be undefined due to an error in child render
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  subscribe (onUpdate) {
    const subscriberId = this.nextSubscriberId++;
    this.subscribers[subscriberId] = onUpdate;
    return () => {
      this.subscribers[subscriberId] = null;
    };
  }

  buildContext () {
    const parentContext = this.context.freactal || {};
    const parentKeys = parentContext.state ? Object.keys(parentContext.state) : [];

    return this.middleware.reduce(
      (memo, middlewareFn) => middlewareFn(memo),
      {
        state: graftParentState(this.stateContainer.getState(parentKeys), parentContext.state),
        effects: this.effects,
        subscribe: this.subscribe
      }
    );
  }

  invalidateChanged (changedKeys) {
    const relayedChangedKeys = Object.assign({}, changedKeys);

    const markedKeyAsChanged = key => {
      relayedChangedKeys[key] = true;
      Object.keys(this.stateContainer.computedDependants[key] || {}).forEach(markedKeyAsChanged);
    };

    Object.keys(changedKeys)
      .filter(key => changedKeys[key])
      .forEach(key => {
        this.stateContainer.invalidateCache(key);
        markedKeyAsChanged(key);
      });

    return relayedChangedKeys;
  }

  relayUpdate (changedKeys) {
    // When updates are relayed, the context needs to be updated here; otherwise, the state object
    // will refer to stale parent data when subscribers re-render.
    Object.assign(this.childContext, this.buildContext());
    const relayedChangedKeys = this.invalidateChanged(changedKeys);
    return Promise.all(this.subscribers.map(subscriber =>
      subscriber && subscriber(relayedChangedKeys)
    ));
  }

  pushUpdate (changedKeys) {
    if (Object.keys(changedKeys).length === 0) {
      return Promise.resolve();
    }

    // In an SSR environment, the component will not yet have rendered, and the child
    // context will not yet be generated.  The subscribers don't need to be notified,
    // as they will contain correct context on their initial render.
    if (!this.childContext) { return Promise.resolve(); }

    Object.assign(this.childContext, this.buildContext());
    const relayedChangedKeys = this.invalidateChanged(changedKeys);

    return Promise.all(this.subscribers.map(subscriber =>
      subscriber && subscriber(relayedChangedKeys)
    ));
  }

  render () {
    return <this.StatelessComponent {...this.props} />;
  }
}

export const provideState = opts => StatelessComponent => {
  const {
    initialState = null,
    effects = {},
    computed = {},
    middleware = []
  } = opts;

  class StatefulComponent extends BaseStatefulComponent {
    constructor (...args) {
      super(...args);

      this.StatelessComponent = StatelessComponent;
      this.middleware = middleware;

      this.stateContainer = new StateContainer(
        initialState && initialState(this.props, this.context) || Object.create(null),
        computed,
        this.pushUpdate.bind(this)
      );
      this.getState = this.stateContainer.getState.bind(this.stateContainer);

      const parentContext = this.context.freactal || {};
      this.effects = getEffects(this.stateContainer, effects, parentContext.effects);

      this.computed = computed;

      this.subscribe = this.subscribe.bind(this);
      this.nextSubscriberId = 0;
      this.subscribers = [];
    }
  }

  StatefulComponent.childContextTypes = contextTypes;
  StatefulComponent.contextTypes = contextTypes;

  // This provides a low-effort way to get at a StatefulComponent instance for testing purposes.
  if (!StatelessComponent) {
    return new StatefulComponent(null, {});
  }

  return StatefulComponent;
};
