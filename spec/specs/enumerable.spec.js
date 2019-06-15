var { S, Data, List } = require('../..');

describe("Enumerable", () => {

  // describe("find", () => {
  //   let a1 = new List([1, 2, 3]);
  //   beforeEach(() => {
  //     a1 = new List([1, 2, 3]);
  //   });

  //   it("finds and returns found object", () => {
  //     S.root(() => {
  //       let c1 = a1.find(x => x === 2);
  //       expect(c1.get()).toBe(2);
  //     });
  //   });

  //   it("returns null when not found", () => {
  //     S.root(() => {
  //       let c1 = a1.find(x => x === 4);
  //       expect(c1.get()).toBe(null);
  //     });
  //   });

  //   it("does not scan when modifying array beyond previously found index", () => {
  //     S.root(() => {
  //       let spy = jasmine.createSpy();
  //       let c1 = a1.find(x => {
  //         spy();
  //         return x === 2;
  //       });
  //       expect(spy.calls.count()).toBe(2);
  //       S.freeze(() => {
  //         a1.push(4);
  //         a1.push(5);
  //         a1.push(6);
  //       });
  //       expect(spy.calls.count()).toBe(2);
  //       expect(c1.get()).toBe(2);
  //     });
  //   });
  // });

  describe("map", () => {
    describe("primitive functions", () => {

      let spy = jasmine.createSpy();
      let a1 = new List([1, 2, 3]);
      let c1;

      /**
       * 
       * @param {Array<number>} array
       * @param {number} calls
       */
      function test(array, calls) {
        expect(c1.get()).toEqual(array.map(x => `Item ${x}`));
        expect(spy.calls.count()).toBe(calls);
      }

      beforeEach(() => {
        a1 = new List([1, 2, 3]);
        spy.calls.reset();
        c1 = a1.map(x => {
          spy();
          return `Item ${x}`;
        })
      });
      it("maps objects and returns array", () => {
        S.root(() => {
          test([1, 2, 3], 3);
        });
      });

      it("responds to changes", () => {
        S.root(() => {
          a1.push(4);
          test([1, 2, 3, 4], 4);
        });
      });

      it("inserts at index", () => {
        a1.insert(1, 4);
        test([1, 4, 2, 3], 4);
      });

      it("inserts range", () => {
        a1.insertRange(1, [4, 5, 6]);
        test([1, 4, 5, 6, 2, 3], 6);
      });

      it("removes item", () => {
        a1.remove(2);
        test([1, 3], 3);
      });
    });

    describe("reusing objects", () => {
      let spy = jasmine.createSpy();
      let a1 = new List([
        {id: 0}, 
      ]);
      let c1;

      beforeEach(() => {
        spy.calls.reset();
        a1 = new List([
          {id: 0}, 
          {id: 1}, 
          {id: 2}, 
          {id: 3},
          {id: 4},
          {id: 5},
          {id: 6},
          {id: 7},
          {id: 8},
          {id: 9},
        ]);
        S.root(() => {
          c1 = a1.map(x => {
            spy();
            return `Item ${x.id}`;
          });
        })
        
      });

      it("correctly moves and persists same object", () => {
        let items = a1.get();
        let i5 = items[5];
        let i8 = items[8];
        a1.move(5, 8);
        expect(a1.get()[8]).toBe(i5);
        expect(a1.get()[7]).toBe(i8);
        expect(spy.calls.count()).toBe(10);
      });
    });
  });
});