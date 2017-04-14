import { HYDRATE } from "./common";


export const graftParentState = (state, parentState) => {
  if (parentState) {
    Object.keys(parentState).forEach(parentKey => {
      if (parentKey in state) { return; }
      Object.defineProperty(state, parentKey, {
        enumerable: true,
        get () { return parentState[parentKey]; }
      });
    });
  }
  return state;
};

export class HocState {
  // eslint-disable-next-line max-params
  constructor (
    initialState,
    computed,
    pushUpdate
  ) {
    this.state = initialState;

    this.cachedState = Object.create(null);
    this.computedDependants = Object.create(null);

    this.computed = computed;
    this.pushUpdate = pushUpdate;

    this.getTrackedState = this.getTrackedState.bind(this);
  }

  getTrackedState (computedKey, stateWithComputed, accessibleKeys) {
    const { computedDependants, state } = this;
    const stateProxy = Object.create(null);

    accessibleKeys.forEach(key => {
      Object.defineProperty(stateProxy, key, {
        get () {
          computedDependants[key] = computedDependants[key] || Object.create(null);
          computedDependants[key][computedKey] = true;
          return key in state ?
            state[key] :
            stateWithComputed[key];
        }
      });
    });

    return stateProxy;
  }

  defineComputedStateProperties (stateWithComputed, parentKeys) {
    const { cachedState, getTrackedState, computed } = this;

    const computedKeys = Object.keys(computed);
    const accessibleKeys = [].concat(computedKeys, Object.keys(stateWithComputed), parentKeys);

    computedKeys.forEach(computedKey => {
      const trackedState = getTrackedState(computedKey, stateWithComputed, accessibleKeys);

      Object.defineProperty(stateWithComputed, computedKey, {
        enumerable: true,
        get () {
          if (computedKey in cachedState) { return cachedState[computedKey]; }
          return cachedState[computedKey] = computed[computedKey](trackedState);
        }
      });
    });
  }

  getState (parentKeys) {
    const stateWithComputed = Object.create(null);
    Object.assign(stateWithComputed, this.state);
    this.defineComputedStateProperties(stateWithComputed, parentKeys);
    return stateWithComputed;
  }

  invalidateCache (key) {
    const valuesDependingOnKey = Object.keys(this.computedDependants[key] || {});

    valuesDependingOnKey.forEach(dependantKey => {
      delete this.cachedState[dependantKey];
      this.invalidateCache(dependantKey);
    });
  }

  set (key, newVal) {
    const oldVal = this.state[key];

    if (oldVal === newVal) { return; }

    this.invalidateCache(key);
    this.state[key] = newVal;
  }

  setState (newState) {
    const allKeys = Object.keys(Object.assign({}, this.state, newState));
    const changedKeys = Object.create(null);

    allKeys.forEach(key => {
      const oldValue = this.state[key];
      this.set(key, newState[key]);
      if (oldValue !== newState[key]) { changedKeys[key] = true; }
    });

    return this.pushUpdate(changedKeys);
  }
}

export const hydrate = bootstrapState => (props, context) => {
  if (context.freactal && context.freactal.getNextContainerState) {
    return context.freactal.getNextContainerState();
  }

  let containerIdx = 1;
  return Object.assign({
    [HYDRATE]: () => bootstrapState[containerIdx++]
  }, bootstrapState[0]);
};
