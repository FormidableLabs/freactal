export const getEffects = (hocState, effectDefs, parentEffects) => {
  const applyReducer = reducer => {
    const result = reducer ? reducer(hocState.state) : null;
    if (result) {
      hocState.setState(result);
    }

    return result;
  };

  const effects = Object.keys(effectDefs).reduce((memo, effectKey) => {
    const effectFn = effectDefs[effectKey];

    memo[effectKey] = (...args) => new Promise(resolve =>
      resolve(effectFn(effects, ...args))
    )
      .then(applyReducer);

    return memo;
  }, Object.assign({}, parentEffects, { initialize: null, finalize: null }));

  return effects;
};
