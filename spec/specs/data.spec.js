var { S, Data } = require('../..');

describe("Data", () => {
  it("accepts and sets initial value", () => {
    expect(new Data(1).get()).toBe(1);
  });

  it("sets new value", () => {
    var s = new Data(1);
    s.set(2);
    expect(s.get()).toBe(2);
  });

  it("returns value being set", () => {
    expect(new Data(1).set(2)).toBe(2);
  });

  it("does not throw if set to the same value twice in a freeze", function () {
    var d = new Data(1);
    S.freeze(() => {
      d.set(2);
      d.set(2);
    });
    expect(d.get()).toBe(2);
  });

  it("throws if set to two different values in a freeze", function () {
    const d = new Data(1);
    S.freeze(() => {
      d.set(2);
      expect(() => d.set(3)).toThrowError(/Conflict/);
    });
  });

  it("does not throw if set to the same value twice in a computation", function () {
    S.root(() => {
      const d = new Data(1);
      S.run(() => {
        d.set(2);
        d.set(2);
      });
      expect(d.get()).toBe(2);
    });
  });

  it("throws if set to two different values in a computation", function () {
    S.root(() => {
      const d = new Data(1);
      S.run(() => {
        d.set(2);
        expect(() => d.set(3)).toThrowError(/Conflict/);
      });
    });
  });
})