var { S, Data } = require('../..');

describe("Computations which modify data", function () {
    it("freeze data while executing computation", function () {
        S.root(function () {
            var a = new Data(false),
                b = new Data(0),
                cb,
                c = S.run(function () { if (a.get()) { b.set(1); cb = b.get(); a.set(false); } });
            
            b.set(0);
            a.set(true);
            
            expect(b.get()).toBe(1);
            expect(cb).toBe(0);
        });
    });
    
    it("freeze data while propagating", function () {
        S.root(function () {
            var seq = "",
                a = new Data(false),
                b = new Data(0),
                db,
                c = S.run(function () { if (a.get()) { seq += "c"; b.set(1); a.set(false); } }),
                d = S.run(function () { if (a.get()) { seq += "d"; db = b.get(); } });
            
            b.set(0);
            seq = "";
            a.set(true);
            
            expect(seq).toBe("cd");
            expect(b.get()).toBe(1);
            expect(db).toBe(0); // d saw b(0) even though it ran after c whcih modified b() to b(1)
        });
    });
    
    it("continue running until changes stop", function () {
        S.root(function () {
            var seq = "",
                a = new Data(0);
        
            S.run(function () { seq += a.get(); if (a.get() < 10) a.set(a.get() + 1); });
            
            expect(seq).toBe("012345678910");
            expect(a.get()).toBe(10);
        });
    });
    
    it("propagate changes topologically", function () {
        S.root(function () {
            //
            //    d1      d2
            //    |  \  /  |
            //    |   c1   |
            //    |   ^    |
            //    |   :    |
            //    b1  b2  b3 
            //      \ | /
            //        a1
            //
            var seq = "",
                a1 = new Data(0),
                c1 = new Data(0),
                b1 = S.run(function () { a1.get(); }),
                b2 = S.run(function () { c1.set(a1.get()); }),
                b3 = S.run(function () { a1.get(); }),
                d1 = S.run(function () { b1.get(); seq += "c4(" + c1.get() + ")"; }),
                d2 = S.run(function () { b3.get(); seq += "c5(" + c1.get() + ")"; });

            seq = "";
            a1.set(1);

            expect(seq).toBe("c4(0)c5(0)c4(1)c5(1)");
        });
    });
})
