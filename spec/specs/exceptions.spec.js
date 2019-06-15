var { S, Data } = require('../..');

describe("exceptions within S computations", function () {
    it("halt updating", function () {
        S.root(function () {
            var a = new Data(false),
                b = new Data(1),
                c = S.run(() => { if (a.get()) throw new Error("xxx"); }),
                d = S.run(() => b.get());
            
            expect(() => S.freeze(() => {
                a.set(true);
                b.set(2);
            })).toThrowError(/xxx/);

            expect(b.get()).toBe(2);
            expect(d.get()).toBe(1);
        });
    });

    it("do not leave stale scheduled updates", function () {
        S.root(function () {
            var a = new Data(false),
                b = new Data(1),
                c = S.run(() => { if (a.get()) throw new Error("xxx"); }),
                d = S.run(() => b.get());
            
            expect(() => S.freeze(() => {
                a.set(true);
                b.set(2);
            })).toThrowError(/xxx/);

            expect(d.get()).toBe(1);

            // updating a() should not trigger previously scheduled updated of b(), since htat propagation excepted
            a.set(false);

            expect(d.get()).toBe(1);
        });
    });

    it("leave non-excepted parts of dependency tree intact", function () {
        S.root(function () {
            var a = new Data(false),
                b = new Data(1),
                c = S.run(() => { if (a.get()) throw new Error("xxx"); }),
                d = S.run(() => b.get());
            
            expect(() => S.freeze(() => {
                a.set(true);
                b.set(2);
            })).toThrowError(/xxx/);

            expect(b.get()).toBe(2);
            expect(d.get()).toBe(1);

            b.set(3);

            expect(b.get()).toBe(3);
            expect(d.get()).toBe(3);
        });
    });
});