'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

//@ts-nocheck

/**
 * @record
 * @template T
 */
class IComputation {

  /** @return {T} */
  get() { }
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

/**
 * @template T 
 * @implements {IComputation<T>}
 */
class Computation {

  constructor() {
    /**
     * @private 
     * @type {T} */
    this._value = null;
    /** 
     * @private 
     * @type {(function(T=): T)|null} */
    this._fn = null;
    /** 
     * @private 
     * @type {number} */
    this._age = -1;
    /** 
     * @private 
     * @type {number} */
    this._state = 0;
    /**
     * @private 
     * @type {boolean} */
    this._onchange = false;
    /**
     * @private 
     * @type {(function(T, T): boolean)|null} */
    this._comparer = null;
    /** 
     * @private 
     * @type {Log} */
    this._source1 = null;
    /** 
     * @private 
     * @type {number} */
    this._source1slot = 0;
    /** 
     * @private 
     * @type {Array<Log>} */
    this._sources = null;
    /** 
     * @private 
     * @type {Array<number>} */
    this._sourceslots = null;
    /**
     * @private 
     * @type {number} */
    this._ownerslot = -1;
    /**
     * @private 
     * @type {number} */
    this._ownerage = -1;
    /**
     * @private 
     * @type {number} */
    this._dependents = 0;
    /**
     * @private 
     * @type {number} */
    this._dependentslot = 0;
    /**
     * @private 
     * @type {Array<number>} */
    this._dependentslots = null;
    /** 
     * @private 
     * @type {Log} */
    this._log = null;
    /** 
     * @private 
     * @type {Array<!Computation>} */
    this._owned = null;
    /** 
     * @private 
     * @type {Array<function(boolean): void>} */
    this._cleanups = null;
  }

  /** @return {T} */
  get() {
    if (Listener !== null) {
      if ((this._state & 7) !== 0) {
        liftComputation(this);
      }
      if (this._age === RootClock._time && this._state === 8) {
        throw new Error("Circular dependency.");
      }
      if (this._state !== 16) {
        logDataRead(this);
      }
    }
    return this._value;
  }
}

/**
 * @template T
 * @implements {IComputation<T>}
 */
class Data {

  /**
   * 
   * @param {T} value 
   */
  constructor(value) {
    /**
     * @protected 
     * @type {T} */
    this._value = value;
    /** 
     * @private 
     * @type {Log} */
    this._log = null;
    /** 
     * @protected 
     * @type {T|NoValue} */
    this._pending = NOT_PENDING;
  }

  /**
   * @final
   * @return {T} 
   */
  get() {
    if (Listener !== null) {
      logDataRead(this);
    }
    return this._value;
  }

  /**
   * @param {T} value 
   * @return {T}
   */
  set(value) {
    logWrite(this, value);
    return value;
  }

  /** @protected */
  update() {
    this._value = /** @type {T} */(this._pending);
    this._pending = NOT_PENDING;
  }
}

/**
 * @template T
 * @extends {Data<T>}
 */
class Value extends Data {

  /**
   * 
   * @param {T} value 
   * @param {function(T, T): boolean=} comparer
   */
  constructor(value, comparer) {
    super(value);
    /** 
     * @const
     * @private 
     * @type {(function(T, T): boolean)|undefined} */
    this._comparer = comparer;
  }

  /**
   * @override
   * @param {T} value 
   * @return {T} 
   */
  set(value) {
    return (this._comparer ? this._comparer(this._value, value) : this._value === value) ? value : super.set(value);
  }
}

class Clock {

  constructor() {
    /** 
     * @private 
     * @type {number} */
    this._time = 0;
    /**
     * @const 
     * @private
     * @type {!Queue<!Data>} */
    this._changes = new Queue();
    /** 
     * @const
     * @private 
     * @type {!Queue<!Computation>} */
    this._updates = new Queue();
    /** 
     * @const
     * @private 
     * @type {!Queue<!Computation>} */
    this._disposes = new Queue();
  }
}

class Log {

  constructor() {
    /** 
     * @private 
     * @type {Computation} */
    this._node1 = null;
    /** 
     * @private 
     * @type {number} */
    this._node1slot = 0;
    /** 
     * @private 
     * @type {Array<!Computation>} */
    this._nodes = null;
    /** 
     * @private 
     * @type {Array<number>} */
    this._nodeslots = null;
  }
}

/** @template T */
class Queue {

