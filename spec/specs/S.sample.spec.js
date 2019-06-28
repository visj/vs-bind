var { S, Data } = require('../..');

describe("S.sample(...)", function () {
    it("avoids a depdendency", function () {
        S.root(function () {
            var a = new Data(1),
                b = new Data(2),
                c = new Data(3),
                d = 0,
                e = S.run(function () { d++; a.get(); S.sample(b); c.get(); });
                
            expect(d).toBe(1);
            
            b.set(4);
            
            expect(d).toBe(1);
            
            a.set(5);
            c.set(6);
            
            expect(d).toBe(3);
        });
    });
})