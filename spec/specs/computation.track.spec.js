var { S, Data } = require('../..');

describe('S.track', () => {
  describe('executing propagating', () => {
    it('does not trigger downstream computations unless changed', () => {
      S.root(() => {
        let s1 = new Data(1);
        let order = '';
        let t1 = S.track(() => {
          order += 't1';
          return s1.get();
        });
        let c1 = S.run(() => {
          order += 'c1';
          t1.get();
        });
        expect(order).toBe('t1c1');
        order = '';
        s1.set(1);
        expect(order).toBe('t1');
        order = '';
        s1.set(2);
        expect(order).toBe('t1c1');
      });
    });

    it('applies updates to changed dependees in same order as S.run', () => {
      S.root(() => {
        let s1 = new Data(0);
        let order = '';
        let t1 = S.track(() => {
          order += 't1';
          return s1.get() === 0;
        });
        S.run(() => {
          order += 'c1';
          return s1.get();
        });
        S.run(() => {
          order += 'c2';
          return t1.get();
        });

        expect(order).toBe('t1c1c2');
        order = '';
        s1.set(1);
        expect(order).toBe('t1c2c1');
      });
    });

    it('updates downstream pending computations', () => {
      S.root(() => {
        let s1 = new Data(0);
        let s2 = new Data(0);
        let order = '';
        let t1 = S.track(() => {
          order += 't1';
          return s1.get() === 0;
        });
        let c1 = S.run(() => {
          order += 'c1';
          return s1.get();
        });
        let c2 = S.run(() => {
          order += 'c2';
          t1.get();
          S.run(() => {
            order += 'c2_1';
            return s2.get();
          });
        });
        order = '';
        s1.set(1);
        expect(order).toBe('t1c2c2_1c1');
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
      f = S.track(function () { fevals++; return i.get() ? t.get() : e.get(); });
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

    it("ensures that new dependencies are updated before dependee", function () {
      S.root(function () {
        var order = "",
          a = new Data(0),
          b = S.track(function () {
            order += "b";
            return a.get() + 1;
          }),
          c = S.track(function () {
            order += "c";
            const check = b.get();
            if (check) {
              return check;
            }
            return e.get();
          }),
          d = S.track(() => {
            return a.get();
          }),
          e = S.track(function () {
            order += "d";
            return d.get() + 10;
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

  describe('with intercepting computations', () => {
    it('does not update subsequent pending computations after stale invocations', () => {
      S.root(() => {
        let s1 = new Data(1);
        let s2 = new Data(false);
        let spy = jasmine.createSpy();
        /*
                    s1
                    |
                +---+---+
               t1 t2 c1 t3
                \       /
                   c3            
             [PN,PN,STL,void]
        */
        let t1 = S.track(() => s1.get() > 0);
        let t2 = S.track(() => s1.get() > 0);
        let c1 = S.run(() => s1.get());
        let t3 = S.track(() => {
          let a = s1.get();
          let b = s2.get();
          return a && b;
        });
        let c2 = S.run(() => {
          t1.get(); t2.get(); c1.get(); t3.get();
          spy();
        });
        s2.set(true);
        expect(spy.calls.count()).toBe(2);
        s1.set(2);
        expect(spy.calls.count()).toBe(3);
      });
    });

    it('evaluates stale computations before dependendees when trackers stay unchanged', () => {
      S.root(() => {
        let s1 = new Data(1);
        let order = '';
        let t1 = S.track(() => {
          order += 't1';
          return s1.get() > 2;
        });
        let t2 = S.track(() => {
          order += 't2';
          return s1.get() > 2;
        });
        let c1 = S.run(() => {
          order += 'c1';
          s1.get();
        });
        let c2 = S.run(() => {
          order += 'c2';
          t1.get(); t2.get(); c1.get();
        });
        order = '';
        s1.set(1);
        expect(order).toBe('t1t2c1c2');
        order = '';
        s1.set(3);
        expect(order).toBe('t1c2t2c1');
      });
    })

    it('evaluates nested trackings', () => {
      S.root(() => {
        let s1 = new Data(1);
        let s2 = new Data(1);
        let spy = jasmine.createSpy();
        let c1;
        let t1 = S.track(() => {
          c1 = S.track(() => {
            return s2.get();
          });
          return s1.get();
        });
        let c2 = S.run(() => {
          spy();
          c1.get();
        });
        s1.set(2);
        expect(spy.calls.count()).toBe(1);
      });
    });

    it('propagates in topological order', () => {
      let s1 = new Data(true);
      let order = '';
      let t1 = S.track(() => {
        order += 't1';
        return s1.get();
      });
      let t2 = S.track(() => {
        order += 't2';
        return s1.get();
      });
      let c1 = S.run(() => {
        t1.get(); t2.get();
        order += 'c1';
      });
      order = '';
      s1.set(false);
      expect(order).toBe('t1t2c1');
    });

    it('does not evaluate dependencies with tracking sources that have not changed', () => {
      S.root(() => {
        let s1 = new Data(1);
        let order = '';
        let c1, c2;
        c1 = S.run(() => {
          order += 'c1';
          if (s1.get() > 1) {
            c2.get();
          }
        });
        let t1 = S.track(() => {
          order += 't1';
          return s1.get() < 3;
        });
        let t2 = S.track(() => {
          order += 't2';
          return t1.get();
        });
        c2 = S.run(() => {
          order += 'c2';
          return t2.get();
        });
        order = '';
        s1.set(2);
        expect(order).toBe('c1t1');
        order = '';
        s1.set(3);
        expect(order).toBe('c1t1t2c2');
      });
    });

    it('correctly marks downstream computations as stale on change', () => {
      S.root(() => {
        let s1 = new Data(1);
        let order = '';
        let t1 = S.track(() => {
          order += 't1';
          return s1.get();
        });
        let c1 = S.run(() => {
          order += 'c1';
          return t1.get();
        });
        let c2 = S.run(() => {
          order += 'c2';
          return c1.get();
        });
        let c3 = S.run(() => {
          order += 'c3';
          return c2.get();
        });
        order = '';
        s1.set(2);
        expect(order).toBe('t1c1c2c3');
      });
    });

    it('is not affected by execution order in freeze', () => {
      const trigger = new Data(false);
      const data = new Data(null);
      const spy = jasmine.createSpy();
      const cache = S.track(function cache() { return trigger.get(); });
      const child = function child(data) {
        S.run(() => {
          expect(data.get()).toBe('name');
          S.cleanup(spy);
        });
        return 'Hi';
      };
      const memo = S.run(function memo() { return cache.get() ? child(data) : undefined; });
      S.run(function view() { memo.get(); });
      S.freeze(() => {
        data.set('name');
        trigger.set(true);
      });
      S.freeze(() => {
        trigger.set(false);
        data.set(undefined);
      });
      expect(spy.calls.count()).toBe(1);
    });

  });

  describe("with unending changes", function () {
    it("throws when continually setting a direct dependency", function () {
      S.root(function () {
        var d = new Data(1);

        expect(function () {
          S.track(function () { return d.set(d.get() + 1); });
        }).toThrow();
      });
    });

    it("throws when continually setting an indirect dependency", function () {
      S.root(function () {
        let i = 2;
        var d = new Data(1),
          f1 = S.track(function () { return d.get(); }),
          f2 = S.track(function () { return f1.get(); }),
          f3 = S.track(function () { return f2.get(); });

        expect(function () {
          S.track(function () {
            f3.get();
            d.set(i++);
          });
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
});