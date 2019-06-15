var { S, Data } = require('../..');

describe("S.run()", function () {
  describe("creation", function () {
    it("throws if no function passed in", function () {
      S.root(function () {
        expect(function () {
          //@ts-ignore
          S.run();
        }).toThrow();
      });
    });

    it("throws if arg is not a function", function () {
      S.root(function () {
        expect(function () {
          //@ts-ignore
          S.run(1);
        }).toThrow();
      });
    });

    it("returns initial value of wrapped function", function () {
      S.root(function () {
        const f = S.run(function () { return 1; });
        expect(f.get()).toBe(1);
      });
    });
  });

  describe("evaluation", function () {
    it("occurs once intitially", function () {
      S.root(function () {
        var spy = jasmine.createSpy(),
          f = S.run(spy);
        expect(spy.calls.count()).toBe(1);
      });
    });

    it("does not re-occur when read", function () {
      S.root(function () {
        var spy = jasmine.createSpy(),
          f = S.run(spy);
        f.get(); f.get(); f.get();

        expect(spy.calls.count()).toBe(1);
      });
    });
  });

  describe("with a dependency on a new Data", function () {
    it("updates when new Data is set", function () {
      S.root(function () {
        var d = new Data(1),
          fevals = 0,
          f = S.run(function () { fevals++; return d.get(); });

        fevals = 0;

        d.set(1);
        expect(fevals).toBe(1);
      });
    });

    it("does not update when new Data is read", function () {
      S.root(function () {
        var d = new Data(1),
          fevals = 0,
          f = S.run(function () { fevals++; return d.get(); });

        fevals = 0;

        d.get();
        expect(fevals).toBe(0);
      });
    });

    it("updates return value", function () {
      S.root(function () {
        var d = new Data(1),
          fevals = 0,
          f = S.run(function () { fevals++; return d.get(); });

        fevals = 0;

        d.set(2);
        expect(f.get()).toBe(2);
      });
    });
  });

  describe("with changing dependencies", function () {
    var i;
    var t;
    var e;
    var fevals;
    var f;

    function init() {
      i = new Data(true);
      t = new Data(1);
      e = new Data(2);
      fevals = 0;
      f = S.run(function () { fevals++; return i.get() ? t.get() : e.get(); });
      fevals = 0;
    }

    it("updates on active dependencies", function () {
      S.root(function () {
        init();
        t.set(5);
        expect(fevals).toBe(1);
        expect(f.get()).toBe(5);
      });
    });

    it("does not update on inactive dependencies", function () {
      S.root(function () {
        init();
        e.set(5);
        expect(fevals).toBe(0);
        expect(f.get()).toBe(1);
      });
    });

    it("deactivates obsolete dependencies", function () {
      S.root(function () {
        init();
        i.set(false);
        fevals = 0;
        t.set(5);
        expect(fevals).toBe(0);
      });
    });

    it("activates new dependencies", function () {
      S.root(function () {
        init();
        i.set(false);
        fevals = 0;
        e.set(5);
        expect(fevals).toBe(1);
      });
    });

    it("insures that new dependencies are updated before dependee", function () {
      S.root(function () {
        var order = "",
          a = new Data(0),
          b = S.run(function () {
            order += "b";
            return a.get() + 1;
          }),
          c = S.run(function () {
            order += "c";
            const check = b.get();
            if (check) {
              return check;
            }
            return d.get();
          }),
          d = S.run(function () {
            order += "d";
            return a.get() + 10;
          });

        expect(order).toBe("bcd");

        order = "";
        a.set(-1);

        expect(order).toBe("bcd");
        expect(c.get()).toBe(9);

        order = "";
        a.set(0);

        expect(order).toBe("bcd");
        expect(c.get()).toBe(1);
      });
    });
  });

  describe("that creates a new Data", function () {
    it("does not register a dependency", function () {
      S.root(function () {
        var fevals = 0, /** @type {Data} */ d = null,
          f = S.run(function () { fevals++; d = new Data(1); });
        fevals = 0;
                /** @type {*} */(d).set(2)
        expect(fevals).toBe(0);
      });
    });
  });

  describe("from a function with no return value", function () {
    it("reads as undefined", function () {
      S.root(function () {
        var f = S.run(function () { });
        expect(f.get()).not.toBeDefined();
      });
    });
  });

  describe("with a seed", function () {
    it("reduces seed value", function () {
      S.root(function () {
        var a = new Data(5),
          f = S.run(function (v) { return v + a.get(); }, 5);
        expect(f.get()).toBe(10);
        a.set(6);
        expect(f.get()).toBe(16);
      });
    });
  });

  describe("with a dependency on a computation", function () {
    var d, fcount, f, gcount, g;

    function init() {
      d = new Data(1),
        fcount = 0,
        f = S.run(function () { fcount++; return d.get(); }),
        gcount = 0,
        g = S.run(function () { gcount++; return f.get(); });
    }

    it("does not cause re-evaluation", function () {
      S.root(function () {
        init();
        expect(fcount).toBe(1);
      });
    });

    it("does not occur from a read", function () {
      S.root(function () {
        init();
        f.get();
        expect(gcount).toBe(1);
      });
    });

    it("does not occur from a read of the watcher", function () {
      S.root(function () {
        init();
        g.get();
        expect(gcount).toBe(1);
      });
    });

    it("occurs when computation updates", function () {
      S.root(function () {
        init();
        d.set(2);
        expect(fcount).toBe(2);
        expect(gcount).toBe(2);
        expect(g.get()).toBe(2);
      });
    });
  });

  describe("with unending changes", function () {
    it("throws when continually setting a direct dependency", function () {
      S.root(function () {
        var d = new Data(1);

        expect(function () {
          S.run(function () { d.get(); d.set(2); });
        }).toThrow();
      });
    });

    it("throws when continually setting an indirect dependency", function () {
      S.root(function () {
        var d = new Data(1),
          f1 = S.run(function () { return d.get(); }),
          f2 = S.run(function () { return f1.get(); }),
          f3 = S.run(function () { return f2.get(); });

        expect(function () {
          S.run(function () { f3.get(); d.set(2); });
        }).toThrow();
      });
    });
  });

  describe("with circular dependencies", function () {
    it("throws when cycle created by modifying a branch", function () {
      S.root(function () {
        var d = new Data(1),
          f = S.run(function () { return f ? f() : d.get(); });

        expect(function () { d.set(0); }).toThrow();
      });
    });
  });

  describe("with converging dependencies", function () {
    it("propagates in topological order", function () {
      S.root(function () {
        //
        //     c1
        //    /  \
        //   /    \
        //  b1     b2
        //   \    /
        //    \  /
        //     a1 
        //
        var seq = "",
          a1 = new Data(true),
          b1 = S.run(function () { a1.get(); seq += "b1"; }),
          b2 = S.run(function () { a1.get(); seq += "b2"; }),
          c1 = S.run(function () { b1.get(), b2.get(); seq += "c1"; });

        seq = "";
        a1.set(true);

        expect(seq).toBe("b1b2c1");
      });
    });

    it("only propagates once with linear convergences", function () {
      S.root(function () {
        //         d
        //         |
        // +---+---+---+---+
        // v   v   v   v   v
        // f1  f2  f3  f4  f5
        // |   |   |   |   |
        // +---+---+---+---+
        //         v
        //         g
        var d = new Data(0),
          f1 = S.run(function () { return d.get(); }),
          f2 = S.run(function () { return d.get(); }),
          f3 = S.run(function () { return d.get(); }),
          f4 = S.run(function () { return d.get(); }),
          f5 = S.run(function () { return d.get(); }),
          gcount = 0,
          g = S.run(function () { gcount++; return f1.get() + f2.get() + f3.get() + f4.get() + f5.get(); });

        gcount = 0;
        d.set(0);
        expect(gcount).toBe(1);
      });
    });

    it("only propagates once with exponential convergence", function () {
      S.root(function () {
        //     d
        //     |
        // +---+---+
        // v   v   v
        // f1  f2 f3
        //   \ | /
        //     O
        //   / | \
        // v   v   v
        // g1  g2  g3
        // +---+---+
        //     v
        //     h
        var d = new Data(0),

          f1 = S.run(function () { return d.get(); }),
          f2 = S.run(function () { return d.get(); }),
          f3 = S.run(function () { return d.get(); }),

          g1 = S.run(function () { return f1.get() + f2.get() + f3.get(); }),
          g2 = S.run(function () { return f1.get() + f2.get() + f3.get(); }),
          g3 = S.run(function () { return f1.get() + f2.get() + f3.get(); }),

          hcount = 0,
          h = S.run(function () { hcount++; return g1.get() + g2.get() + g3.get(); });

        hcount = 0;
        d.set(0);
        expect(hcount).toBe(1);
      });
    });
  });
});
