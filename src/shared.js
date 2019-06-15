/**
 * @record
 * @template T
 */
class IComputation {

  //@ts-ignore
  /** @return {T} */
  get() { }
}

/**
 * @final
 * @interface
 */
class NoValue { }

/** @type {!NoValue} */
const NOT_PENDING = /** @type {!NoValue} */({});

export { 
  NoValue, 
  NOT_PENDING,
  IComputation, 
}