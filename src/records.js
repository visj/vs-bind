//@ts-nocheck

/**
 * @record
 * @template T
 */
class IComputation {

  /** @return {T} */
  get() { }
}

/** @interface */
class ISwitch {


  /**
   * @template T
   * @param {(function(): T)|(function(T): T)} fn 
   * @param {T=} seed
   * @return {!IComputation<T>} 
   */
  run(fn, seed) { }

  /**
   * @template T
   * @param {(function(): T)|(function(T): T)} fn 
   * @param {T=} seed
   * @param {function(T, T): boolean=} comparer
   * @return {!IComputation<T>} 
   */
  track(fn, seed, comparer) { }


  /**
   * @template T
   * @param {(function(): T)|(function(function(): void): T)} fn
   * @return {T}
   */
  root(fn) { }

  /**
   * @template T
   * @param {!Array<!IComputation<T>>} array
   * @return {!IComputation<!Array<T>>}
   */
  join(array) { }

  /**
   * @template T,U
   * @param {!IComputation<U>} ev
   * @param {(function(U): T)|(function(U, T): T)} fn
   * @param {T=} seed 
   * @param {boolean=} track
   * @param {function(T, T): boolean=} comparer
   * @return {!IComputation<T>}
   */
  on(ev, fn, seed, track, comparer) { }

  /**
   * @template T,U
   * @param {!IComputation<U>} ev
   * @param {(function(U): T)|(function(U, T): T)} fn
   * @param {T=} seed 
   * @param {boolean=} track
   * @param {function(T, T): boolean=} comparer
   * @return {!IComputation<T>}
   */
  onchange(ev, fn, seed, track, comparer) { }


  /**
   * @template T
   * @param {function(): T} fn
   * @return {T}
   */
  freeze(fn) { }


  /**
   * @template T
   * @param {(function(): T)|!IComputation<T>} fn
   * @return {T}
   */
  sample(fn) { }

  /**
   * @param {function(boolean): void} fn 
   * @return {void}
   */
  cleanup(fn) { }

  /**
   * @param {IComputation} node
   * @return {void}
   */
  dispose(node) { }

  /**
  * @param {IComputation} node 
  */
  renew(node) { }

  /** @return {boolean} */
  frozen() { }

  /** @return {boolean} */
  listening() { }
}

/**
 * @record 
 * @template T 
 * @extends {IComputation<!Array<T>>}
 */
class IEnumerable { }

/** @type {number} */
IEnumerable.prototype.length;

/**
 * @record 
 * @template T,U
 */
class IPatcher {

  constructor() {
    /** @type {!Array<T>} */
    this._current;
    /** @type {Array<T>} */
    this._updates;
    /** @type {(function(): Array<number>)|undefined} */
    this._mutation;
  }

  /** @param {number} ln */
  onSetup(ln) { }

  /** 
   * @param {number} index
   * @return {U} 
   */
  onEnter(index) { }

  /**
   * 
   * @param {number} from 
   * @param {number} to 
   * @param {number=} dir 
   */
  onMove(from, to, dir) { }

  /** @param {number} index @param {boolean=} final */
  onExit(index, final) { }

  /**
   * 
   * @param {number} cStart 
   * @param {number} cEnd 
   * @param {number} uStart n
   * @param {number} uEnd 
   */
  onUnresolved(cStart, cEnd, uStart, uEnd) { }

  /** @return {Array<U>} */
  onTeardown() { }

  /** @param {!Array<number>} mutation */
  onMutation(mutation) { }
}

/**
 * @final
 * @interface
 */
class NoValue { }

export {
  NoValue,
  IComputation,
  ISwitch,
  IEnumerable,
  IPatcher,
}