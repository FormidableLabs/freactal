/* eslint-disable no-invalid-this */
import isFunction from "lodash/isFunction";
import assign from "lodash/assign";


/**
 * Code originally borrowed from the Rapscallion project:
 * https://github.com/FormidableLabs/rapscallion/blob/44014d86a0855f7c3e438e6a9ee1e2ca07ff2cbe/src/render/state.js
 */


export function syncSetState (newState, cb) {
  // Mutation is faster and should be safe here.
  this.state = assign(
    this.state,
    isFunction(newState) ?
      newState(this.state, this.props) :
      newState
  );
  if (cb) { cb.call(this); }
}
