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

  getTrackedState (computedKey, stateObj, accessibleKeys) {
    const { computedDependants } = this;
    const stateProxy = Object.create(null);

    accessibleKeys.forEach(stateKey => {
      Object.defineProperty(stateProxy, stateKey, {
        get () {
          computedDependants[stateKey] = computedDependants[stateKey] || Object.create(null);
          computedDependants[stateKey][computedKey] = true;
          return stateObj[stateKey];
        }
      });
    });

    return stateProxy;
  }

  defineComputedStateProperties (state, parentKeys) {
    const { cachedState, getTrackedState, computed } = this;

    const computedKeys = Object.keys(computed);
    const accessibleKeys = [].concat(computedKeys, Object.keys(state), parentKeys);

    computedKeys.forEach(computedKey => {
      const trackedState = getTrackedState(computedKey, state, accessibleKeys);

      Object.defineProperty(state, computedKey, {
        enumerable: true,
        get () {
          if (computedKey in cachedState) { return cachedState[computedKey]; }
          return cachedState[computedKey] = computed[computedKey](trackedState);
        }
      });
    });
  }

  getState (parentKeys) {
    const state = Object.create(null);
    Object.assign(state, this.state);
    this.defineComputedStateProperties(state, parentKeys);
    return state;
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
