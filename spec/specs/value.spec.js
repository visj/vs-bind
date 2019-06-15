var { S, Value } = require('../..');

describe("Value", function () {
    it("takes and returns an initial value", function () {
        expect(new Value(1).get()).toBe(1);
    });

    it("can be set by passing in a new value", function () {
        var d = new Value(1);
        d.set(2);
        expect(d.get()).toBe(2);
    });

    it("returns value being set", function () {
        var d = new Value(1);
        expect(d.set(2)).toBe(2);
    });

    it("does not propagate if set to equal value", function () {
        S.root(function () {
            var d = new Value(1),
                e = 0,
                f = S.run(function () { d.get(); return ++e; });

            expect(f.get()).toBe(1);
            d.set(1);
            expect(f.get()).toBe(1);
        });
    });

    it("propagate if set to unequal value", function () {
        S.root(function () {
            var d = new Value(1),
                e = 0,
                f = S.run(function () { d.get(); return ++e; });

            expect(f.get()).toBe(1);
            d.set(1);
            expect(f.get()).toBe(1);
            d.set(2);
            expect(f.get()).toBe(2);
        });
    });

    it("can take an equality predicate", function () {
        S.root(function () {
            var d = new Value([1], function (a, b) { 
                return a[0] === b[0]; 
            }),
                e = 0,
                f = S.run(function () { d.get(); return ++e; });

            expect(f.get()).toBe(1);
            d.set([1]);
            expect(f.get()).toBe(1);
            d.set([2]);
            expect(f.get()).toBe(2);
        });
    });
});
