import { default as React, Component } from "react";

import { HocState, graftParentState } from "./state";
import { getEffects } from "./effects";
import { contextTypes } from "./context";
import { HYDRATE } from "./common";


export const withState = opts => StatelessComponent => {
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
        // TODO: Batch updates (w/ requestAnimationFrame?) so that effect promises that resolve
        // at the same time (e.g. a data request completion, and the setting of a pending flag)
        // don't cause two renders.
        //
        // This might already be handled by React under the hood.
        cb => this.mounted ? this.forceUpdate(cb) : cb()
      );

      this.effects = getEffects(this.hocState, effects);

      this.computed = computed;
    }

    getChildContext () {
      // Capture container state while server-side rendering.
      if (this.context.__captureState__) {
        this.context.__captureState__(this.hocState.state);
      }

      const parentKeys = this.context.state ? Object.keys(this.context.state) : [];
      const context = {
        state: graftParentState(this.hocState.getState(parentKeys), this.context.state),
        effects: Object.assign({}, this.context.effects, this.effects)
      };

      // Provide context for sub-component state re-hydration.
      if (this.hocState.state[HYDRATE]) {
        context.__getNextContainerState__ = this.hocState.state[HYDRATE];
        delete this.hocState.state[HYDRATE];
      }

      return middleware.reduce((memo, middlewareFn) => middlewareFn(memo), context);
    }

    componentDidMount () {
      if (this.effects.initialize) { this.effects.initialize(); }
      this.mounted = true;
    }

    componentWillUnmount () {
      this.mounted = false;
    }

    getState () {
      return this.hocState.state;
    }

    render () {
      return <StatelessComponent {...this.props} />;
    }
  }

  StatefulComponent.childContextTypes = contextTypes;
  StatefulComponent.contextTypes = contextTypes;

  return StatefulComponent;
};
