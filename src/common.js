const symbolSupported = typeof Symbol === "function";

export const HYDRATE = symbolSupported ? Symbol("__hydrate__") : "__hydrate__";
