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
});
