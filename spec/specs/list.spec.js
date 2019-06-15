var { S, Data, List } = require('../..');

describe("List", () => {

  describe("behaves like signal", () => {
    /** @type {List<number>} */
    let a1;
    beforeEach(() => {
      a1 = new List([1, 2, 3]);
    });

    it("accepts an array and intializes", () => {
      expect(a1.get()).toEqual([1, 2, 3]);
    });

    it("behaves like a data signal", () => {
      const spy = jasmine.createSpy();
      S.root(() => {
        S.on(a1, spy);
      });
      a1.set([1, 2, 3]);
      expect(spy.calls.count()).toBe(2);
    });

    it("doesn't throw when set to different values in one tick", () => {
      expect(() => {
        S.freeze(() => {
          a1.set([1, 2, 3]);
          a1.set([1, 2, 3]);
        });
      }).not.toThrow();
    });
  });

  describe("methods", () => {

    let a1 = new List([1, 2, 3]);
    beforeEach(() => {
      a1 = new List([1, 2, 3]);
    });
    describe("push", () => {
      it("behaves like push", () => {
        a1.push(4);
        expect(a1.get()).toEqual([1, 2, 3, 4]);
      });

      it("pushes to an empty array", () => {
        a1.set([]);
        a1.push(1);
        expect(a1.get()).toEqual([1]);
      });
    });

    describe("pop", () => {
      it("behaves like pop", () => {
        a1.pop();
        expect(a1.get()).toEqual([1, 2]);
        expect(a1.length).toBe(2);
      });

      it("doesn't throw for empty arrays", () => {
        a1.set([]);
        expect(() => {
          a1.pop();
        }).not.toThrow();
      });
    });

    describe("shift", () => {
      it("behaves like shift", () => {
        a1.shift();
        expect(a1.get()).toEqual([2, 3]);
        expect(a1.length).toBe(2);
      });

      it("doesn't throw for empty arrays", () => {
        a1.set([]);
        expect(() => {
          a1.shift();
        }).not.toThrow();
        expect(a1.get()).toEqual([]);
        expect(a1.length).toBe(0);
      });
    });

    describe("unshift", () => {
      it("behaves like unshift", () => {
        a1.unshift(4);
        expect(a1.get()).toEqual([4, 1, 2, 3]);
        expect(a1.length).toBe(4);
      });

      it("works for empty arrays", () => {
        a1.set([]);
        a1.unshift(0);
        expect(a1.get()).toEqual([0]);
        expect(a1.length).toBe(1);
      });
    });

    describe("insert", () => {
      it("inserts at index 0", () => {
        a1.insert(0, 4);
        expect(a1.get()).toEqual([4, 1, 2, 3]);
        expect(a1.length).toBe(4);
      });

      it("inserts in middle", () => {
        a1.insert(1, 4);
        expect(a1.get()).toEqual([1, 4, 2, 3]);
        expect(a1.length).toBe(4);
      });

      it("inserts at end", () => {
        a1.insert(2, 4);
        expect(a1.get()).toEqual([1, 2, 4, 3]);
      });

      it("inserts after end", () => {
        a1.insert(3, 4);
        expect(a1.get()).toEqual([1, 2, 3, 4]);
      });

      it("yields void out of range", () => {
        a1.insert(5, 4);
        expect(a1.get()).toEqual([1, 2, 3]);
      });

      it("yields void if negative index is out of range", () => {
        a1.insert(-5, 4);
        expect(a1.get()).toEqual([1, 2, 3]);
      });

      it("inserts backwards for negative indices", () => {
        a1.insert(-1, 4);
        expect(a1.get()).toEqual([1, 2, 4, 3]);
      });
    });

    describe("insertRange", () => {
      it("inserts range in beginning", () => {
        a1.insertRange(0, [4, 5, 6]);
        expect(a1.get()).toEqual([4, 5, 6, 1, 2, 3]);
      });

      it("inserts range in middle of array", () => {
        a1.insertRange(1, [4, 5, 6]);
        expect(a1.get()).toEqual([1, 4, 5, 6, 2, 3]);
      });

      it("inserts range at end of array", () => {
        a1.insertRange(2, [4, 5, 6]);
        expect(a1.get()).toEqual([1, 2, 4, 5, 6, 3]);
      });

      it("inserts at end of array", () => {
        a1.insertRange(3, [4, 5, 6]);
        expect(a1.get()).toEqual([1, 2, 3, 4, 5, 6]);
      });

      it("inserts range larger than original collection", () => {
        a1.insertRange(0, [1, 2, 3, 4, 5, 6]);
        expect(a1.get()).toEqual([1, 2, 3, 4, 5, 6, 1, 2, 3]);
      });
    });

    describe("remove", () => {
      it("removes element if found", () => {
        a1.remove(2);
        expect(a1.get()).toEqual([1, 3]);
      });

      it("does nothing for element that doesn't exist", () => {
        a1.remove(4);
        expect(a1.get()).toEqual([1, 2, 3]);
      });
    });

    describe("removeAt", () => {
      it("removes at index 0", () => {
        a1.removeAt(0);
        expect(a1.get()).toEqual([2, 3]);
      });

      it("removes in the middle", () => {
        a1.removeAt(1);
        expect(a1.get()).toEqual([1, 3]);
      });

      it("removes at end", () => {
        a1.removeAt(2);
        expect(a1.get()).toEqual([1, 2]);
      });

      it("does nothing for indices out of range", () => {
        a1.removeAt(4);
        expect(a1.get()).toEqual([1, 2, 3]);
      });

      it("removes for negative indices", () => {
        a1.removeAt(-1);
        expect(a1.get()).toEqual([1, 2]);
      });

      it("does nothing for negative indices out of range", () => {
        a1.removeAt(-4);
        expect(a1.get()).toEqual([1, 2, 3]);
      });
    });

    describe("removeRange", () => {
      it("removes range from beginning", () => {
        a1.removeRange(0, 1);
        expect(a1.get()).toEqual([2, 3]);
      });

      it("removes range beyond range of array", () => {
        a1.removeRange(0, 5);
        expect(a1.get()).toEqual([]);
      });

      it("works for negative indices", () => {
        a1.removeRange(-1, 1);
        expect(a1.get()).toEqual([1, 2]);
      });

      it("works for index beyond range for negative index", () => {
        a1.removeRange(-2, 5);
        expect(a1.get()).toEqual([1]);
      });
    });

    describe("move", () => {
      it("moves item within array", () => {
        a1.move(2, 0);
        expect(a1.get()).toEqual([3, 1, 2]);
      });

      it("moves an item beyond range of array", () => {
        a1.move(2, 4);
        expect(a1.get()).toEqual([1, 2, undefined, undefined, 3]);
      });

      it("works for negative indices", () => {
        a1.move(-1, -1);
        expect(a1.get()).toEqual([1,2,3]);
        a1.move(-1, -2);
        expect(a1.get()).toEqual([1,3,2]);
      });
    });
  });
});