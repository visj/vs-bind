import {
  NOT_PENDING,
  IComputation,
} from './shared';
import {
  S,
  Data,
  Owner,
  logDataRead,
  Computation,
} from './data';

/**
 * @template T 
 * @extends {Data<!Array<T>>}
 */
class List extends Data {

  /**
   * 
   * @param {!Array<T>} value 
   */
  constructor(value) {
    super(value);
    /** 
     * @const 
     * @private 
     * @type {!Array<(function(!Array<T>, number): void)|null>} */
    this._queue = [];
    /** 
     * @private 
     * @type {number} */
    this._count = 0;
  }

  /** @return {number} */
  get length() {
    return this.get().length;
  }

  /**
   * @override
   * @param {!Array<T>} value 
   */
  set(value) {
    this._count = 0;
    this.enqueue(/** @param {!Array<T>} array */(array) => {
      /** @type {number} */
      const ln = value.length;
      for (let /** number */ i = 0; i < ln; i++) {
        array[i] = value[i];
      }
      array.length = ln;
    });
    return value;
  }

  /**
   * @private
   * @param {function(!Array<T>, number): void} change 
   */
  enqueue(change) {
    this._queue[this._count++] = change;
    super.set(null);
  }

  /** @override */
  update() {
    /** @type {!Array<(function(!Array<T>, number): void)|null>} */
    const queue = this._queue;
    /** @type {!Array<T>} */
    const value = this._value;
    for (let /** number */ i = 0; i < this._count; i++) {
      queue[i](value, value.length);
      queue[i] = null;
    }
    this._count = 0;
    this._pending = NOT_PENDING;
  }

  /** @param {T} value */
  push(value) {
    this.enqueue(/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      array[ln] = value;
    });
  }

  pop() {
    this.enqueue(/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      if (ln) {
        array.length--;
      }
    });
  }

  /** @param {T} value */
  unshift(value) {
    this.enqueue(/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      while (ln) {
        array[ln--] = array[ln];
      }
      array[0] = value;
    });
  }

  shift() {
    this.enqueue(/** @param {!Array<T>} array */(array) => {
      array.shift();
    });
  }

  /**
   * 
   * @param {number} index 
   * @param {T} value 
   */
  insert(index, value) {
    this.enqueue(/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      index = index < 0 ? index + ln : index;
      if (index >= 0 && index <= ln) {
        array.splice(index, 0, value);
      }
    });
  }

  /**
   * 
   * @param {number} index 
   * @param {!Array<T>} values 
   */
  insertRange(index, values) {
    this.enqueue(/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      insertRange(array, ln, index, values);
    });
  }

  /**
   * 
   * @param {T} value 
   */
  remove(value) {
    this.enqueue(/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      for (let /** number */ i = 0; i < ln; i++) {
        if (array[i] === value) {
          return removeAt(array, i, ln);
        }
      }
    });
  }

  /**
   * 
   * @param {number} index 
   */
  removeAt(index) {
    this.enqueue(/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      removeAt(array, index, ln)
    });
  }

  /**
   * 
   * @param {number} from 
   * @param {number} count
   */
  removeRange(from, count) {
    this.enqueue(/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      removeRange(array, ln, from, count);
    });
  }

  /**
   * 
   * @param {number} index 
   * @param {T} value 
   */
  replace(index, value) {
    this.enqueue(/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      index = index < 0 ? ln + index : index;
      if (ln && index >= 0 && index < ln) {
        array[index] = value;
      }
    })
  }

  /**
   * 
   * @param {number} from 
   * @param {number} to
   */
  move(from, to) {
    this.enqueue(/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      move(array, ln, from, to);
    });
  }

  /**
   * @protected 
   * @return {Enumerable<T>} 
   */
  enumerable() {
    return new Enumerable(this);
  }

  /**
   * 
   * @param {(function(T): void)|(function(T, IComputation<number>): void)} fn 
   */
  forEach(fn) {
    return this.enumerable().forEach(fn);
  }

  /**
   * @template U
   * @param {(function(T): U)|(function(T, IComputation<number>): U)} fn 
   * @return {Enumerable<U>}
   */
  map(fn) {
    return this.enumerable().map(fn);
  }
}

/**
 * @template T
 * @extends {List<T>}
 */
class Observable extends List {

  /**
   * 
   * @param {!Array<T>} value 
   */
  constructor(value) {
    super(value);
    /**
     * @private 
     * @type {Array<number>} */
    this._mutation = null;
  }

