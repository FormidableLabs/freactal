import React from "react";
import { mount } from "enzyme";

import { provideState, injectState, softUpdate } from "freactal";


const Child = () => <div />;
const ChildWithState = injectState(Child);
const wrapChildWithState = provideState({});
const StatefulChild = wrapChildWithState(ChildWithState);

const Parent = ({ state: { renderChildren, finalized }, children }) => (
  <div>
    <div className="parent-finalized">{ finalized ? "true" : "false" }</div>
    {renderChildren ? children : null}
  </div>
);
const ParentWithState = injectState(Parent);
const wrapParentWithState = provideState({
  initialState: () => ({
    finalized: false
  }),
  effects: {
    finalize: softUpdate(() => ({ finalized: true }))
  }
});
const StatefulParent = wrapParentWithState(ParentWithState);

const Root = () => (
  <StatefulParent>
    <StatefulChild />
  </StatefulParent>
);
const wrapRootWithState = provideState({
  initialState: () => ({
    renderChildren: true
  }),
  effects: {
    toggelChildren: softUpdate(state => ({ renderChildren: !state.renderChildren }))
  }
});
const StatefulRoot = wrapRootWithState(Root);


describe("finalize", () => {
  it("parent's `finalize` is not called when a child is unmounted", async () => {
    const el = mount(<StatefulRoot />);
    await el.instance().effects.toggelChildren();
    expect(el.find(".parent-finalized").text()).to.equal("false");
  });
});
