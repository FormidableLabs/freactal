import { default as React, Component } from "react";

import { HocState, graftParentState } from "./state";
import { getEffects } from "./effects";
import { contextTypes } from "./context";


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
        initialState && initialState() || Object.create(null),
        computed,
        // TODO: Batch updates (w/ requestAnimationFrame?) so that effect promises that resolve
        // at the same time (e.g. a data request completion, and the setting of a pending flag)
        // don't cause two renders.
        cb => this.forceUpdate(cb)
      );

      this.effects = getEffects(this.hocState, effects);

      this.computed = computed;
    }

    getChildContext () {
      const context = {
        state: graftParentState(this.hocState.getState(), this.context.state),
        effects: Object.assign({}, this.context.effects, this.effects)
      };

      return middleware.reduce((memo, middlewareFn) => middlewareFn(memo), context);
    }

    getState () {
      return this.hocState.state;
    }

    render () {
      return <StatelessComponent {...this.props} set={this.hocState.set.bind(this.hocState)} />;
    }
  }

  StatefulComponent.childContextTypes = contextTypes;
  StatefulComponent.contextTypes = contextTypes;

  return StatefulComponent;
};
