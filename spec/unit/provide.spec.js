import { default as React } from "react";
import { mount } from "enzyme";

import { provideState, BaseStatefulComponent } from "freactal/lib/provide";
import { contextTypes } from "freactal/lib/context";


const ChildContextComponent = () => <div />;
const StatelessComponent = (props, context) => <ChildContextComponent {...context} />;
StatelessComponent.contextTypes = contextTypes;

const getStateful = (opts = {}) => provideState(opts)(StatelessComponent);
const findChildContext = el => el.find(ChildContextComponent).props();


describe("state provider", () => {
  it("passes down props to its wrapped component", () => {
    const Stateful = getStateful();
    const el = mount(<Stateful a="a" b="b" />);
    const stateless = el.find(StatelessComponent);
    expect(stateless).to.have.props({
      a: "a",
      b: "b"
    });
  });

  describe("upon mounting", () => {
    it("invokes its `initialize` effect", () => {
      return new Promise(resolve => {
        const Stateful = getStateful({
          effects: { initialize: resolve }
        });
        mount(<Stateful />);
      });
    });

    it("subscribes to updates further up the tree", () => {
      const relayUpdate = sandbox.stub(BaseStatefulComponent.prototype, "relayUpdate");
      const context = {
        freactal: {
          subscribe: sinon.spy()
        }
      };
      const Stateful = getStateful();
      mount(<Stateful />, { context });

      expect(context.freactal.subscribe).to.have.been.calledOnce;
      const subscribeArg = context.freactal.subscribe.args[0][0];
      expect(relayUpdate).not.to.have.been.called;
      subscribeArg({ changed: "keys go here" });
      expect(relayUpdate)
        .to.have.been.calledOnce.and
        .to.have.been.calledWith({ changed: "keys go here" });
    });
  });

  describe("upon unmounting", () => {
    it("invokes its `finalize` effect", () => {
      return new Promise(resolve => {
        const Stateful = getStateful({
          effects: { finalize: resolve }
        });
        mount(<Stateful />).unmount();
      });
    });
  });

  describe("context", () => {
    it("preserves parent freactal context where no conflicts exist", () => {
      const context = {
        freactal: {
          subscribe: sinon.spy(),
          some: "value"
        }
      };

      const Stateful = getStateful();
      const el = mount(<Stateful />, { context });
      const childContext = findChildContext(el);

      expect(childContext).to.have.property("freactal");
      expect(childContext.freactal).to.have.property("some", "value");
    });

    it("captures SSR state when requested", () => {
      const context = {
        freactal: {
          subscribe: sinon.spy(),
          captureState: sinon.spy()
        }
      };

      const Stateful = getStateful({ initialState: () => ({ my: "state" }) });
      mount(<Stateful />, { context });
      expect(context.freactal.captureState).to.have.been.calledWith({ my: "state" });
    });

    it("has middleware applied", () => {
      const context = {
        freactal: {
          subscribe: sinon.spy()
        }
      };

      const Stateful = getStateful({
        middleware: [
          cxt => Object.assign(cxt, { changed: "context" })
        ]
      });
      const el = mount(<Stateful />, { context });
      const childContext = findChildContext(el);

      expect(childContext).to.have.property("freactal");
      expect(childContext.freactal).to.have.property("changed", "context");
    });

    it("has state attached", () => {
      const context = {
        freactal: {
          subscribe: sinon.spy()
        }
      };

      const Stateful = getStateful({
        initialState: () => ({ my: "state" })
      });
      const el = mount(<Stateful />, { context });
      const childContext = findChildContext(el);

      expect(childContext).to.have.property("freactal");
      expect(childContext.freactal)
        .to.have.property("state").and
        /* expect state */.to.have.property("my", "state");
    });

    it("has effects attached", () => {
      const context = {
        freactal: {
          subscribe: sinon.spy()
        }
      };

      const effectSpy = sinon.spy();
      const Stateful = getStateful({
        effects: {
          doThing: () => state => (effectSpy(), state)
        }
      });
      const el = mount(<Stateful />, { context });
      const childContext = findChildContext(el);

      expect(childContext).to.have.property("freactal");
      expect(childContext.freactal)
        .to.have.property("effects").and
        /* expect effects */.to.have.property("doThing");

      return childContext.freactal.effects.doThing().then(() => {
        expect(effectSpy).to.have.been.calledOnce;
      });
    });

    it("allows children to subscribe to changes", () => {
      const subscribe = sandbox.stub(BaseStatefulComponent.prototype, "subscribe");
      const Stateful = getStateful();
      const el = mount(<Stateful />);
      const childContext = findChildContext(el);

      expect(childContext).to.have.property("freactal");
      expect(childContext.freactal).to.have.property("subscribe");

      expect(subscribe).not.to.have.been.called;
      childContext.freactal.subscribe();
      expect(subscribe).to.have.been.calledOnce;
    });
  });

  describe("updates", () => {
    it("can be subscribed to", () => {
      const Stateful = getStateful();
      const instance = mount(<Stateful />).instance();
      const onUpdate = sinon.spy();

      expect(instance.subscribers).to.have.length(0);
      const unsubscribe = instance.subscribe(onUpdate);
      expect(instance.subscribers).to.have.length(1);

      instance.subscribers[0]();
      expect(onUpdate).to.have.been.calledOnce;

      unsubscribe();
      expect(instance.subscribers.filter(x => x)).to.have.length(0);
    });

    describe("that are local", () => {
      it("occur asynchronously via a Promise", () => {
        const Stateful = getStateful();
        const instance = mount(<Stateful />).instance();
        const p = instance.pushUpdate({});

        expect(typeof p.then).to.equal("function");

        return p;
      });

      it("do not occur if no state keys have changed", () => {
        const Stateful = getStateful();
        const instance = mount(<Stateful />).instance();
        const subscriber = sinon.spy();
        instance.subscribers = [subscriber];

        return instance.pushUpdate({}).then(() => {
          expect(subscriber).not.to.have.been.called;
        });
      });

      it("result in a local freactal context update", () => {
        sandbox.stub(BaseStatefulComponent.prototype, "invalidateChanged");
        sandbox.stub(BaseStatefulComponent.prototype, "buildContext")
          .returns({ some: "new context" });

        const Stateful = getStateful();
        const instance = mount(<Stateful />).instance();

        return instance.pushUpdate({}).then(() => {
          expect(instance.childContext).to.have.property("some", "new context");
        });
      });

      it("invalidate the changed keys", () => {
        const changedKeys = { someChangedKeys: true };

        // eslint-disable-next-line max-len
        const invalidateChanged = sandbox.stub(BaseStatefulComponent.prototype, "invalidateChanged");
        sandbox.stub(BaseStatefulComponent.prototype, "buildContext");

        const Stateful = getStateful();
        const instance = mount(<Stateful />).instance();

        return instance.pushUpdate(changedKeys).then(() => {
          expect(invalidateChanged).to.have.been.calledWith(changedKeys);
        });
      });

      it("are pushed to local subscribers", () => {
        const changedKeys = { someChangedKeys: true };
        const relayedChangedKeys = {
          someChangedKeys: true,
          withSomeLocalKeys: true
        };

        sandbox.stub(BaseStatefulComponent.prototype, "invalidateChanged")
          .returns(relayedChangedKeys);
        sandbox.stub(BaseStatefulComponent.prototype, "buildContext");

        const Stateful = getStateful();
        const instance = mount(<Stateful />).instance();
        const subscriber = sinon.spy();
        instance.subscribers = [subscriber];

        return instance.pushUpdate(changedKeys).then(() => {
          expect(subscriber).to.have.been.calledWith(relayedChangedKeys);
        });
      });
    });

    describe("that are relayed", () => {
      it("invalidate the changed keys", () => {
        const invalidateChanged = sandbox.stub(
          BaseStatefulComponent.prototype,
          "invalidateChanged"
        );
        const Stateful = getStateful();
        const instance = mount(<Stateful />).instance();

        instance.relayUpdate({
          a: "few",
          changed: "keys"
        });

        expect(invalidateChanged).to.have.been.calledWith({
          a: "few",
          changed: "keys"
        });
      });

      it("are relayed to local subscribers", () => {
        sandbox.stub(
          BaseStatefulComponent.prototype,
          "invalidateChanged"
        ).returns({
          a: "few",
          changed: "keys",
          and: "one extra computed key"
        });
        const subscriber = sinon.stub();

        const Stateful = getStateful();
        const instance = mount(<Stateful />).instance();
        instance.subscribers = [subscriber];

        instance.relayUpdate({
          a: "few",
          changed: "keys"
        });

        expect(subscriber).to.have.been.calledWith({
          a: "few",
          changed: "keys",
          and: "one extra computed key"
        });
      });
    });
  });

  describe("cache", () => {
    describe("invalidation", () => {
      it("occurs for directly dependant keys", () => {
        const Stateful = getStateful();
        const instance = mount(<Stateful />).instance();
        sandbox.stub(instance.stateContainer, "invalidateCache");

        instance.stateContainer.computedDependants.stateKey = { computedKey: true };

        const relayedChangedKeys = instance.invalidateChanged({ stateKey: true });

        expect(instance.stateContainer.invalidateCache).to.have.been.calledWith("stateKey");
        expect(relayedChangedKeys).to.deep.equal({
          stateKey: true,
          computedKey: true
        });
      });

      it("occurs for indirectly dependant keys", () => {
        const Stateful = getStateful();
        const instance = mount(<Stateful />).instance();
        sandbox.stub(instance.stateContainer, "invalidateCache");

        instance.stateContainer.computedDependants.stateKey = { computedKey: true };
        instance.stateContainer.computedDependants.computedKey = { doubleComputedKey: true };

        const relayedChangedKeys = instance.invalidateChanged({ stateKey: true });

        expect(instance.stateContainer.invalidateCache).to.have.been.calledWith("stateKey");
        expect(relayedChangedKeys).to.deep.equal({
          stateKey: true,
          computedKey: true,
          doubleComputedKey: true
        });
      });
    });
  });
});
