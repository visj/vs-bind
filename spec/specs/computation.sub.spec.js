var { S, Data } = require('../..');

describe("S.run() with subcomputations", function () {

    it("does not register a dependency on the subcomputation", function () {
        S.root(function () {
            var d = new Data(1),
                spy = jasmine.createSpy("spy"),
                gspy = jasmine.createSpy("gspy"),
                f = S.run(function () { spy(); var g = S.run(function () { gspy(); return d.get(); }); })

            spy.calls.reset();
            gspy.calls.reset();

            d.set(2);

            expect(gspy.calls.count()).toBe(1);
            expect(spy.calls.count()).toBe(0);
        });
    });

    describe("with child", function () {
        var d, e, fspy, f, gspy, g, h;

        function init() {
            d = new Data(1);
            e = new Data(2);
            fspy = jasmine.createSpy("fspy");
            gspy = jasmine.createSpy("gspy");
            f = S.run(function () {
                fspy();
                d.get();
                g = S.run(function () {
                    gspy();
                    return e.get();
                });
            });
            h = g;
            h.get();
        }

        it("creates child on initialization", function () {
            S.root(function () {
                init();
                expect(h.get()).toBe(2);
            });
        });

        it("does not depend on child's dependencies", function () {
            S.root(function () {
                init();
                e.set(3);
                expect(fspy.calls.count()).toBe(1);
                expect(gspy.calls.count()).toBe(2);
            });
        });

        it("disposes old child when updated", function () {
            S.root(function () {
                init();
                // re-evalue parent, thereby disposing stale g, which we've stored at h
                d.set(2);
                e.set(3);
                // h is now disposed
                expect(h.get()).toBe(2);
            });
        });

        it("disposes child when it is disposed", function () {
            const dispose = S.root(function (dispose) {
                init();
                return dispose;
            });
            
            dispose();
            e.set(3);
            expect(g.get()).toBe(2);
        });
    });

    describe("which disposes sub that's being updated", function () {
        it("propagates successfully", function () {
            S.root(function () {
                var a = new Data(1),
                    b = S.run(function () {
                        var c = S.run(function () { return a.get(); });
                        a.get();
                        return { c: c };
                    }),
                    d = S.run(function () {
                        return b.get().c.get();
                    });
                
                expect(d.get()).toBe(1);
                a.set(2);
                expect(d.get()).toBe(2);
                a.set(3);
                expect(d.get()).toBe(3);
            });
        });
    });
    
    describe("which disposes a sub with a dependee with a sub", function () {
        it("propagates successfully", function () {
            S.root(function () {
                var a = new Data(1),
                    c,
                    b = S.run(function () {
                        c = S.run(function () {
                            return a.get();
                        });
                        a.get();
                        return { c : c };
                    }),
                    d = S.run(function () {
                        c.get();
                        var e = S.run(function () {
                            return a.get();
                        });
                        return { e : e };
                    });
                    
                expect(d.get().e.get()).toBe(1);
                a.set(2);
                expect(d.get().e.get()).toBe(2);
                a.set(3);
                expect(d.get().e.get()).toBe(3);
            });
        });
    });
});
