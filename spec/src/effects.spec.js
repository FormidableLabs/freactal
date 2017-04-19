import { getEffects } from "freactal/lib/effects";

describe("effects", () => {
  it("returns an object with same keys as effect definition object", () => {
    const hocState = {
      setState: sinon.spy(),
      state: {}
    };
    const effects = getEffects(hocState, {
      effectA: () => state => state,
      effectB: () => state => state,
      effectC: () => state => state
    });

    expect(effects).to.have.property("effectA");
    expect(effects).to.have.property("effectB");
    expect(effects).to.have.property("effectC");
  });

  it("invokes the effect function with effects object", () => {
    const hocState = {
      setState: sinon.spy(),
      state: {}
    };
    const effects = getEffects(hocState, {
      effectA: _effects => Promise.resolve().then(() => {
        expect(_effects).to.equal(effects);
        return state => state;
      })
    });

    return effects.effectA();
  });

  it("can access their parent effects", () => {
    const parentHocState = {
      setState: sinon.spy(),
      state: {}
    };
    const parentEffects = getEffects(parentHocState, {
      parentEffect: (effects, parentVal) => () => ({ parentVal })
    });

    const childHocState = {
      setState: sinon.spy(),
      state: {}
    };
    const childEffects = getEffects(childHocState, {
      childEffect: (effects, parentVal, childVal) => effects.parentEffect(parentVal)
        .then(() => () => ({ childVal }))
    }, parentEffects);

    return childEffects.childEffect("parent", "child").then(() => {
      expect(parentHocState.setState).to.have.been.calledOnce;
      expect(parentHocState.setState).to.have.been.calledWith({ parentVal: "parent" });
      expect(childHocState.setState).to.have.been.calledOnce;
      expect(childHocState.setState).to.have.been.calledWith({ childVal: "child" });
    });
  });
});
