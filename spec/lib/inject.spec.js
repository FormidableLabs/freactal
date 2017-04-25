import { default as React, Component } from "react";
import { mount } from "enzyme";

import { injectState, BaseInjectStateHoc } from "freactal/lib/inject";


const StatelessComponent = ({ state, useState }) => useState ?
  <div>{state.stateKey}</div> :
  <div />;
const getInjectedEl = (freactalCxt, keys, useState = false) => {
  const Injected = injectState(StatelessComponent, keys);
  return mount(<Injected useState={useState} />, {
    context: {
      freactal: freactalCxt
    }
  });
};


describe.only("injected state", () => {
  it("throws an error if used without state in the tree", () => {
    expect(() => getInjectedEl())
      .to.throw("Attempted to inject state without parent Freactal state container.");
  });

  it("subscribes to state changes", () => {
    const update = sandbox.stub(BaseInjectStateHoc.prototype, "update");

    const cxt = {
      state: {},
      effects: {},
      subscribe: sandbox.spy()
    };

    getInjectedEl(cxt);

    expect(cxt.subscribe).to.have.been.calledOnce;
    expect(update).not.to.have.been.called;
    cxt.subscribe.args[0][0]("hi");
    expect(update).to.have.been.calledWith("hi");
  });

  describe("for explicitly defined keys", () => {
    it("is updated when specified keys change", () => {
      sandbox.stub(Component.prototype, "forceUpdate");

      const cxt = {
        state: {},
        effects: {},
        subscribe: sandbox.spy()
      };

      getInjectedEl(cxt, ["stateKey"]);
      const instanceUpdate = cxt.subscribe.args[0][0];

      expect(Component.prototype.forceUpdate).not.to.have.been.called;
      instanceUpdate({
        otherStateKey: true,
        stateKey: true
      });
      expect(Component.prototype.forceUpdate).to.have.been.calledOnce;
    });

    it("is not updated when non-specified keys change", () => {
      sandbox.stub(Component.prototype, "forceUpdate");

      const cxt = {
        state: {},
        effects: {},
        subscribe: sandbox.spy()
      };

      getInjectedEl(cxt, ["stateKey"]);
      const instanceUpdate = cxt.subscribe.args[0][0];

      expect(Component.prototype.forceUpdate).not.to.have.been.called;
      instanceUpdate({
        otherStateKey: true,
        anotherStateKey: true
      });
      expect(Component.prototype.forceUpdate).not.to.have.been.called;
    });
  });

  describe("for implicit/tracked keys", () => {
    it("is updated when previously used keys change", () => {
      sandbox.stub(Component.prototype, "forceUpdate");

      const cxt = {
        state: {
          stateKey: "someValue",
          otherStateKey: "someOtherValue"
        },
        effects: {},
        subscribe: sandbox.spy()
      };

      getInjectedEl(cxt, null, true);
      const instanceUpdate = cxt.subscribe.args[0][0];

      expect(Component.prototype.forceUpdate).not.to.have.been.called;
      instanceUpdate({
        otherStateKey: true,
        stateKey: true
      });
      expect(Component.prototype.forceUpdate).to.have.been.calledOnce;
    });

    it("is not updated when previously unused keys change", () => {
      sandbox.stub(Component.prototype, "forceUpdate");

      const cxt = {
        state: {
          stateKey: "someValue",
          otherStateKey: "someOtherValue",
          anotherStateKey: "something"
        },
        effects: {},
        subscribe: sandbox.spy()
      };

      getInjectedEl(cxt, null, true);
      const instanceUpdate = cxt.subscribe.args[0][0];

      expect(Component.prototype.forceUpdate).not.to.have.been.called;
      instanceUpdate({
        otherStateKey: true,
        anotherStateKey: true
      });
      expect(Component.prototype.forceUpdate).not.to.have.been.called;
    });
  });

  it("exposes state and effects to the wrapped component", () => {
    const cxt = {
      state: {
        stateKey: "someValue",
        otherStateKey: "someOtherValue",
        anotherStateKey: "something"
      },
      effects: {},
      subscribe: sandbox.spy()
    };

    const el = getInjectedEl(cxt);

    expect(el.find(StatelessComponent).props()).to.include.keys(["state", "effects"]);
  });
});
