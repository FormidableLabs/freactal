let warningShown = false;
const displayDeprecationMessage = () => {
  if (warningShown) {
    return;
  }
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
export const update = fnOrNewState =>
  typeof fnOrNewState === "function" ? softUpdate(fnOrNewState) : hardUpdate(fnOrNewState);
