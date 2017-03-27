import { default as React, Component } from "react";

import { HocState, graftParentState } from "./state";
import { getEffects } from "./effects";
import { contextTypes } from "./context";


export const withState = opts => StatelessComponent => {
  const {
    initialState = null,
    effects = {},
    computed = {}
  } = opts;

  class StatefulComponent extends Component {
    constructor (...args) {
      super(...args);

      this.hocState = new HocState(
        initialState && initialState() || Object.create(null),
        computed,
        cb => this.forceUpdate(cb)
      );

      this.hocEffects = getEffects(this.hocState, effects);

      this.middleware = this.middleware || [];

      this.computed = computed;
    }

    getChildContext () {
      return {
        state: graftParentState(this.hocState.getState(), this.context.state),
        effects: Object.assign({}, this.context.effects, this.hocEffects)
      };
    }

    render () {
      return <StatelessComponent {...this.props} set={this.hocState.set.bind(this.hocState)} />;
    }
  }

  StatefulComponent.childContextTypes = contextTypes;
  StatefulComponent.contextTypes = contextTypes;

  return StatefulComponent;
};
