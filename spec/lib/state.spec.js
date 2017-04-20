import { graftParentState } from "freactal/lib/state";


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
});
