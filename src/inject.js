import { default as React, Component } from "react";

import { contextTypes } from "./context";


export const injectState = (StatelessComponent, keys = null) => {
  const auto = !keys;

  const shouldUpdate = keys ?
    changedKeys => keys.reduce((memo, key) => memo || changedKeys[key], false) :
    (changedKeys, usedKeys) => usedKeys ?
      Object.keys(usedKeys)
        .filter(key => usedKeys[key])
        .reduce((memo, key) => memo || changedKeys[key], false) :
      true;

  class InjectStateHoc extends Component {
    constructor (...args) {
      super(...args);
      if (!this.context.freactal) {
        throw new Error("Attempted to inject state without parent Freactal state container.");
      }
    }

    componentDidMount () {
      this.mounted = true;
      this.unsubscribe = this.context.freactal.subscribe(this.update.bind(this));
    }

    componentWillReceiveProps () {
      this.usedKeys = null;
    }

    componentWillUnmount () {
      this.mounted = false;
      this.unsubscribe();
    }

    update () {
      if (this.mounted && shouldUpdate(this.context.freactal.changedKeys, this.usedKeys)) {
        this.forceUpdate();
      }
    }

    getTrackedState () {
      const state = this.context.freactal.state;
      const trackedState = Object.create(null);
      const usedKeys = this.usedKeys = Object.create(null);

      Object.keys(state).forEach(key => {
        usedKeys[key] = false;

        Object.defineProperty(trackedState, key, {
          enumerable: true,
          get () {
            usedKeys[key] = true;
            return state[key];
          }
        });
      });

      return trackedState;
    }

    render () {
      const state = auto ? this.getTrackedState() : this.context.freactal.state;

      return (
        <StatelessComponent
          {...this.props}
          state={state}
          effects={this.context.freactal.effects}
        />
      );
    }
  }

  InjectStateHoc.contextTypes = contextTypes;

  return InjectStateHoc;
};
