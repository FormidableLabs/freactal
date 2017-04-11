export const hardUpdate = newState => () => state => Object.assign({}, state, newState);
export const softUpdate = fn =>
  (effects, ...args) => state => Object.assign({}, state, fn(state, ...args));
