var { S, Data } = require('../..');

describe("S.freeze", function () {
	it("batches changes until end", function () {
		var d = new Data(1);
			
		S.freeze(function () {
			d.set(2);
			expect(d.get()).toBe(1);
		});
		
		expect(d.get()).toBe(2);
	});
	
	it("halts propagation within its scope", function () {
        S.root(function () {
			var d = new Data(1),
				f = S.run(function() { return d.get(); });
				
			S.freeze(function () {
				d.set(2);
				expect(f.get()).toBe(1);
			});
			
			expect(f.get()).toBe(2);
		});
	});
});