export const hardUpdate = newState => state => Object.assign({}, state, newState);
export const softUpdate = fn => state => Object.assign({}, state, fn(state));
