/* eslint-disable no-magic-numbers */
import { graftParentState, StateContainer } from "freactal/lib/state";


describe("state", () => {
  describe("graftParentState", () => {
    let parent;
    let parentPropSpy;
    let child;
    let childPropSpy;

    beforeEach(() => {
      parent = { b: "parentB", c: "parentC", d: "parentD" };
      parentPropSpy = sinon.spy();
      Object.defineProperty(parent, "parentProp", {
        enumerable: true,
        get () {
          parentPropSpy();
          return "parentProp";
        }
      });

      child = { d: "childD", e: "childE", f: "childF" };
      childPropSpy = sinon.spy();
      Object.defineProperty(child, "childProp", {
        enumerable: true,
        get () {
          childPropSpy();
          return "childProp";
        }
      });
    });

    it("returns state if no parent-state is provided", () => {
      const childKeysBefore = Object.keys(child);
      graftParentState(child, undefined);
      const childKeysAfter = Object.keys(child);
      expect(childKeysAfter).to.deep.equal(childKeysBefore);
    });

    it("returns an object including all child keys", () => {
      graftParentState(child, parent);
      const childKeys = Object.keys(child);
      expect(childKeys)
        .to.include("childProp").and
        .to.include("d").and
        .to.include("e").and
        .to.include("f");
    });

    it("returns an object including all parent keys", () => {
      graftParentState(child, parent);
      const childKeys = Object.keys(child);
      expect(childKeys)
        .to.include("parentProp").and
        .to.include("b").and
        .to.include("c").and
        .to.include("d");

    });

    it("only retrieves parent state when the grafted property is accessed", () => {
      graftParentState(child, parent);
      expect(parentPropSpy).not.to.have.been.called;
      expect(child.parentProp).to.equal("parentProp");
      expect(parentPropSpy).to.have.been.calledOnce;
    });

    it("returns the child's state value if key is defined on child and parent", () => {
      graftParentState(child, parent);
      expect(child.d).to.equal("childD");
    });
  });

  describe("StateContainer", () => {
    it("accepts an initial state", () => {
      const initialState = {};
      const container = new StateContainer(initialState, {}, () => {});
      expect(container.state).to.equal(initialState);
    });

    describe("getState", () => {
      it("includes primitive state values", () => {
        const initialState = { local: "value" };
        const container = new StateContainer(initialState, {}, () => {});
        expect(Object.keys(container.getState())).to.include("local");
      });

      it("includes computed state values", () => {
        const initialState = { local: "value" };
        const computed = { compound: ({ local }) => `${local}!` };
        const container = new StateContainer(initialState, computed, () => {});
        expect(Object.keys(container.getState())).to.include("compound");
      });
    });

    describe("computed state values", () => {
      it("creates real computed key/value pairs for each key/value in the definition", () => {
        const initialState = {};
        const computed = {
          a: () => "",
          b: () => "",
          c: () => ""
        };
        const container = new StateContainer(initialState, computed, () => {});

        const state = container.getState([]);
        expect(Object.keys(computed)).to.deep.equal(Object.keys(state));
      });

      it("can access local state values", () => {
        const initialState = { local: "value" };
        const computed = {
          localPlusPlus: ({ local }) => `${local}-${local}`
        };
        const container = new StateContainer(initialState, computed, () => {});

        const state = container.getState([]);
        expect(state.localPlusPlus).to.equal("value-value");
      });

      it("can access parent state values", () => {
        const initialState = {};
        const computed = {
          parentPlusPlus: ({ parent }) => `${parent}-${parent}`
        };
        const container = new StateContainer(initialState, computed, () => {});

        const state = container.getState(["parent"]);
        state.parent = "parentValue";
        expect(state.parentPlusPlus).to.equal("parentValue-parentValue");
      });

      it("can combine local and parent state values", () => {
        const initialState = { local: "value" };
        const computed = {
          localAndParent: ({ local, parent }) => `${local}-${parent}`
        };
        const container = new StateContainer(initialState, computed, () => {});

        const state = container.getState(["parent"]);
        state.parent = "parentValue";
        expect(state.localAndParent).to.equal("value-parentValue");
      });

      it("track their local dependencies", () => {
        const initialState = { local: "value" };
        const computed = {
          localPlusPlus: ({ local }) => `${local}-${local}`
        };
        const container = new StateContainer(initialState, computed, () => {});

        const state = container.getState([]);
        expect(container.computedDependants).not.to.have.property("local");
        state.localPlusPlus;
        expect(container.computedDependants)
          .to.have.property("local").and
          .to.deep.equal({ localPlusPlus: true });
      });

      it("track their parent dependencies", () => {
        const initialState = {};
        const computed = {
          parentPlusPlus: ({ parent }) => `${parent}-${parent}`
        };
        const container = new StateContainer(initialState, computed, () => {});

        const state = container.getState(["parent"]);
        state.parent = "parentValue";

        expect(container.computedDependants).not.to.have.property("parent");
        state.parentPlusPlus;
        expect(container.computedDependants)
          .to.have.property("parent").and
          .to.deep.equal({ parentPlusPlus: true });
      });

      it("are cached from one `get` to the next", () => {
        const initialState = {};
        const computed = {
          localPlusPlus: ({ local }) => `${local}-${local}`
        };
        const container = new StateContainer(initialState, computed, () => {});

        const state = container.getState(["local"]);

        let first = true;
        const localSpy = sinon.spy();
        Object.defineProperty(state, "local", {
          enumerable: true,
          get () {
            localSpy();
            if (first) {
              first = false;
              return "first";
            }
            return "not-first";
          }
        });

        expect(localSpy).not.to.have.been.called;
        expect(state.localPlusPlus).to.equal("first-first");
        expect(localSpy).to.have.been.calledOnce;
        expect(container.cachedState).to.have.property("localPlusPlus", "first-first");
        expect(state.localPlusPlus).to.equal("first-first");
        expect(localSpy).to.have.been.calledOnce;
      });

      it("are recalculated when their cache is directly invalidated", () => {
        const initialState = {};
        const computed = {
          localPlusPlus: ({ local }) => `${local}-${local}`
        };
        const container = new StateContainer(initialState, computed, () => {});

        const state = container.getState(["local"]);

        let first = true;
        const localSpy = sinon.spy();
        Object.defineProperty(state, "local", {
          enumerable: true,
          get () {
            localSpy();
            if (first) {
              first = false;
              return "first";
            }
            return "not-first";
          }
        });

        expect(localSpy).not.to.have.been.called;
        expect(state.localPlusPlus).to.equal("first-first");
        expect(localSpy).to.have.been.calledOnce;

        container.invalidateCache("local");
        expect(container.cachedState).not.to.have.property("localPlusPlus");

        expect(state.localPlusPlus).to.equal("not-first-not-first");
        expect(localSpy).to.have.been.calledTwice;
      });

      it("are recalculated when their cache is indirectly invalidated", () => {
        const initialState = {};
        const computed = {
          intermediate: ({ localPlusPlus }) => `${localPlusPlus}!`,
          localPlusPlus: ({ local }) => `${local}-${local}`
        };
        const container = new StateContainer(initialState, computed, () => {});

        const state = container.getState(["local"]);

        let first = true;
        const localSpy = sinon.spy();
        Object.defineProperty(state, "local", {
          enumerable: true,
          get () {
            localSpy();
            if (first) {
              first = false;
              return "first";
            }
            return "not-first";
          }
        });

        expect(localSpy).not.to.have.been.called;
        expect(state.intermediate).to.equal("first-first!");
        expect(localSpy).to.have.been.calledOnce;

        container.invalidateCache("local");
        expect(container.cachedState).not.to.have.property("intermediate");

        expect(state.intermediate).to.equal("not-first-not-first!");
        expect(localSpy).to.have.been.calledTwice;
      });
    });

    describe("setState", () => {
      it("updates the internal state for changed values", () => {
        const initialState = { local: "value" };
        const computed = {
          compound: ({ local }) => `${local}!`
        };
        const container = new StateContainer(initialState, computed, () => {});

        expect(container.state).to.have.property("local", "value");
        container.setState({ local: "newValue" });
        expect(container.state).to.have.property("local", "newValue");
      });

      it("invalidates cache for first-level dependencies of changed values", () => {
        const initialState = { local: "value" };
        const computed = {
          compound: ({ local }) => `${local}!`
        };
        const container = new StateContainer(initialState, computed, () => {});

        container.getState().compound;
        expect(container.cachedState).to.have.property("compound", "value!");
        container.setState({ local: "newValue" });
        expect(container.cachedState).not.to.have.property("compound");
      });

      it("invalidates cache for second-level dependencies of changes values", () => {
        const initialState = { local: "value" };
        const computed = {
          compound: ({ local }) => `${local}!`,
          veryCompound: ({ compound }) => `${compound}!!`
        };
        const container = new StateContainer(initialState, computed, () => {});

        container.getState().veryCompound;
        expect(container.cachedState).to.have.property("veryCompound", "value!!!");
        container.setState({ local: "newValue" });
        expect(container.cachedState).not.to.have.property("veryCompound");
      });

      it("notifies the StateContainer's consumer after updates are made", () => {
        const initialState = {
          a: "a",
          b: "b"
        };
        const stateChanged = sinon.spy();
        const container = new StateContainer(initialState, {}, stateChanged);

        const update = toMerge => {
          const state = container.getState();
          container.setState(Object.assign({}, state, toMerge));
        };

        expect(stateChanged).not.to.have.been.called;

        update({ a: "A" });
        expect(stateChanged.getCall(0).args[0]).to.deep.equal({ a: true });

        update({ a: "A", b: "B" });
        expect(stateChanged.getCall(1).args[0]).to.deep.equal({ b: true });

        update({ a: "AAA", b: "BBB" });
        expect(stateChanged.getCall(2).args[0]).to.deep.equal({ a: true, b: true });

        update({ a: "AAA", b: "BBB" });
        expect(stateChanged.getCall(3).args[0]).to.deep.equal({});
      });
    });
  });
});