  constructor() {
    /**
     * @const 
     * @private
     * @type {!Array<T>} */
    this._items = [];
    /** 
     * @private 
     * @type {number} */
    this._count = 0;
  }

  reset() {
    this._count = 0;
  }

  /** @param {T} item */
  enqueue(item) {
    this._items[this._count++] = item;
  }

  /** @param {function(T): void} fn */
  run(fn) {
    for (let /** number */ i = 0, /** number */ ln = this._count, items = this._items; i < ln; i++) {
      fn(items[i]);
      items[i] = null;
    }
    this._count = 0;
  }
}

/** @type {!NoValue} */
const NOT_PENDING = /** @type {!NoValue} */({});
/** @type {!Computation} */
const NOT_OWNED = new Computation();
/** @type {!Clock} */
const RootClock = new Clock();
/** @type {Clock} */
let RunningClock = null;
/** @type {Computation} */
let Owner = null;
/** @type {Computation} */
let Listener = null;
/** @type {number} */
let Slot = 0;
/** @type {Computation} */
let Recycled = null;


/** @implements {ISwitch} */
const S = {};

/**
 * @const
 * @template T
 * @param {(function(): T)|(function(T): T)} fn 
 * @param {T=} seed
 * @return {!IComputation<T>} 
 */
S.run = function (fn, seed) {
  return makeComputationNode(fn, seed, getCandidateNode());
};

/**
 * @const
 * @template T
 * @param {(function(): T)|(function(T): T)} fn 
 * @param {T=} seed
 * @param {function(T, T): boolean=} comparer
 * @return {!IComputation<T>} 
 */
S.track = function (fn, seed, comparer) {
  const node = getCandidateNode();
  node._onchange = true;
  if (comparer !== void 0) {
    node._comparer = comparer;
  }
  return makeComputationNode(fn, seed, node);
};

/**
 * @const
 * @template T
 * @param {(function(): T)|(function(function(): void): T)} fn
 * @return {T}
 */
S.root = function (fn) {
  /** @type {boolean} */
  const undisposed = fn.length === 0;
  /** @type {Computation} */
  let node = undisposed ? NOT_OWNED : getCandidateNode();
  /** @type {null|function(): void} */
  const disposer = undisposed ? null : () => {
    if (node !== null) {
      if (RunningClock !== null) {
        RootClock._disposes.enqueue(node);
      } else {
        disposeComputation(node);
      }
    }
  };
  /** @type {Computation} */
  const owner = Owner;
  /** @type {Computation} */
  const listener = Listener;
  try {
    Owner = node;
    Listener = null;
    return undisposed ? /** @type {function(): T} */(fn)() : fn(disposer);
  }
  finally {
    Owner = owner;
    Listener = listener;
    if (!undisposed && recycleOrClaimNode(node, null, undefined, true)) {
      node = null;
    }
  }
};

/**
 * @const
 * @template T
 * @param {!Array<!IComputation<T>>} array
 * @return {!IComputation<!Array<T>>}
 */
S.join = function (array) {
  return {
    /** @return {!Array<T>} */
    get() {
      /** @type {number} */
      const ln = array.length;
      /** @type {!Array<T>} */
      const out = new Array(ln);
      for (let /** number */ i = 0; i < ln; i++) {
        out[i] = array[i].get();
      }
      return out;
    }
  };
};

/**
 * @const 
 * @template T,U
 * @param {!IComputation<T>} node 
 * @param {function(T): U} selector
 * @return {!IComputation<U>}
 */
S.wrap = function (node, selector) {
  return { get: () => selector(node.get()) };
};

/**
 * @const
 * @template T,U
 * @param {!IComputation<U>} ev
 * @param {(function(U): T)|(function(U, T): T)} fn
 * @param {T=} seed 
 * @param {boolean=} track
 * @param {boolean=} onchanges  
 * @param {function(T, T): boolean=} comparer
 * @return {!IComputation<T>}
 */
S.on = function (ev, fn, seed, track, onchanges, comparer) {

  /**
   * @param {T=} seed
   * @return {T} 
   */
  const on = seed => {
    /** @type {U} */
    const result = ev.get();
    if (onchanges) {
      onchanges = false;
    } else {
      /** @type {Computation} */
      const listener = Listener;
      try {
        Listener = null;
        seed = fn(result, seed);
      } finally {
        Listener = listener;
      }
    }
    return seed;
  };
  return track ? S.track(on, seed, comparer) : S.run(on, seed);
};

/**
 * @const
 * @template T
 * @param {function(): T} fn
 * @return {T}
 */
S.freeze = function (fn) {
  /** @type {T} */
  let result;
  if (RunningClock !== null) {
    result = fn();
  } else {
    RunningClock = RootClock;
    RunningClock._changes.reset();
    try {
      result = fn();
      event();
    }
    finally {
      RunningClock = null;
    }
  }
  return result;
};


/**
 * @const
 * @template T
 * @param {!IComputation<T>} fn
 * @return {T}
 */
S.sample = function (fn) {
  /** @type {Computation} */
  const listener = Listener;
  try {
    Listener = null;
    return fn.get();
  } finally {
    Listener = listener;
  }
};

/**
 * @const
 * @param {IComputation} node 
 */
S.renew = function (node) {
  if (node instanceof Computation) {
    liftComputation(node);
  }
};

/**
 * @const
 * @param {function(boolean): void} fn 
 */
S.cleanup = function (fn) {
  if (Owner !== null) {
    /** @type {Array<function(boolean): void>} */
    const cleanups = Owner._cleanups;
    if (cleanups === null) {
      Owner._cleanups = [fn];
    } else {
      cleanups.push(fn);
    }
  }
};

/**
 * @const
 * @param {IComputation} node
 */
S.dispose = function (node) {
  if (node instanceof Computation) {
    if (RunningClock !== null) {
      RootClock._disposes.enqueue(node);
    } else {
      disposeComputation(node);
    }
  }
};

/** 
 * @const
 * @return {boolean} 
 */
S.frozen = function () {
  return RunningClock !== null;
};

/** 
 * @const
 * @return {boolean} 
 */
S.listening = function () {
  return Listener !== null;
};

/**
 * @template T
 * @param {function(T=): T} fn 
 * @param {T} value 
 * @param {!Computation<T>} node
 * @return {!IComputation<T>}
 */
function makeComputationNode(fn, value, node) {
  /** @type {Computation} */
  const owner = Owner;
  /** @type {Computation} */
  const listener = Listener;
  /** @type {boolean} */
  const toplevel = RunningClock === null;
  Owner = Listener = node;
  value = toplevel ? execToplevelComputation(/** @type {function(T): T} */(fn), value) : fn(value);
  Owner = owner;
  Listener = listener;
  /** @type {boolean} */
  const recycled = recycleOrClaimNode(node, fn, value);
  if (toplevel) {
    finishToplevelComputation(owner, listener);
  }
  return recycled ? { get: () => value } : node;
}

/**
 * @template T
 * @param {function(T): T} fn 
 * @param {T} value 
 * @return {T}
 */
function execToplevelComputation(fn, value) {
  /** @type {Clock} */
  const clock = RootClock;
  RunningClock = clock;
  clock._changes.reset();
  clock._updates.reset();
  try {
    return fn(value);
  }
  finally {
    Owner = Listener = RunningClock = null;
  }
}

/**
 * @param {Computation} owner 
 * @param {Computation} listener 
 */
function finishToplevelComputation(owner, listener) {
  /** @type {!Clock} */
  const clock = RootClock;
  if (clock._changes._count !== 0 || clock._updates._count !== 0 || clock._disposes._count !== 0) {
    try {
      run(clock);
    }
    finally {
      Owner = owner;
      Listener = listener;
      RunningClock = null;
    }
  }
}

/**
 * @template T
 * @return {!Computation<T>} 
 */
function getCandidateNode() {
  if (Recycled !== null) {
    /** @type {Computation} */
    const node = Recycled;
    Recycled = null;
    return /** @type {!Computation<T>} */(node);
  }
  return new Computation();
}

/**
 * @template T
 * @param {Computation} node 
 * @param {(function(T=): T)|null} fn 
 * @param {T} value 
 * @param {boolean=} orphan
 * @return {boolean} 
 */
function recycleOrClaimNode(node, fn, value, orphan) {
  /** @type {Computation} */
  const _owner = (orphan || Owner === null || Owner === NOT_OWNED) ? null : Owner;
  /** @type {boolean} */
  const recycle = node._source1 === null && (node._owned === null && node._cleanups === null || _owner !== null);
  if (recycle) {
    /** @type {number} */
    let i;
    /** @type {number} */
    let j;
    /** @type {number} */
    let k;
    Recycled = node;
    if (_owner !== null) {
      if (node._owned !== null) {
        if (_owner._owned === null) {
          _owner._owned = node._owned;
        } else {
          for (i = 0, j = _owner._owned.length, k = node._owned.length; i < k;) {
            _owner._owned[j++] = node._owned[i++];
          }
        }
        node._owned = null;
      }
      if (node._cleanups !== null) {
        if (_owner._cleanups === null) {
          _owner._cleanups = node._cleanups;
        } else {
          for (i = 0, j = _owner._cleanups.length, k = node._cleanups.length; i < k;) {
            _owner._cleanups[j++] = node._cleanups[i++];
          }
        }
        node._cleanups = null;
      }
    }
  } else {
    node._fn = fn;
    node._value = value;
    node._age = RootClock._time;
    if (_owner !== null) {
      if (_owner._owned === null) {
        _owner._owned = [node];
      } else {
        _owner._owned.push(node);
      }
    }
  }
  return recycle;
}

/**
 * 
 * @param {!Data|!Computation} data 
 */
function logDataRead(data) {
  /** @type {Log} */
  let log = data._log;
  if (log === null) {
    log = data._log = new Log();
  }
  logRead(log);
}

/**
 * Lift a computation node, 
 * which ensures we return an 
 * up to date value.
 * @param {!Computation} node 
 */
function liftComputation(node) {
  if ((node._state & 6) !== 0) {
    /** @type {!Queue<!Computation>} */
    const queue = RootClock._updates;
    applyUpstreamUpdates(node, queue._items);
  }
  applyComputationUpdate(node);
}

/**
 * 
 * @param {!Log} from 
 */
function logRead(from) {
  /** @type {number} */
  let fromslot;
  const to = /** @type {!Computation} */(Listener);
  /** @type {number} */
  const toslot = to._source1 === null ? -1 : to._sources === null ? 0 : to._sources.length;
  if (from._node1 === null) {
    from._node1 = to;
    from._node1slot = toslot;
    fromslot = -1;
  } else if (from._nodes === null) {
    from._nodes = [to];
    from._nodeslots = [toslot];
    fromslot = 0;
  } else {
    fromslot = from._nodes.length;
    from._nodes[fromslot] = to;
    from._nodeslots.push(toslot);
  }
  if (to._source1 === null) {
    to._source1 = from;
    to._source1slot = fromslot;
  } else if (to._sources === null) {
    to._sources = [from];
    to._sourceslots = [fromslot];
  } else {
    to._sources[toslot] = from;
    to._sourceslots.push(fromslot);
  }
}

/**
 * @template T
 * @param {Data<T>} node 
 * @param {T} value 
 */
function logWrite(node, value) {
  if (RunningClock !== null) {
    if (node._pending !== NOT_PENDING) {
      // value has already been set once, check for conflicts
      if (value !== node._pending) {
        throw new Error("Conflicting changes");
      }
    } else { // add to list of changes
      node._pending = value;
      RootClock._changes.enqueue(node);
    }
  } else {
    node._pending = value;
    if (node._log !== null) {
      RootClock._changes.enqueue(node);
      event();
    } else {
      node.update();
    }
  }
}

function event() {
  /** @type {Computation} */
  const owner = Owner;
  RootClock._updates.reset();
  try {
    run(RootClock);
  }
  finally {
    Owner = owner;
    RunningClock = Listener = null;
  }
}

/** @param {!Clock} clock */
function run(clock) {
  /** @type {number} */
  let count = 0;
  /** @type {Clock} */
  const running = RunningClock;
  /** @type {Queue<!Data>} */
  const changes = clock._changes;
  /** @type {Queue<!Computation>} */
  const updates = clock._updates;
  /** @type {Queue<!Computation>} */
  const disposes = clock._disposes;
  disposes.reset();
  RunningClock = clock;
  // for each batch ...
  while (changes._count !== 0 || updates._count !== 0 || disposes._count !== 0) {
    clock._time++;
    changes.run(applyDataUpdate);
    updates.run(applyComputationUpdate);
    disposes.run(disposeComputation);
    // if there are still changes after excessive batches, assume runaway            
    if (count++ > 1e5) {
      throw new Error("Runaway clock detected");
    }
  }
  RunningClock = running;
}

/**
 * 
 * @param {!Data} data 
 */
function applyDataUpdate(data) {
  data.update();
  if (data._log !== null) {
    setComputationState(data._log, stateStale);
  }
}


/**
 * @template T
 * @param {!Computation<T>} node 
 */
function applyComputationUpdate(node) {
  if ((node._state & 2) !== 0) { // pending
    if (++node._dependentslot === node._dependents) {
      restore(node);
    }
  } else if ((node._state & 1) !== 0) { // stale
    if (node._onchange) {
      /** @type {T} */
      const current = updateComputation(node);
      if (node._comparer != null ? node._comparer(current, node._value) : node._value !== current) {
        markDownstreamComputations(node, false, true);
      }
    } else {
      updateComputation(node);
    }
  }
}

/**
 * @template T
 * @param {!Computation<T>} node
 * @return {T} 
 */
function updateComputation(node) {
  /** @type {T} */
  const value = node._value;
  /** @type {Computation} */
  const owner = Owner;
  /** @type {Computation} */
  const listener = Listener;
  Owner = Listener = node;
  node._state = 8; // running
  cleanup(node, false);
  node._value = node._fn(node._value);
  restore(node);
  Owner = owner;
  Listener = listener;
  return value;
}

/**
 * 
 * @param {!Computation} node 
 */
function stateStale(node) {
  /** @type {number} */
  const time = RootClock._time;
  if (node._age < time) {
    node._state |= 1; // stale
    node._age = time;
    setDownstreamState(node, node._onchange);
  }
}

/**
 * 
 * @param {!Computation} node 
 */
function statePending(node) {
  /** @type {number} */
  const time = RootClock._time;
  if (node._age < time) {
    node._state |= 2; // pending
    /** @type {Array<number>} */
    let slots = node._dependentslots;
    if (slots === null) {
      slots = node._dependentslots = [];
    }
    slots[node._dependents++] = Slot;
    setDownstreamState(node, true);
  }
}

/**
 * 
 * @param {!Computation} node 
 * @param {boolean} pending
 */
function setDownstreamState(node, pending) {
  /** @type {!Queue<!Computation>} */
  const updates = RootClock._updates;
  updates.enqueue(node);
  if (node._onchange) {
    /** @type {number} */
    const slot = Slot;
    Slot = updates._count - 1;
    markDownstreamComputations(node, true, false);
    Slot = slot;
  } else {
    markDownstreamComputations(node, pending, false);
  }
}

/**
 * 
 * @param {!Computation} node 
 */
function pendingStateStale(node) {
  if ((node._state & 2) !== 0) {
    node._state = 1;
    /** @type {number} */
    const time = RootClock._time;
    if (node._age < time) {
      node._age = time;
      if (!node._onchange) {
        markDownstreamComputations(node, false, true);
      }
    }
  }
}

/**
 * @param {!Computation} node 
 * @param {boolean} onchange
 * @param {boolean} dirty
 */
function markDownstreamComputations(node, onchange, dirty) {
  /** @type {Array<!Computation>} */
  const owned = node._owned;
  if (owned !== null) {
    /** @type {boolean} */
    const pending = onchange && !dirty;
    markForDisposal(owned, pending, RootClock._time, Slot);
  }
  /** @type {Log} */
  const log = node._log;
  if (log !== null) {
    setComputationState(log, dirty ? pendingStateStale : onchange ? statePending : stateStale);
  }
}

/**
 * @param {!Log} log 
 * @param {function(!Computation): void} stateFn
 */
function setComputationState(log, stateFn) {
  /** @type {Computation} */
  const node1 = log._node1;
  if (node1 !== null) {
    stateFn(node1);
  }
  /** @type {Array<!Computation>} */
  const nodes = log._nodes;
  if (nodes !== null) {
    for (let /** number */ i = 0, /** number */ ln = nodes.length; i < ln; i++) {
      stateFn(nodes[i]);
    }
  }
}

/**
 * 
 * @param {!Array<!Computation>} children
 * @param {boolean} pending 
 * @param {number} time 
 * @param {number} slot
 */
function markForDisposal(children, pending, time, slot) {
  for (let /** number */ i = 0, /** number */ ln = children.length; i < ln; i++) {
    /** @type {!Computation} */
    const child = children[i];
    if (pending) {
      // pending disposal
      child._state |= 4; 
      child._ownerage = time;
      child._ownerslot = slot;
    } else {
       // disposed
      child._state = 16;
      child._age = time;
    }
    /** @type {Array<!Computation>} */
    const owned = child._owned;
    if (owned !== null) {
      markForDisposal(owned, pending, time, slot);
    }
  }
}

/**
 * Updates upstream dependencies before applying
 * update to current computation node.
 * @param {Computation} node 
 * @param {!Array<!Computation>} updates
 */
function applyUpstreamUpdates(node, updates) {
  /* 
    In case we try to access a pending node's value 
    after its pending owner updates the node in owner slot 
    will have completed and been set to null, so need to check for null.
  */
  if (node != null) {
    if ((node._state & 4) !== 0) {
      if (node._ownerage === RootClock._time) {
        applyUpstreamUpdates(updates[node._ownerslot], updates);
      } else {
        /* 
          This node was marked for disposal in a previous tick 
          by a pending computation that did not update.
        */
        node._state &= ~4;
        node._ownerage = node._ownerslot = -1;
      }
    }
    if ((node._state & 2) !== 0) {
      const slots = /** @type {!Array<number>} */(node._dependentslots);
      for (let /** number */ i = node._dependentslot, /** number */ ln = node._dependents; i < ln; i++) {
        applyUpstreamUpdates(updates[slots[i]], updates);
      }
    }
    applyComputationUpdate(node);
  }
}

/**
 * 
 * @param {!Computation} node 
 * @param {boolean} final 
 */
function cleanup(node, final) {
  /** @type {number} */
  let i;
  /** @type {number} */
  let ln;
  /** @type {Array<function(boolean): void>} */
  const cleanups = node._cleanups;
  if (cleanups !== null) {
    for (i = 0, ln = cleanups.length; i < ln; i++) {
      cleanups[i](final);
    }
    node._cleanups = null;
  }
  /** @type {Array<!Computation>} */
  const owned = node._owned;
  if (owned !== null) {
    for (i = 0, ln = owned.length; i < ln; i++) {
      disposeComputation(owned[i]);
    }
    node._owned = null;
  }
  /** @type {Log} */
  const source1 = node._source1;
  if (source1 !== null) {
    cleanupSource(source1, node._source1slot);
    node._source1 = null;
  }
  /** @type {Array<!Log>} */
  const sources = node._sources;
  if (sources !== null) {
    const sourceslots = /** @type {!Array<number>} */(node._sourceslots);
    for (i = 0, ln = sources.length; i < ln; i++) {
      cleanupSource(sources.pop(), sourceslots.pop());
    }
  }
}

/**
 * 
 * @param {!Log} source 
 * @param {number} slot 
 */
function cleanupSource(source, slot) {
  if (slot === -1) {
    source._node1 = null;
  } else {
    /** @type {Array<!Computation>} */
    const nodes = source._nodes;
    /** @type {Array<number>} */
    const nodeslots = source._nodeslots;
    /** @type {!Computation} */
    const last = nodes.pop();
    /** @type {number} */
    const lastslot = nodeslots.pop();
    if (slot !== nodes.length) {
      nodes[slot] = last;
      nodeslots[slot] = lastslot;
      if (lastslot === -1) {
        last._source1slot = slot;
      } else {
        last._sourceslots[lastslot] = slot;
      }
    }
  }
}

/**
 * 
 * @param {!Computation} node 
 */
function restore(node) {
  node._state &= ~14;
  node._ownerslot = node._ownerage = -1;
  node._dependents = node._dependentslot = 0;
}

/**
 * 
 * @param {!Computation} node 
 */
function disposeComputation(node) {
  node._log = node._fn = node._dependentslots = null;
  cleanup(node, true);
}

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
      removeAt(array, index, ln);
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
    });
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
    return /** @type {!Array<U>} */(reconcile(patcher, result));  });
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

exports.Data = Data;
exports.Enumerable = Enumerable;
exports.IComputation = IComputation;
exports.IEnumerable = IEnumerable;
exports.IPatcher = IPatcher;
exports.List = List;
exports.MapPatcher = MapPatcher;
exports.NoValue = NoValue;
exports.Patcher = Patcher;
exports.S = S;
exports.Value = Value;
exports.dismount = dismount;
exports.mount = mount;
exports.reconcile = reconcile;
