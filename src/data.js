import {
  NoValue,
  NOT_PENDING,
  IComputation,
} from './shared';

const S = {};

/**
 * @template T 
 * @implements {IComputation<T>}
 */
class Signal {

  /**
   * 
   * @param {T} value 
   */
  constructor(value) {
    /**
     * @protected 
     * @type {T} */
    this._value = value;
  }

  /** @return {T} */
  get() {
    return this._value;
  }
}

/**
 * @template T 
 * @extends {Signal<T>}
 */
class Computation extends Signal {

  constructor() {
    super(void 0);
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
    this._dependents = 0;
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

  /**
   * @override 
   * @return {T} 
   */
  get() {
    if (Listener !== null) {
      logComputationRead(this);
    }
    return this._value;
  }
}

/**
 * @template T
 * @extends {Signal<T>}
 */
class Data extends Signal {

  /**
   * 
   * @param {T} value 
   */
  constructor(value) {
    super(value);
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
   * @override
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
/** @type {boolean} */
let Escaped = false;
/** @type {Computation} */
let Recycled = null;

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
  const node = /** @type {!Computation<T>} */(getCandidateNode());
  node._onchange = true;
  return makeComputationNode(fn, seed, node);
}

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
 * @param {!IComputation|!Array<IComputation>|function(): void} ev
 * @param {(function(): T)|(function(T): T)} fn
 * @param {boolean=} onchanges 
 * @return {function(T=): T}
 */
S.bind = function (ev, fn, onchanges) {
  /** @type {number} */
  const type = typeof ev === 'function' ? 0 : Array.isArray(ev) ? 1 : 2;
  return /** @param {T=} value @return {T} */ function (value) {
    if (type === 0) {
      /** @type {function(): void} */(ev)();
    } else if (type === 1) {
      for (let /** number */ i = 0, /** number */ ln = /** @type {!Array<IComputation>} */(ev).length; i < ln; i++) {
        /** @type {!Array<IComputation>} */(ev)[i].get();
      }
    } else {
      /** @type {!IComputation} */(ev).get();
    }
    if (onchanges) {
      onchanges = false;
    } else {
      value = S.sample(() => fn(value));
    }
    return value;
  }
}

/**
 * @const
 * @template T,U
 * @param {!IComputation<U>|function(): U} ev
 * @param {(function(U): T)|(function(U, T): T)} fn
 * @param {T=} seed 
 * @param {boolean=} onchanges 
 * @return {!IComputation<T>}
 */
S.on = function (ev, fn, seed, onchanges) {
  /** @type {boolean} */
  const isfn = typeof ev === 'function';

  return S.run(/** @param {T=} seed @return {T} */ (seed) => {
    /** @type {U} */
    const result = isfn ? /** @type {function(): U} */(ev)() : /** @type {!IComputation<U>} */(ev).get();
    if (onchanges) {
      onchanges = false;
    } else {
      seed = S.sample(() => fn(result, seed));
    }
    return seed;
  }, seed);
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
 * @param {!IComputation<T>|function(): T} fn
 * @return {T}
 */
S.sample = function (fn) {
  /** @type {Computation} */
  const listener = Listener;
  try {
    Listener = null;
    return typeof fn === 'function' ? fn() : fn.get();
  } finally {
    Listener = listener;
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
 * @template T
 * @param {function(): T} fn
 */
S.escape = function (fn) {
  /** @type {boolean} */
  const escaped = Escaped;
  try {
    Escaped = true;
    return fn();
  } finally {
    Escaped = escaped;
  }
}

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
  value = toplevel ? execToplevelComputation(fn, value) : fn(value);
  Owner = owner;
  Listener = listener;
  /** @type {boolean} */
  const recycled = recycleOrClaimNode(node, fn, value);
  if (toplevel) {
    finishToplevelComputation(owner, listener);
  }
  return recycled ? new Signal(value) : node;
}

/**
 * @template T
 * @param {function(T=): T} fn 
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
 * 
 * @param {!Computation} node 
 */
function logComputationRead(node) {
  if ((node._state & 6) !== 0) {
    /** @type {!Array<Computation>} */
    const queue = RootClock._updates._items;
    applyUpstreamUpdates(node, queue);
  }
  if (node._age === RootClock._time) {
    if (node._state === 8 && !Escaped) {
      throw new Error("Circular dependency.");
    }
    applyComputationUpdate(node);
  }
  logDataRead(node);
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
  if ((node._state & 2) !== 0) {
    if (--node._dependents === 0) {
      node._state &= ~6;
      node._ownerslot = -1;
      node._dependentslots = null;
    }
  } else if ((node._state & 1) !== 0) {
    if (node._onchange) {
      /** @type {T} */
      const current = updateComputation(node);
      if (node._value !== current) {
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
  node._state = 8;
  cleanup(node, false);
  node._value = node._fn(node._value);
  node._state = 0;
  node._dependents = 0;
  node._dependentslots = null;
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
    node._state |= 1;
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
    node._state |= 2;
    node._dependents++;
    /** @type {Array<number>} */
    const slots = node._dependentslots;
    if (slots === null) {
      node._dependentslots = [Slot];
    } else {
      slots.push(Slot);
    }
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
    markDownstreamComputations(node, pending, false);
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
    markForDisposal(owned, pending, pending ? 0 : RootClock._time, pending ? Slot : 0);
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
      child._state |= 4;
      child._ownerslot = slot;
    } else {
      child._state = 0;
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
 * 
 * @param {Computation} node 
 * @param {!Array<!Computation>} updates
 */
function applyUpstreamUpdates(node, updates) {
  if ((node._state & 4) !== 0) {
    /** @type {Computation} */
    const owner = updates[node._ownerslot];
    if (owner !== null) {
      applyUpstreamUpdates(owner, updates);
    }
  }
  if ((node._state & 2) !== 0) {
    const slots = /** @type {!Array<number>} */(node._dependentslots);
    /** @type {number} */
    const ln = slots.length;
    for (let /** number */ i = ln - node._dependents; i < ln; i++) {
      /** @type {!Computation} */
      const dependency = updates[slots[i]];
      if (dependency !== null) {
        applyUpstreamUpdates(dependency, updates);
      }
    }
  }
  applyComputationUpdate(node);
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
function disposeComputation(node) {
  node._fn = null;
  node._log = null;
  cleanup(node, true);
}

export {
  S,
  Data,
  Value,
  Owner,
  logDataRead,
  Computation,
}