  /**
   * @override
   * @return {Enumerable<T>}
   */
  enumerable() {
    return new Enumerable(this, () => this._mutation);
  }
}

/**
 * @template T 
 * @implements {IComputation<!Array<T>>}
 */
class Enumerable {

  /**
   * @private
   * @param {!IComputation<!Array<T>>} source
   * @param {function(): Array<number>=} mutation
   */
  constructor(source, mutation) {
    /** 
     * @const
     * @private 
     * @type {!IComputation<!Array<T>>} */
    this._source = source;
    /**
     * @const 
     * @private 
     * @type {(function(): Array<number>)|undefined} */
    this._mutation = mutation;
  }

  /** @return {!Array<T>} */
  get() {
    return this._source.get();
  }

  /**
   * 
   * @param {(function(T): void)|(function(T, IComputation<number>): void)} fn 
   */
  forEach(fn) {
    /** @type {!IComputation<!Array<T>>} */
    const source = this._source;
    /** @type {!ListPatcher<T,void>} */
    const patcher = new ListPatcher(source, fn, this._mutation);
    S.on(source, /** @param {!Array<T>} result */ (result) => { patcher.update(result); });
  }

  /**
   * @template U
   * @param {(function(T): U)|(function(T, IComputation<number>): U)} fn 
   * @return {Enumerable<U>}
   */
  map(fn) {
    /** @type {!IComputation<!Array<T>>} */
    const source = this._source;
    /** @type {!MapPatcher<T,U>} */
    const patcher = new MapPatcher(source, fn, this._mutation);
    /** @type {!IComputation<!Array<U>>} */
    const data = S.on(source, /** @param {!Array<T>} result @return {!Array<U>} */(result) => {
      patcher.update(result);
      return patcher._mapped;
    });
    return new Enumerable(data, this._mutation);
  }
}

/** @template T */
class Patcher {

  /**
   * @protected
   * @param {function(): Array<number>=} mutation 
   */
  constructor(mutation) {
    /**
     * @protected
     * @type {!Array<T>} */
    this._current = [];
    /**
     * @protected
     * @type {Array<T>} */
    this._updates = null;
    /**
     * @const 
     * @protected
     * @type {(function(): Array<number>)|undefined} */
    this._mutation = mutation;
    S.cleanup(() => { this.onCleanup(); });
  }

  /**
   * 
   * @param {!Array<T>} u 
   */
  update(u) {
    /** @type {number} */
    const ln = u.length;
    this._updates = u;
    this.onSetup(ln);
    /** @type {Array<number>} */
    const m = this._mutation ? this._mutation() : null;
    if (m !== null) {
      this.onMutation(m);
    } else {
      /** @type {!Array<T>} */
      const c = this._current;
      /** @type {number} */
      let cStart = 0;
      /** @type {number} */
      let uStart = 0;
      /** @type {number} */
      let cEnd = c.length - 1;
      /** @type {number} */
      let uEnd = ln - 1;
      if (cEnd < 0) {
        if (uEnd > 0) {
          while (uStart <= uEnd) {
            this.onEnter(uStart++);
          }
        }
      } else if (uStart < 0) {
        if (cEnd > 0) {
          while (cStart <= cEnd) {
            this.onExit(cStart++);
          }
        }
      } else {
        /** @type {boolean} */
        let loop = true;
        while (loop) {
          loop = false;
          for (; cEnd >= cStart && uEnd >= uStart && c[cStart] === u[uStart]; this.onMove(cStart++, uStart++, 0)) { }
          for (; cEnd >= cStart && uEnd >= uStart && c[cEnd] === u[uEnd]; this.onMove(cEnd--, uEnd--, 1)) { }
          for (; cEnd >= cStart && uEnd >= uStart && c[cEnd] === u[uStart]; this.onMove(cEnd--, uStart++, 2)) {
            loop = true;
          }
          for (; cEnd >= cStart && uEnd >= uStart && c[cStart] === u[uEnd]; this.onMove(cStart++, uEnd--, 3)) {
            loop = true;
          }
        }
        if (uStart > uEnd) {
          while (cStart <= cEnd) {
            this.onExit(cStart++);
          }
        } else if (cStart > cEnd) {
          while (uStart <= uEnd) {
            this.onEnter(uStart++);
          }
        } else {
          this.onUnresolved(cStart, cEnd, uStart, uEnd);
        }
      }
    }
    this.onTeardown();
    this._updates = null;
  }

  onCleanup() { }

  /**
   * 
   * @param {number} ln
   */
  onSetup(ln) { }

  /** @param {!Array<number>} changes */
  onMutation(changes) { }

