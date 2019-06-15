var { S, Data } = require('../..');

describe("S.root()", function () {
  it("allows subcomputations to escape their parents", function () {
    S.root(function () {
      var outerTrigger = new Data(null),
        innerTrigger = new Data(null),
        outer,
        innerRuns = 0;

      outer = S.run(function () {
        // register dependency to outer trigger
        outerTrigger.get();
        // inner computation
        S.root(function () {
          S.run(function () {
            // register dependency on inner trigger
            innerTrigger.get();
            // count total runs
            innerRuns++;
          });
        });
      });

      // at start, we have one inner computation, that's run once
      expect(innerRuns).toBe(1);

      // trigger the outer computation, making more inners
      outerTrigger.set(null);
      outerTrigger.set(null);

      expect(innerRuns).toBe(3);

      // now trigger inner signal: three orphaned computations should equal three runs
      innerRuns = 0;
      innerTrigger.set(null);

      expect(innerRuns).toBe(3);
    });
  });

  //it("is necessary to create a toplevel computation", function () {
  //    expect(() => {
  //        S.run(() => 1)
  //    }).toThrowError(/root/);
  //});

  it("does not freeze updates when used at top level", function () {
    S.root(() => {
      var s = new Data(1),
        c = S.run(() => s.get());

      expect(c.get()).toBe(1);

      s.set(2);

      expect(c.get()).toBe(2);

      s.set(3);

      expect(c.get()).toBe(3);
    });
  });

  it("persists through entire scope when used at top level", () => {
    S.root(() => {
      var s = new Data(1),
        c1 = S.run(() => s.get());

      s.set(2);

      var c2 = S.run(() => s.get());

      s.set(3);

      expect(c2.get()).toBe(3);
    });
  });
});
