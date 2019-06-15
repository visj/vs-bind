var { S, Data } = require('../..');

describe("S.on(...)", function () {
    it("registers a dependency", function () {
        S.root(function () {
            var d = new Data(1),
                spy = jasmine.createSpy(),
                f = S.on(d, function () { spy(); });

            expect(spy.calls.count()).toBe(1);

            d.set(2);

            expect(spy.calls.count()).toBe(2);
        });
    });

    it("prohibits dynamic dependencies", function () {
        S.root(function () {
            var d = new Data(1),
                spy = jasmine.createSpy("spy"),
                s = S.on(function () { }, function () { spy(); return d.get(); });
            expect(spy.calls.count()).toBe(1);

            d.set(2);

            expect(spy.calls.count()).toBe(1);
        });
    });

    it("allows multiple dependencies", function () {
        S.root(function () {
            var a = new Data(1),
                b = new Data(2),
                c = new Data(3),
                spy = jasmine.createSpy(),
                f = S.on(function () { a.get(); b.get(); c.get();  }, function () { spy(); });

            expect(spy.calls.count()).toBe(1);

            a.set(4);
            b.set(5);
            c.set(6);

            expect(spy.calls.count()).toBe(4);
        });
    });

    it("allows an array of dependencies", function () {
        S.root(function () {
            var a = new Data(1),
                b = new Data(2),
                c = new Data(3),
                spy = jasmine.createSpy(),
                f = S.run(S.bind([a, b, c], function () { spy(); }));

            expect(spy.calls.count()).toBe(1);

            a.set(4);
            b.set(5);
            c.set(6);

            expect(spy.calls.count()).toBe(4);
        });
    });

    it("modifies its accumulator when reducing", function () {
        S.root(function () {
            var a = new Data(1),
                c = S.on(a, function (ev, sum) { return sum + ev; }, 0);

            expect(c.get()).toBe(1);

            a.set(2);

            expect(c.get()).toBe(3);

            a.set(3);
            a.set(4);

            expect(c.get()).toBe(10);
        });
    });

    it("suppresses initial run when onchanges is true", function () {
        S.root(function () {
            var a = new Data(1),
                c = S.on(a, function (v) { return v * 2; }, 0, true);
           
            expect(c.get()).toBe(0);

            a.set(2);

            expect(c.get()).toBe(4);
        });
    })
});
