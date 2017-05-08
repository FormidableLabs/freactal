import { default as React, Component } from "react";

import { contextTypes } from "./context";


export class BaseInjectStateHoc extends Component {
  componentDidMount () {
    this.mounted = true;
    this.unsubscribe = this.context.freactal.subscribe(this.update.bind(this));
  }

  componentWillReceiveProps () {
    this.usedKeys = null;
  }

  componentWillUnmount () {
    this.mounted = false;
    // this.unsubscribe may be undefined due to an error in child render
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  update (changedKeys) {
    if (this.mounted && this.shouldUpdate(changedKeys, this.usedKeys)) {
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
    const props = Object.assign({}, this.props);
    if (this.keys) {
      this.keys.forEach(key => props[key] = this.context.freactal.state[key]);
    } else {
      props.state = this.getTrackedState();
    }

    return (
      <this.StatelessComponent
        {...props}
        effects={this.context.freactal.effects}
      />
    );
  }
}

export const injectState = (StatelessComponent, keys = null) => {
  const shouldUpdate = keys ?
    changedKeys => keys.reduce((memo, key) => memo || changedKeys[key], false) :
    (changedKeys, usedKeys) => usedKeys ?
      Object.keys(usedKeys)
        .filter(key => usedKeys[key])
        .reduce((memo, key) => memo || changedKeys[key], false) :
      true;

  class InjectStateHoc extends BaseInjectStateHoc {
    constructor (...args) {
      super(...args);
      if (!this.context.freactal) {
        throw new Error("Attempted to inject state without parent Freactal state container.");
      }

      this.keys = keys;
      this.shouldUpdate = shouldUpdate;
      this.StatelessComponent = StatelessComponent;
    }
  }

  InjectStateHoc.contextTypes = contextTypes;

  return InjectStateHoc;
};
