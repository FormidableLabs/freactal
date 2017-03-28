export const getEffects = (hocState, effectDefs) => {
  const applyReducer = reducer => hocState.setState(reducer(hocState.state));

  const effects = Object.keys(effectDefs).reduce((memo, effectKey) => {
    const effectFn = effectDefs[effectKey];

    memo[effectKey] = (...args) => Promise.resolve()
      .then(() => effectFn(effects, ...args))
      .then(applyReducer);

    return memo;
  }, Object.create(null));

  return effects;
};
