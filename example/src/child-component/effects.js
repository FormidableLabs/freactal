export const initialize = effects => new Promise(resolve => {
  setTimeout(() => {
    resolve(state => Object.assign({}, state, {
      localValue: "ssr initialized value"
    }));
  }, 2000);
});
