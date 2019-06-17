/**
 * @record
 * @template T
 */
class IComputation {

  //@ts-ignore
  /** @param {boolean=} sample @return {T} */
  get(sample) { }
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
  
  /** @param {number} ln */
  onSetup(ln) { }

  /** 
   * @param {number} index
   //@ts-ignore
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

  //@ts-ignore
  /** @return {Array<U>} */
  onTeardown() { }

  /** @param {!Array<number>} mutation */
  onMutation(mutation) { }
}

//@ts-ignore
/** @type {!Array<T>} */
IPatcher.prototype._current;

//@ts-ignore
/** @type {Array<T>} */
IPatcher.prototype._updates;

/** @type {(function(): Array<number>)|undefined} */
IPatcher.prototype._mutation;

/**
 * @final
 * @interface
 */
class NoValue { }

export { 
  NoValue, 
  IComputation,
  IEnumerable,
  IPatcher,
}