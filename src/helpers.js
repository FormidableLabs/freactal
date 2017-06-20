let warningShown = false;
const displayDeprecationMessage = () => {
  if (warningShown) { return; }
  warningShown = true;
  // eslint-disable-next-line no-console
  console.log("Both `hardUpdate` and `softUpdate` are deprecated.  Please use `update` instead.");
};

export const hardUpdate = newState => {
  displayDeprecationMessage();
  return () => state => Object.assign({}, state, newState);
};

export const softUpdate = fn => {
  displayDeprecationMessage();
  return (effects, ...args) => state => Object.assign({}, state, fn(state, ...args));
};

export const update = fnOrNewState => {
  if (typeof fnOrNewState === 'function') {
    return softUpdate(fnOrNewState)
  }

  if (typeof fnOrNewState === 'object') {
    return hardUpdate(fnOrNewState)
  }

  throw new Error("update must receive a reducer function or object to merge as its argument.");
}

export const mergeIntoState = dataToMerge => state => Object.assign({}, state, dataToMerge);
