import {
  IPatcher,
  IEnumerable,
  IComputation,
} from './records';

import {
  S,
  Data,
  Owner,
  logWrite,
  logDataRead,
  Computation,
  NOT_PENDING,
} from './data';

/**
 * @template T 
 * @extends {Data<!Array<T>>}
 * @implements {IEnumerable<T>}
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

  /** @type {number} */
  get length() {
    return this.get().length;
  }

  /**
   * @override
   * @param {!Array<T>} value 
   * @return {!Array<T>}
   */
  set(value) {
    this._count = 0;
    enqueue(this, /** @param {!Array<T>} array */(array) => {
      /** @type {number} */
      const ln = value.length;
      for (let /** number */ i = 0; i < ln; i++) {
        array[i] = value[i];
      }
      array.length = ln;
    });
    return value;
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
    enqueue(this, /** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      array[ln] = value;
    });
  }

  pop() {
    enqueue(this, /** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      if (ln) {
        array.length--;
      }
    });
  }

  /** @param {T} value */
  unshift(value) {
    enqueue(this, /** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      while (ln) {
        array[ln--] = array[ln];
      }
      array[0] = value;
    });
  }

  shift() {
    enqueue(this, /** @param {!Array<T>} array */(array) => {
      array.shift();
    });
  }

  /**
   * 
   * @param {number} index 
   * @param {T} value 
   */
  insert(index, value) {
    enqueue(this,/** @param {!Array<T>} array @param {number} ln */(array, ln) => {
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
    enqueue(this, /** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      insertRange(array, ln, index, values);
    });
  }

  /**
   * 
   * @param {T} value 
   */
  remove(value) {
    enqueue(this, /** @param {!Array<T>} array @param {number} ln */(array, ln) => {
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
    enqueue(this, /** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      removeAt(array, index, ln)
    });
  }

  /**
   * 
   * @param {number} from 
   * @param {number} count
   */
  removeRange(from, count) {
    enqueue(this, /** @param {!Array<T>} array @param {number} ln */(array, ln) => {
      removeRange(array, ln, from, count);
    });
  }

  /**
   * 
   * @param {number} index 
   * @param {T} value 
   */
  replace(index, value) {
    enqueue(this, /** @param {!Array<T>} array @param {number} ln */(array, ln) => {
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
    enqueue(this, /** @param {!Array<T>} array @param {number} ln */(array, ln) => {
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
 * @implements {IEnumerable<T>}
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

  /** @type {number} */
  get length() {
    return this.get().length;
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
    mount(new Patcher(fn, this._mutation), this._source);
  }

  /**
   * @template U
   * @param {(function(T): U)|(function(T, IComputation<number>): U)} fn 
   * @return {Enumerable<U>}
   */
  map(fn) {
    return new Enumerable(mount(new MapPatcher(fn, this._mutation), this._source), this._mutation);
  }
}

/**
 * @template T, U
 * @implements {IPatcher<T,U>}
 */
class Patcher {
  /**
   * @param {(function(T): U)|(function(T, !IComputation<number>): U)} fn
   * @param {function(): Array<number>=} mutation 
   */
  constructor(fn, mutation) {
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
    /**
     * @const 
     * @protected 
     * @type {(function(T): U)|(function(T, !IComputation<number>): U)} */
    this._factory = fn;
    /**
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

  /** @param {!Array<number>} m */
  onMutation(m) {

  }

  /**
   * 
   * @param {number} index 
   * @return {U}
   */
  onEnter(index) {
    return enter(this, index);
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
    resolve(this, cStart, cEnd, uStart, uEnd);
  }

  /** @return {Array<U>} */
  onTeardown() {
    this._current = this._updates.slice();
    this._disposers = /** @type {!Array<function(boolean=): void>} */(this._tempDisposers);
    this._tempDisposers = null;
    if (this._indexed) {
      this._indices = /** @type {!Array<{data: IComputation<number>, index: number}>} */(this._tempIndices);
      this._tempIndices = null;
    }
    return null;
  }
}

/**
 * @template T, U 
 * @extends {Patcher<T,U>}
 */
class MapPatcher extends Patcher {


  /**
   * 
   * @param {(function(T): U)|(function(T, !IComputation<number>): U)} fn
   * @param {function(): Array<number>=} mutation 
   */
  constructor(fn, mutation) {
    super(fn, mutation);
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
   * @param {number} ln 
   */
  onSetup(ln) {
    this._tempMapped = new Array(ln);
    super.onSetup(ln);
  }

  /**
   * @override
   * @param {number} index
   * @return {U} 
   */
  onEnter(index) {
    return this._tempMapped[index] = super.onEnter(index);
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

  /** @return {Array<U>} */
  onTeardown() {
    this._mapped = /** @type {!Array<U>} */(this._tempMapped);
    this._tempMapped = null;
    super.onTeardown();
    return this._mapped;
  }
}

/**
 * @template T,U
 * @param {IPatcher<T,U>} patcher
 * @param {!Array<T>} u
 * @return {Array<U>} 
 */
function reconcile(patcher, u) {
  /** @type {number} */
  const ln = u.length;
  patcher._updates = u;
  patcher.onSetup(ln);
  /** @type {Array<number>} */
  const m = patcher._mutation ? patcher._mutation() : null;
  if (m !== null) {
    patcher.onMutation(m);
  } else {
    /** @type {!Array<T>} */
    const c = patcher._current;
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
          patcher.onEnter(uStart++);
        }
      }
    } else if (uStart < 0) {
      if (cEnd > 0) {
        while (cStart <= cEnd) {
          patcher.onExit(cStart++);
        }
      }
    } else {
      /** @type {boolean} */
      let loop = true;
      while (loop) {
        loop = false;
        for (; cEnd >= cStart && uEnd >= uStart && c[cStart] === u[uStart]; patcher.onMove(cStart++, uStart++, 1)) { }
        for (; cEnd >= cStart && uEnd >= uStart && c[cEnd] === u[uEnd]; patcher.onMove(cEnd--, uEnd--, 2)) { }
        for (; cEnd >= cStart && uEnd >= uStart && c[cEnd] === u[uStart]; patcher.onMove(cEnd--, uStart++, 3)) {
          loop = true;
        }
        for (; cEnd >= cStart && uEnd >= uStart && c[cStart] === u[uEnd]; patcher.onMove(cStart++, uEnd--, 4)) {
          loop = true;
        }
      }
      if (uStart > uEnd) {
        while (cStart <= cEnd) {
          patcher.onExit(cStart++);
        }
      } else if (cStart > cEnd) {
        while (uStart <= uEnd) {
          patcher.onEnter(uStart++);
        }
      } else {
        patcher.onUnresolved(cStart, cEnd, uStart, uEnd);
      }
    }
  }
  /** @type {Array<U>} */
  const result = patcher.onTeardown();
  patcher._updates = null;
  return result;
}

/**
 * @template T,U
 * @param {!IPatcher<T,U>} patcher 
 * @param {!IComputation<!Array<T>>} source
 * @return {!IComputation<!Array<U>>}
 */
function mount(patcher, source) {
  S.cleanup(() => { dismount(patcher); });
  return S.on(source, /** @param {!Array<T>} result @return {!Array<U>} */(result) => {
    return /** @type {!Array<U>} */(reconcile(patcher, result));;
  });
}

/**
 * @template T,U
 * @param {IPatcher<T,U>} patcher 
 */
function dismount(patcher) {
  for (let /** number */ i = 0, /** number */ ln = patcher._current.length; i < ln; i++) {
    patcher.onExit(i, true);
  }
}

/**
 * @template T,U
 * @param {Patcher<T,U>} patcher 
 * @param {number} index 
 * @return {U}
 */
function enter(patcher, index) {
  return S.root((dispose) => {
    patcher._tempDisposers[index] = dispose;
    /** @type {T} */
    const item = patcher._updates[index];
    const owner = /** @type {!Computation} */(Owner);
    /** @type {(function(T): U)|(function(T, !IComputation<number>): U)} */
    const factory = patcher._factory;
    if (patcher._indexed) {
      /** @type {{data: IComputation<number>, index: number}} */
      const ti = patcher._tempIndices[index] = { data: null, index };
      /** @type {!IComputation<number>} */
      const i = ti.data = S.track(() => { logDataRead(owner); return ti.index; });
      return /** @type {function(T, !IComputation<number>): U} */(factory)(item, i);
    }
    return /** @type {function(T): U} */(factory)(item);
  });
}

/**
 * @template T,U
 * @param {IPatcher<T,U>} patcher 
 * @param {number} cStart 
 * @param {number} cEnd 
 * @param {number} uStart 
 * @param {number} uEnd 
 */
function resolve(patcher, cStart, cEnd, uStart, uEnd) {
  /** @type {!Array<T>} */
  const c = patcher._current;
  /** @type {Array<T>} */
  const u = patcher._updates;
  /** @type {number} */
  let i = 0;
  /** @type {!Object<number, boolean>} */
  const preserved = {};
  /** @type {!Map<T, (number|!Array<number>)>} */
  const map = new Map();
  for (i = cEnd; i >= cStart; i--) {
    /** @type {T} */
    const cItem = c[i];
    /** @type {number|!Array<number>|undefined} */
    const ex = map.get(cItem);
    if (ex != null) {
      if (typeof ex == 'number') {
        map.set(cItem, [ex, i]);
      } else {
        ex.push(i);
      }
    } else {
      map.set(cItem, i);
    }
  }
  for (i = uStart; i <= uEnd; i++) {
    /** @type {T} */
    const uItem = u[i];
    /** @type {number|Array<number>|undefined} */
    const ex = map.get(uItem);
    if (ex != null) {
      /** @type {boolean} */
      const nbr = typeof ex === 'number';
      /** @type {number|undefined} */
      const index = nbr ? /** @type {number} */(ex) : /** @type {Array<number>} */(ex).pop();
      if (nbr || index == null) {
        map.delete(uItem);
      }
      if (index != null) {
        preserved[index] = true;
        patcher.onMove(index, i);
      } else {
        patcher.onEnter(cStart);
      }
    } else {
      patcher.onEnter(cStart);
    }
  }
  for (i = cStart; i <= cEnd; i++) {
    if (!preserved[i]) {
      patcher.onExit(i);
    }
  }
}

/**
 * @template T
 * @param {!List<T>} list 
 * @param {function(!Array<T>, number): void} change 
 */
function enqueue(list, change) {
  list._queue[list._count++] = change;
  logWrite(list, null);
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
    while (index < ln) {
      array[index++] = array[index];
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
  MapPatcher,
  mount,
  dismount,
  reconcile,
}