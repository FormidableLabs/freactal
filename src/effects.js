export const getEffects = (hocState, effectDefs, parentEffects) => {
  const applyReducer = reducer => reducer ?
    hocState.setState(reducer(hocState.state)) :
    null;

  const effects = Object.keys(effectDefs).reduce((memo, effectKey) => {
    const effectFn = effectDefs[effectKey];

    memo[effectKey] = (...args) => Promise.resolve()
      .then(() => effectFn(effects, ...args))
      .then(applyReducer);

    return memo;
  }, Object.assign({}, parentEffects));

  return effects;
};
