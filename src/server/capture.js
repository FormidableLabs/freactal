import { default as React, Component } from "react";

import { contextTypes } from "../context";


export const constructCapture = () => {
  const state = [];
  const context = {
    freactal: { captureState: containerState => state.push(containerState) }
  };
  return { state, context };
};


class CaptureState extends Component {
  getChildContext () {
    return this.props.capture.context;
  }

  render () {
    return this.props.children;
  }
}
CaptureState.childContextTypes = contextTypes;

export const captureState = rootComponent => {
  const capture = constructCapture();

  const Captured = (
    <CaptureState capture={capture}>
      { rootComponent }
    </CaptureState>
  );

  return {
    state: capture.state,
    Captured
  };
};
