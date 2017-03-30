import { PropTypes } from "react";


export const contextTypes = {
  state: PropTypes.object,
  effects: PropTypes.object,
  __captureState__: PropTypes.any,
  __getNextContainerState__: PropTypes.func
};
