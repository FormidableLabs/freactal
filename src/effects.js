export const getEffects = (hocState, effectDefs) => {
  const applyReducer = reducer => {
    const newState = reducer(hocState.state);
    return hocState.setState(newState);
  };

  const effects = Object.keys(effectDefs).reduce((memo, effectKey) => {
    const effectFn = effectDefs[effectKey];
    memo[effectKey] = (...args) => Promise.resolve(effectFn(effects, ...args))
      .then(applyReducer);
    return memo;
  }, Object.create(null));

  return effects;
};