  /** @param {number} index */
  onEnter(index) { }

  /**
   * 
   * @param {number} from 
   * @param {number} to 
   * @param {number=} type 
   */
  onMove(from, to, type) { }

  /** @param {number} index */
  onExit(index) { }

  /**
   * 
   * @param {number} cStart 
   * @param {number} cEnd 
   * @param {number} uStart 
   * @param {number} uEnd 
   */
  onUnresolved(cStart, cEnd, uStart, uEnd) { }

  onTeardown() { }
}

/**
 * @template T, U
 * @extends {Patcher<T>}
 */
class ListPatcher extends Patcher {
  /**
   * @param {!IComputation<!Array<T>>} source
   * @param {(function(T): U)|(function(T, !IComputation<number>): U)} fn
   * @param {function(): Array<number>=} mutation 
   */
  constructor(source, fn, mutation) {
    super(mutation);
    /**
     * @const 
     * @protected 
     * @type {!IComputation<!Array<T>>} */
    this._source = source;
    /**
     * @const 
     * @protected 
     * @type {(function(T): U)|(function(T, !IComputation<number>): U)} */
    this._factory = fn;
    /**
     * @const 
     * @protected
     * @type {boolean} */
    this._indexed = fn.length > 1;
    /**
     * @protected
     * @type {!Array<function(boolean=): void>} */
    this._disposers = [];
    /**
     * @protected
     * @type {Array<function(boolean=): void>} */
    this._tempDisposers = null;
    /**
     * @protected
     * @type {!Array<{data: IComputation<number>, index: number}>} */
    this._indices = [];
    /** 
     * @protected
     * @type {Array<{data: IComputation<number>, index: number}>} */
    this._tempIndices = null;
  }

  onCleanup() {
    for (let /** number */ i = 0, /** number */ ln = this._disposers.length; i < ln; i++) {
      this.onExit(i);
    }
  }

  /**
   * @param {T} item
   * @param {number} index
   * @param {IComputation<number>=} i 
   * @return {U}
   */
  enter(item, index, i) {
    return this._indexed ? /** @type {function(T, !IComputation<number>): U} */(this._factory)(item, /** @type {!IComputation<number>} */(i)) : /** @type {function(T): U} */(this._factory)(item);
  }

  /**
   * 
   * @param {number} ln
   */
  onSetup(ln) {
    this._tempDisposers = new Array(ln);
    if (this._indexed) {
      this._tempIndices = new Array(ln);
    }
  }

  /**
   * 
   * @param {number} index 
   */
  onEnter(index) {
    /** @type {Computation} */
    const owner = Owner;
    this._tempDisposers[index] = S.root((dispose) => {
      /** @type {T} */
      const item = this._updates[index];
      if (this._indexed) {
        /** @type {{data: IComputation<number>, index: number}} */
        const i = this._tempIndices[index] = { data: null, index };
        i.data = S.track(() => {
          logDataRead(/** @type {!Computation} */(owner));
          return i.index;
        });
        this.enter(item, index, i.data);
      } else {
        this.enter(item, index);
      }
      return dispose;
    });
  }

  /**
   * 
   * @param {number} from 
   * @param {number} to 
   */
  onMove(from, to) {
    this._tempDisposers[to] = this._disposers[from];
    if (this._indexed) {
      (this._tempIndices[to] = this._indices[from]).index = to;
    }
  }

  /**
   * 
   * @param {number} index 
   */
  onExit(index) {
    this._disposers[index]();
  }

  /**
  * 
  * @param {number} cStart 
  * @param {number} cEnd 
  * @param {number} uStart 
  * @param {number} uEnd 
  */
  onUnresolved(cStart, cEnd, uStart, uEnd) {
    /** @type {!Array<T>} */
    const c = this._current;
    /** @type {Array<T>} */
    const u = this._updates;
    /** @type {!Object<number, boolean>} */
    const preserved = {};
    /** @type {!Map<T, (number|!Array<number>)>} */
    const map = new Map();
    for (let /** number */ i = cEnd; i >= cStart; i--) {
      /** @type {T} */
      const cItem = c[i];
      /** @type {number|!Array<number>|undefined} */
      const ex = map.get(cItem);
      if (ex != null) {
        if (typeof ex === 'number') {
          map.set(cItem, [ex, i]);
        } else {
          ex.push(i);
        }
      } else {
        map.set(cItem, i);
      }
    }
    for (; uStart <= uEnd; uStart++) {
      /** @type {T} */
      const cItem = u[uStart];
      /** @type {number|Array<number>|undefined} */
      const ex = map.get(cItem);
      if (ex != null) {
        /** @type {number|undefined} */
        let index;
        /** @type {boolean} */
        let del = false;
        if ((del = typeof ex === 'number')) {
          index = ex;
        } else {
          del = (index = ex.pop()) === undefined;
        }
        if (del) {
          map.delete(cItem);
        }
        if (index !== undefined) {
          preserved[index] = true;
          this.onMove(index, cStart);
          continue;
        }
      }
      this.onEnter(cStart);
    }
    for (; cStart <= cEnd; cStart++) {
      if (!preserved[cStart]) {
        this.onExit(cStart);
      }
    }
  }

