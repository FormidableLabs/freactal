const isFunction = (func) => func && typeof func === "function"

export const getEffects = (hocState, effectDefs, parentEffects) => {
  const applyReducer = reducer => {
    let result = reducer;

    if (isFunction(reducer)) {
      result = reducer(hocState.state);
      hocState.setState(result);
    }

    return result;
  };

  const effects = Object.keys(effectDefs).reduce((memo, effectKey) => {
    const effectFn = effectDefs[effectKey];

    memo[effectKey] = (...args) => Promise.resolve()
      .then(() => effectFn(effects, ...args))
      .then(applyReducer);

    return memo;
  }, Object.assign({}, parentEffects));

  return effects;
};
