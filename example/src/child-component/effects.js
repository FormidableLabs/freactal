const IS_BROWSER = typeof window === "object";


export const initialize = effects => IS_BROWSER ?
  Promise.resolve() :
  new Promise(resolve => {
    setTimeout(() => {
      resolve(state => Object.assign({}, state, {
        localValue: "ssr initialized value"
      }));
    }, 2000);
  });
