var { S, Data } = require('../..');

describe('S.root(dispose)', function () {
	it('disables updates and sets computation\'s value to undefined', function () {
		S.root(function (dispose) {
			let c = 0,
				d = new Data(0),
				f = S.run(function () { c++; return d.get(); });

			expect(c).toBe(1);
			expect(f.get()).toBe(0);

			d.set(1);

			expect(c).toBe(2);
			expect(f.get()).toBe(1);

			dispose();

			d.set(2);

			expect(c).toBe(2);
			expect(f.get()).toBe(1);
		});
	});

	// unconventional uses of dispose -- to insure S doesn't behaves as expected in these cases

	it('works from the body of its own computation', function () {
		S.root(function (dispose) {
			let c = 0,
				d = new Data(0),
				f = S.run(function () { c++; if (d.get()) dispose(); d.get(); });

			expect(c).toBe(1);

			d.set(1);

			expect(c).toBe(2);

			d.set(2);

			expect(c).toBe(2);
		});
	});

	it('works from the body of a subcomputation', function () {
		S.root(function (dispose) {
			let c = 0,
				d = new Data(0),
				f = S.run(function () {
					c++;
					d.get();
					S.run(function () { if (d.get()) dispose(); });
				});

			expect(c).toBe(1);

			d.set(1);

			expect(c).toBe(2);

			d.set(2);

			expect(c).toBe(2);
		});
	});
});

describe('S.dispose', () => {
	
	it('disposes node', () => {
		S.root(() => {
			let c = 0;
			let d = new Data(0);
			let comp = S.run(() => {
				c = d.get();
			});
			expect(c).toBe(0);
			d.set(1);
			expect(c).toBe(1);
			S.dispose(comp);
			d.set(2);
			expect(c).toBe(1);
		});
	});

	it('disposes node from within subcomputation', () => {
		S.root(() => {
			let c = 0;
			let d = new Data(0);
			let c1 = S.run(() => {
				c = d.get();
				S.run(() => {
					if (d.get()) {
						S.dispose(c1);
					}
				});
			});
			expect(c).toBe(0);
			d.set(1);
			expect(c).toBe(1);
			d.set(2);
			expect(c).toBe(1);
		});
	});
});

describe('S.track', function() {
	it ('does not update disposed children when parent updates', () => {
		S.root(() => {
			let s1 = new Data(1);
			let outer = 0;
			let inner = 0;
			let order = '';
			let c2 = S.track(() => {
				return s1.get();
			});
			S.run(() => {
				c2.get();
				outer++;
				order += 'out';
				S.run(() => {
					s1.get();
					inner++;
					S.cleanup((final) => {
						if (inner === 1) {
							expect(final).toBe(false);
						} else {
							expect(final).toBe(true);
						}
					})
					order += 'in';
				});
			});
			order = '';
			s1.set(1); // inner updates, not outer 
			expect(inner).toBe(2);
			expect(order).toBe('in');
			order = ''
			s1.set(2); // inner is disposed, should only run once
			expect(outer).toBe(2);
			expect(inner).toBe(3);
			expect(order).toBe('outin');
		});
	});

	it('does not update disposed children with pending changes', () => {
		S.root(() => {
			let s1 = new Data(1);
			let exp = 0;
			let c1 = S.run(() => {
				if (s1.get() > 1) {
					c3;
					expect(copy.get()).toBe(exp);
				}
			})
			let t1 = S.track(() => {
				return s1.get() > 3;
			});
			let c2;
			let c3 = S.run(() => {
				t1.get();
				c2 = S.run(() => {
					return s1.get();
				});
			});
			let copy = c2;
			exp = 3; // tracker does not update, so inner computation is invoked
			s1.set(3);
			s1.set(4); // parent updates, so copy is disposed
		});
	});
});