  onTeardown() {
    this._current = this._updates.slice();
    this._disposers = /** @type {!Array<function(boolean=): void>} */(this._tempDisposers);
    this._tempDisposers = null;
    if (this._indexed) {
      this._indices = /** @type {!Array<{data: IComputation<number>, index: number}>} */(this._tempIndices);
      this._tempIndices = null;
    }
  }
}

/**
 * @template T, U 
 * @extends {ListPatcher<T,U>}
 */
class MapPatcher extends ListPatcher {


  /**
   * 
   * @param {!IComputation<!Array<T>>} source 
   * @param {(function(T): U)|(function(T, !IComputation<number>): U)} fn
   * @param {function(): Array<number>=} mutation 
   */
  constructor(source, fn, mutation) {
    super(source, fn, mutation);
    /**
     * @protected 
     * @type {!Array<U>} */
    this._mapped = [];
    /**
     * @protected 
     * @type {Array<U>} */
    this._tempMapped = null;
  }

  /**
   * @override
   * @param {T} item 
   * @param {number} index
   * @param {IComputation<number>=} i
   * @return {U} 
   */
  enter(item, index, i) {
    return this._tempMapped[index] = super.enter(item, index, i);
  }

  /**
   * @override
   * @param {number} ln 
   */
  onSetup(ln) {
    this._tempMapped = new Array(ln);
    super.onSetup(ln);
  }

  /**
   * 
   * @param {number} from 
   * @param {number} to 
   */
  onMove(from, to) {
    this._tempMapped[to] = this._mapped[from];
    super.onMove(from, to);
  }

  onTeardown() {
    this._mapped = /** @type {!Array<U>} */(this._tempMapped);
    super.onTeardown();
  }
}

/**
 * @template T
 * @param {!Array<T>} array 
 * @param {number} ln 
 * @param {number} from 
 * @param {number} to 
 */
function move(array, ln, from, to) {
  from = from < 0 ? ln + from : from;
  to = to < 0 ? ln + to : to;
  if (ln && from !== to && to >= 0 && from >= 0 && from < ln) {
    /** @type {T} */
    const item = array[from];
    /** @type {number} */
    const dir = from < to ? 1 : -1;
    for (let /** number */ j = from; j !== to;) {
      array[j] = array[(j += dir)];
    }
    array[to === ln ? to - 1 : to] = item;
  }
}

/**
 * @template T
 * @param {!Array<T>} array 
 * @param {number} index 
 * @param {number} ln
 */
function removeAt(array, index, ln) {
  index = index < 0 ? ln + index : index;
  if (ln && index >= 0 && index < ln) {
    for (let /** number */i = index; i < ln;) {
      array[i++] = array[i];
    }
    array.length--;
  }
}

/**
 * @template T
 * @param {!Array<T>} array 
 * @param {number} ln 
 * @param {number} from 
 * @param {number} count 
 */
function removeRange(array, ln, from, count) {
  from = from < 0 ? ln + from : from;
  if (ln && from >= 0 && from < ln) {
    /** @type {number} */
    let to = from + count;
    for (to = to < ln ? to : ln; to < ln;) {
      array[from++] = array[to++];
    }
    array.length -= to - from;
  }
}

/**
 * @template T
 * @param {!Array<T>} array 
 * @param {number} ln 
 * @param {number} index 
 * @param {!Array<T>} values 
 */
function insertRange(array, ln, index, values) {
  index = index < 0 ? index + ln : index;
  /** @type {number} */
  const vln = values.length;
  if (vln && index >= 0 && index <= ln) {
    for (let /** number */ i = ln - 1; i >= index; i--) {
      array[i + vln] = array[i];
    }
    for (let /** number */i = 0, /** number */ j = index; i < vln;) {
      array[j++] = values[i++];
    }
  }
}

export {
  List,
  Enumerable,
  Patcher,
  ListPatcher,
  MapPatcher,
}