import React from "react";
import { mount } from "enzyme";

import { provideState, injectState, softUpdate } from "freactal";


const Child = ({ state }) => (
  <div className="child-value">{ state.toggleMe ? "true" : "false" }</div>
);
const ChildWithState = injectState(Child);
const wrapChildWithState = provideState({});
const StatefulChild = wrapChildWithState(ChildWithState);

const Parent = ({ state: { toggleMe }, children }) => (
  <div>
    <div className="parent-value">{ toggleMe ? "true" : "false" }</div>
    { children }
  </div>
);
const ParentWithState = injectState(Parent);

const Root = () => (
  <ParentWithState>
    <StatefulChild />
  </ParentWithState>
);
const wrapRootWithState = provideState({
  initialState: () => ({
    toggleMe: true
  }),
  effects: {
    toggle: softUpdate(state => ({ toggleMe: !state.toggleMe }))
  }
});
const StatefulRoot = wrapRootWithState(Root);


describe("nested state injections", () => {
  it("children are updated when intermediate state injections are present", async () => {
    const el = mount(<StatefulRoot />);
    expect(el.find(".parent-value").text()).to.equal("true");
    expect(el.find(".child-value").text()).to.equal("true");
    await el.instance().effects.toggle();
    expect(el.find(".parent-value").text()).to.equal("false");
    expect(el.find(".child-value").text()).to.equal("false");
  });
});

