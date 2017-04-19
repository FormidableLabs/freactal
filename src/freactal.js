import { default as React, Component } from "react";

import { HocState, graftParentState } from "./state";
import { getEffects } from "./effects";
import { contextTypes } from "./context";
import { HYDRATE } from "./common";


export const provideState = opts => StatelessComponent => {
  const {
    initialState = null,
    effects = {},
    computed = {},
    middleware = []
  } = opts;

  class StatefulComponent extends Component {
    constructor (...args) {
      super(...args);

      this.hocState = new HocState(
        initialState && initialState(this.props, this.context) || Object.create(null),
        computed,
        this.pushUpdate.bind(this)
      );

      const parentContext = this.context.freactal || {};
      this.effects = getEffects(this.hocState, effects, parentContext.effects);

      this.computed = computed;

      this.subscribe = this.subscribe.bind(this);
      this.nextSubscriberId = 0;
      this.subscribers = [];
    }

    getChildContext () {
      const parentContext = this.context.freactal || {};

      // Capture container state while server-side rendering.
      if (parentContext.captureState) {
        parentContext.captureState(this.hocState.state);
      }

      const localContext = this.buildContext();
      this.childContext = Object.assign({}, parentContext, localContext);

      // Provide context for sub-component state re-hydration.
      if (this.hocState.state[HYDRATE]) {
        this.childContext.getNextContainerState = this.hocState.state[HYDRATE];
        delete this.hocState.state[HYDRATE];
      }

      return {
        freactal: this.childContext
      };
    }

    componentDidMount () {
      if (this.effects.initialize) { this.effects.initialize(); }
      this.unsubscribe = this.context.freactal ?
        this.context.freactal.subscribe(this.relayUpdate.bind(this)) :
        () => {};
    }

    componentWillUnmount () {
      this.unsubscribe();
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

      return middleware.reduce(
        (memo, middlewareFn) => middlewareFn(memo),
        {
          state: graftParentState(this.hocState.getState(parentKeys), parentContext.state),
          effects: this.effects,
          subscribe: this.subscribe
        }
      );
    }

    invalidateChanged (changedKeys) {
      const relayedChangedKeys = Object.assign({}, changedKeys);

      const markedKeyAsChanged = key => {
        relayedChangedKeys[key] = true;
        this.hocState.invalidateCache(key);
        Object.keys(this.hocState.computedDependants[key] || {}).forEach(markedKeyAsChanged);
      };

      Object.keys(changedKeys)
        .filter(key => changedKeys[key])
        .forEach(key => markedKeyAsChanged(key));

      return relayedChangedKeys;
    }

    relayUpdate (changedKeys) {
      const relayedChangedKeys = this.invalidateChanged(changedKeys);
      this.subscribers.forEach(cb => cb && cb(relayedChangedKeys));
    }

    pushUpdate (changedKeys) {
      return Promise.resolve().then(() => {
        // In an SSR environment, the component will not yet have rendered, and the child
        // context will not yet be generated.  The subscribers don't need to be notified,
        // as they will contain correct context on their initial render.
        if (this.childContext) {
          Object.assign(this.childContext, this.buildContext());
          const relayedChangedKeys = this.invalidateChanged(changedKeys);
          this.subscribers.forEach(cb => cb && cb(relayedChangedKeys));
        }
      });
    }

    render () {
      return <StatelessComponent {...this.props} />;
    }
  }

  StatefulComponent.childContextTypes = contextTypes;
  StatefulComponent.contextTypes = contextTypes;

  return StatefulComponent;
};
