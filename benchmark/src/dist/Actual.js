(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global._S_ = {}));
}(this, function (exports) { 'use strict';

    var IComputation = (function () {
        function IComputation() {
        }
        IComputation.prototype.get = function () { };
        return IComputation;
    }());
    var IEnumerable = (function () {
        function IEnumerable() {
        }
        return IEnumerable;
    }());
    IEnumerable.prototype.length;
    var IPatcher = (function () {
        function IPatcher() {
            this._current;
            this._updates;
            this._mutation;
        }
        IPatcher.prototype.onSetup = function (ln) { };
        IPatcher.prototype.onEnter = function (index) { };
        IPatcher.prototype.onMove = function (from, to, dir) { };
        IPatcher.prototype.onExit = function (index, final) { };
        IPatcher.prototype.onUnresolved = function (cStart, cEnd, uStart, uEnd) { };
        IPatcher.prototype.onTeardown = function () { };
        IPatcher.prototype.onMutation = function (mutation) { };
        return IPatcher;
    }());
    var NoValue = (function () {
        function NoValue() {
        }
        return NoValue;
    }());

    var __extends = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var Computation = (function () {
        function Computation() {
            this._value = null;
            this._fn = null;
            this._age = -1;
            this._state = 0;
            this._onchange = false;
            this._comparer = null;
            this._source1 = null;
            this._source1slot = 0;
            this._sources = null;
            this._sourceslots = null;
            this._ownerslot = -1;
            this._dependents = 0;
            this._dependentslots = null;
            this._log = null;
            this._owned = null;
            this._cleanups = null;
        }
        Computation.prototype.get = function () {
            if (Listener !== null) {
                if ((this._state & 7) !== 0) {
                    liftComputation(this);
                }
                if (this._age === RootClock._time && this._state === 8) {
                    throw new Error("Circular dependency.");
                }
                logDataRead(this);
            }
            return this._value;
        };
        return Computation;
    }());
    var Data = (function () {
        function Data(value) {
            this._value = value;
            this._log = null;
            this._pending = NOT_PENDING;
        }
        Data.prototype.get = function () {
            if (Listener !== null) {
                logDataRead(this);
            }
            return this._value;
        };
        Data.prototype.set = function (value) {
            logWrite(this, value);
            return value;
        };
        Data.prototype.update = function () {
            this._value = (this._pending);
            this._pending = NOT_PENDING;
        };
        return Data;
    }());
    var Value = (function (_super) {
        __extends(Value, _super);
        function Value(value, comparer) {
            var _this = _super.call(this, value) || this;
            _this._comparer = comparer;
            return _this;
        }
        Value.prototype.set = function (value) {
            return (this._comparer ? this._comparer(this._value, value) : this._value === value) ? value : _super.prototype.set.call(this, value);
        };
        return Value;
    }(Data));
    var Clock = (function () {
        function Clock() {
            this._time = 0;
            this._changes = new Queue();
            this._updates = new Queue();
            this._disposes = new Queue();
        }
        return Clock;
    }());
    var Log = (function () {
        function Log() {
            this._node1 = null;
            this._node1slot = 0;
            this._nodes = null;
            this._nodeslots = null;
        }
        return Log;
    }());
    var Queue = (function () {
        function Queue() {
            this._items = [];
            this._count = 0;
        }
        Queue.prototype.reset = function () {
            this._count = 0;
        };
        Queue.prototype.enqueue = function (item) {
            this._items[this._count++] = item;
        };
        Queue.prototype.run = function (fn) {
            for (var i = 0, ln = this._count, items = this._items; i < ln; i++) {
                fn(items[i]);
                items[i] = null;
            }
            this._count = 0;
        };
        return Queue;
    }());
    var NOT_PENDING = ({});
    var NOT_OWNED = new Computation();
    var RootClock = new Clock();
    var RunningClock = null;
    var Owner = null;
    var Listener = null;
    var Slot = 0;
    var Recycled = null;
    var S = {};
    S.run = function (fn, seed) {
        return makeComputationNode(fn, seed, getCandidateNode());
    };
    S.track = function (fn, seed, comparer) {
        var node = getCandidateNode();
        node._onchange = true;
        if (comparer !== void 0) {
            node._comparer = comparer;
        }
        return makeComputationNode(fn, seed, node);
    };
    S.root = function (fn) {
        var undisposed = fn.length === 0;
        var node = undisposed ? NOT_OWNED : getCandidateNode();
        var disposer = undisposed ? null : function () {
            if (node !== null) {
                if (RunningClock !== null) {
                    RootClock._disposes.enqueue(node);
                }
                else {
                    disposeComputation(node);
                }
            }
        };
        var owner = Owner;
        var listener = Listener;
        try {
            Owner = node;
            Listener = null;
            return undisposed ? (fn)() : fn(disposer);
        }
        finally {
            Owner = owner;
            Listener = listener;
            if (!undisposed && recycleOrClaimNode(node, null, undefined, true)) {
                node = null;
            }
        }
    };
    S.join = function (array) {
        return {
            get: function () {
                var ln = array.length;
                var out = new Array(ln);
                for (var i = 0; i < ln; i++) {
                    out[i] = (normalizeBinding(array[i], true));
                }
                return out;
            }
        };
    };
    S.bind = function (ev) {
        return normalizeBinding(ev);
    };
    S.call = function (ev) {
        return (normalizeBinding(ev, true));
    };
    S.on = function (ev, fn, seed, track, onchanges, comparer) {
        var sgn = (normalizeBinding(ev));
        var on = function (seed) {
            var result = sgn.get();
            if (onchanges) {
                onchanges = false;
            }
            else {
                var listener = Listener;
                try {
                    Listener = null;
                    seed = fn(result, seed);
                }
                finally {
                    Listener = listener;
                }
            }
            return seed;
        };
        return track ? S.track(on, seed, comparer) : S.run(on, seed);
    };
    S.freeze = function (fn) {
        var result;
        if (RunningClock !== null) {
            result = fn();
        }
        else {
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
    S.sample = function (fn) {
        var listener = Listener;
        try {
            Listener = null;
            return (normalizeBinding(fn, true));
        }
        finally {
            Listener = listener;
        }
    };
    S.renew = function (node) {
        if (node instanceof Computation) {
            liftComputation(node);
        }
    };
    S.cleanup = function (fn) {
        if (Owner !== null) {
            var cleanups = Owner._cleanups;
            if (cleanups === null) {
                Owner._cleanups = [fn];
            }
            else {
                cleanups.push(fn);
            }
        }
    };
    S.dispose = function (node) {
        if (node instanceof Computation) {
            if (RunningClock !== null) {
                RootClock._disposes.enqueue(node);
            }
            else {
                disposeComputation(node);
            }
        }
    };
    S.frozen = function () {
        return RunningClock !== null;
    };
    S.listening = function () {
        return Listener !== null;
    };
    function makeComputationNode(fn, value, node) {
        var owner = Owner;
        var listener = Listener;
        var toplevel = RunningClock === null;
        Owner = Listener = node;
        value = toplevel ? execToplevelComputation((fn), value) : fn(value);
        Owner = owner;
        Listener = listener;
        var recycled = recycleOrClaimNode(node, fn, value);
        if (toplevel) {
            finishToplevelComputation(owner, listener);
        }
        return recycled ? { get: function () { return value; } } : node;
    }
    function execToplevelComputation(fn, value) {
        var clock = RootClock;
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
    function finishToplevelComputation(owner, listener) {
        var clock = RootClock;
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
    function getCandidateNode() {
        if (Recycled !== null) {
            var node = Recycled;
            Recycled = null;
            return (node);
        }
        return new Computation();
    }
    function normalizeBinding(data, call) {
        var type = typeof data;
        return (type === 'object' ?
            call ? (data).get() : (data) :
            type === 'function' ?
                call ? (data)() : { get: (data) } :
                (data));
    }
    function recycleOrClaimNode(node, fn, value, orphan) {
        var _owner = (orphan || Owner === null || Owner === NOT_OWNED) ? null : Owner;
        var recycle = node._source1 === null && (node._owned === null && node._cleanups === null || _owner !== null);
        if (recycle) {
            var i = void 0;
            var j = void 0;
            var k = void 0;
            Recycled = node;
            if (_owner !== null) {
                if (node._owned !== null) {
                    if (_owner._owned === null) {
                        _owner._owned = node._owned;
                    }
                    else {
                        for (i = 0, j = _owner._owned.length, k = node._owned.length; i < k;) {
                            _owner._owned[j++] = node._owned[i++];
                        }
                    }
                    node._owned = null;
                }
                if (node._cleanups !== null) {
                    if (_owner._cleanups === null) {
                        _owner._cleanups = node._cleanups;
                    }
                    else {
                        for (i = 0, j = _owner._cleanups.length, k = node._cleanups.length; i < k;) {
                            _owner._cleanups[j++] = node._cleanups[i++];
                        }
                    }
                    node._cleanups = null;
                }
            }
        }
        else {
            node._fn = fn;
            node._value = value;
            node._age = RootClock._time;
            if (_owner !== null) {
                if (_owner._owned === null) {
                    _owner._owned = [node];
                }
                else {
                    _owner._owned.push(node);
                }
            }
        }
        return recycle;
    }
    function logDataRead(data) {
        var log = data._log;
        if (log === null) {
            log = data._log = new Log();
        }
        logRead(log);
    }
    function liftComputation(node) {
        if ((node._state & 6) !== 0) {
            var queue = RootClock._updates;
            applyUpstreamUpdates(node, queue._items);
        }
        applyComputationUpdate(node);
    }
    function logRead(from) {
        var fromslot;
        var to = (Listener);
        var toslot = to._source1 === null ? -1 : to._sources === null ? 0 : to._sources.length;
        if (from._node1 === null) {
            from._node1 = to;
            from._node1slot = toslot;
            fromslot = -1;
        }
        else if (from._nodes === null) {
            from._nodes = [to];
            from._nodeslots = [toslot];
            fromslot = 0;
        }
        else {
            fromslot = from._nodes.length;
            from._nodes[fromslot] = to;
            from._nodeslots.push(toslot);
        }
        if (to._source1 === null) {
            to._source1 = from;
            to._source1slot = fromslot;
        }
        else if (to._sources === null) {
            to._sources = [from];
            to._sourceslots = [fromslot];
        }
        else {
            to._sources[toslot] = from;
            to._sourceslots.push(fromslot);
        }
    }
    function logWrite(node, value) {
        if (RunningClock !== null) {
            if (node._pending !== NOT_PENDING) {
                if (value !== node._pending) {
                    throw new Error("Conflicting changes");
                }
            }
            else {
                node._pending = value;
                RootClock._changes.enqueue(node);
            }
        }
        else {
            node._pending = value;
            if (node._log !== null) {
                RootClock._changes.enqueue(node);
                event();
            }
            else {
                node.update();
            }
        }
    }
    function event() {
        var owner = Owner;
        RootClock._updates.reset();
        try {
            run(RootClock);
        }
        finally {
            Owner = owner;
            RunningClock = Listener = null;
        }
    }
    function run(clock) {
        var count = 0;
        var running = RunningClock;
        var changes = clock._changes;
        var updates = clock._updates;
        var disposes = clock._disposes;
        disposes.reset();
        RunningClock = clock;
        while (changes._count !== 0 || updates._count !== 0 || disposes._count !== 0) {
            clock._time++;
            changes.run(applyDataUpdate);
            updates.run(applyComputationUpdate);
            disposes.run(disposeComputation);
            if (count++ > 1e5) {
                throw new Error("Runaway clock detected");
            }
        }
        RunningClock = running;
    }
    function applyDataUpdate(data) {
        data.update();
        if (data._log !== null) {
            setComputationState(data._log, stateStale);
        }
    }
    function applyComputationUpdate(node) {
        if ((node._state & 2) !== 0) {
            if (--node._dependents === 0) {
                node._state &= ~6;
                node._ownerslot = -1;
                node._dependentslots = null;
            }
        }
        else if ((node._state & 1) !== 0) {
            if (node._onchange) {
                var current = updateComputation(node);
                if (node._comparer != null ? node._comparer(current, node._value) : node._value !== current) {
                    markDownstreamComputations(node, false, true);
                }
            }
            else {
                updateComputation(node);
            }
        }
    }
    function updateComputation(node) {
        var value = node._value;
        var owner = Owner;
        var listener = Listener;
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
    function stateStale(node) {
        var time = RootClock._time;
        if (node._age < time) {
            node._state |= 1;
            node._age = time;
            setDownstreamState(node, node._onchange);
        }
    }
    function statePending(node) {
        var time = RootClock._time;
        if (node._age < time) {
            node._state |= 2;
            node._dependents++;
            var slots = node._dependentslots;
            if (slots === null) {
                node._dependentslots = [Slot];
            }
            else {
                slots.push(Slot);
            }
            setDownstreamState(node, true);
        }
    }
    function setDownstreamState(node, pending) {
        var updates = RootClock._updates;
        updates.enqueue(node);
        if (node._onchange) {
            var slot = Slot;
            Slot = updates._count - 1;
            markDownstreamComputations(node, pending, false);
            Slot = slot;
        }
        else {
            markDownstreamComputations(node, pending, false);
        }
    }
    function pendingStateStale(node) {
        if ((node._state & 2) !== 0) {
            node._state = 1;
            var time = RootClock._time;
            if (node._age < time) {
                node._age = time;
                if (!node._onchange) {
                    markDownstreamComputations(node, false, true);
                }
            }
        }
    }
    function markDownstreamComputations(node, onchange, dirty) {
        var owned = node._owned;
        if (owned !== null) {
            var pending_1 = onchange && !dirty;
            markForDisposal(owned, pending_1, pending_1 ? 0 : RootClock._time, pending_1 ? Slot : 0);
        }
        var log = node._log;
        if (log !== null) {
            setComputationState(log, dirty ? pendingStateStale : onchange ? statePending : stateStale);
        }
    }
    function setComputationState(log, stateFn) {
        var node1 = log._node1;
        if (node1 !== null) {
            stateFn(node1);
        }
        var nodes = log._nodes;
        if (nodes !== null) {
            for (var i = 0, ln = nodes.length; i < ln; i++) {
                stateFn(nodes[i]);
            }
        }
    }
    function markForDisposal(children, pending, time, slot) {
        for (var i = 0, ln = children.length; i < ln; i++) {
            var child = children[i];
            if (pending) {
                child._state |= 4;
                child._ownerslot = slot;
            }
            else {
                child._state = 0;
                child._age = time;
            }
            var owned = child._owned;
            if (owned !== null) {
                markForDisposal(owned, pending, time, slot);
            }
        }
    }
    function applyUpstreamUpdates(node, updates) {
        if ((node._state & 4) !== 0) {
            var owner = updates[node._ownerslot];
            if (owner !== null) {
                applyUpstreamUpdates(owner, updates);
            }
        }
        if ((node._state & 2) !== 0) {
            var slots = (node._dependentslots);
            var ln = slots.length;
            for (var i = ln - node._dependents; i < ln; i++) {
                var dependency = updates[slots[i]];
                if (dependency !== null) {
                    applyUpstreamUpdates(dependency, updates);
                }
            }
        }
        applyComputationUpdate(node);
    }
    function cleanup(node, final) {
        var i;
        var ln;
        var cleanups = node._cleanups;
        if (cleanups !== null) {
            for (i = 0, ln = cleanups.length; i < ln; i++) {
                cleanups[i](final);
            }
            node._cleanups = null;
        }
        var owned = node._owned;
        if (owned !== null) {
            for (i = 0, ln = owned.length; i < ln; i++) {
                disposeComputation(owned[i]);
            }
            node._owned = null;
        }
        var source1 = node._source1;
        if (source1 !== null) {
            cleanupSource(source1, node._source1slot);
            node._source1 = null;
        }
        var sources = node._sources;
        if (sources !== null) {
            var sourceslots = (node._sourceslots);
            for (i = 0, ln = sources.length; i < ln; i++) {
                cleanupSource(sources.pop(), sourceslots.pop());
            }
        }
    }
    function cleanupSource(source, slot) {
        if (slot === -1) {
            source._node1 = null;
        }
        else {
            var nodes = source._nodes;
            var nodeslots = source._nodeslots;
            var last = nodes.pop();
            var lastslot = nodeslots.pop();
            if (slot !== nodes.length) {
                nodes[slot] = last;
                nodeslots[slot] = lastslot;
                if (lastslot === -1) {
                    last._source1slot = slot;
                }
                else {
                    last._sourceslots[lastslot] = slot;
                }
            }
        }
    }
    function disposeComputation(node) {
        node._fn = null;
        node._log = null;
        cleanup(node, true);
    }

    var __extends$1 = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var List = (function (_super) {
        __extends$1(List, _super);
        function List(value) {
            var _this = _super.call(this, value) || this;
            _this._queue = [];
            _this._count = 0;
            return _this;
        }
        Object.defineProperty(List.prototype, "length", {
            get: function () {
                return this.get().length;
            },
            enumerable: true,
            configurable: true
        });
        List.prototype.set = function (value) {
            this._count = 0;
            enqueue(this, function (array) {
                var ln = value.length;
                for (var i = 0; i < ln; i++) {
                    array[i] = value[i];
                }
                array.length = ln;
            });
            return value;
        };
        List.prototype.update = function () {
            var queue = this._queue;
            var value = this._value;
            for (var i = 0; i < this._count; i++) {
                queue[i](value, value.length);
                queue[i] = null;
            }
            this._count = 0;
            this._pending = NOT_PENDING;
        };
        List.prototype.push = function (value) {
            enqueue(this, function (array, ln) {
                array[ln] = value;
            });
        };
        List.prototype.pop = function () {
            enqueue(this, function (array, ln) {
                if (ln) {
                    array.length--;
                }
            });
        };
        List.prototype.unshift = function (value) {
            enqueue(this, function (array, ln) {
                while (ln) {
                    array[ln--] = array[ln];
                }
                array[0] = value;
            });
        };
        List.prototype.shift = function () {
            enqueue(this, function (array) {
                array.shift();
            });
        };
        List.prototype.insert = function (index, value) {
            enqueue(this, function (array, ln) {
                index = index < 0 ? index + ln : index;
                if (index >= 0 && index <= ln) {
                    array.splice(index, 0, value);
                }
            });
        };
        List.prototype.insertRange = function (index, values) {
            enqueue(this, function (array, ln) {
                insertRange(array, ln, index, values);
            });
        };
        List.prototype.remove = function (value) {
            enqueue(this, function (array, ln) {
                for (var i = 0; i < ln; i++) {
                    if (array[i] === value) {
                        return removeAt(array, i, ln);
                    }
                }
            });
        };
        List.prototype.removeAt = function (index) {
            enqueue(this, function (array, ln) {
                removeAt(array, index, ln);
            });
        };
        List.prototype.removeRange = function (from, count) {
            enqueue(this, function (array, ln) {
                removeRange(array, ln, from, count);
            });
        };
        List.prototype.replace = function (index, value) {
            enqueue(this, function (array, ln) {
                index = index < 0 ? ln + index : index;
                if (ln && index >= 0 && index < ln) {
                    array[index] = value;
                }
            });
        };
        List.prototype.move = function (from, to) {
            enqueue(this, function (array, ln) {
                move(array, ln, from, to);
            });
        };
        List.prototype.enumerable = function () {
            return new Enumerable(this);
        };
        List.prototype.forEach = function (fn) {
            return this.enumerable().forEach(fn);
        };
        List.prototype.map = function (fn) {
            return this.enumerable().map(fn);
        };
        return List;
    }(Data));
    var Observable = (function (_super) {
        __extends$1(Observable, _super);
        function Observable(value) {
            var _this = _super.call(this, value) || this;
            _this._mutation = null;
            return _this;
        }
        Observable.prototype.enumerable = function () {
            var _this = this;
            return new Enumerable(this, function () { return _this._mutation; });
        };
        return Observable;
    }(List));
    var Enumerable = (function () {
        function Enumerable(source, mutation) {
            this._source = source;
            this._mutation = mutation;
        }
        Object.defineProperty(Enumerable.prototype, "length", {
            get: function () {
                return this.get().length;
            },
            enumerable: true,
            configurable: true
        });
        Enumerable.prototype.get = function () {
            return this._source.get();
        };
        Enumerable.prototype.forEach = function (fn) {
            mount(new Patcher(fn, this._mutation), this._source);
        };
        Enumerable.prototype.map = function (fn) {
            return new Enumerable(mount(new MapPatcher(fn, this._mutation), this._source), this._mutation);
        };
        return Enumerable;
    }());
    var Patcher = (function () {
        function Patcher(fn, mutation) {
            this._current = [];
            this._updates = null;
            this._mutation = mutation;
            this._factory = fn;
            this._indexed = fn.length > 1;
            this._disposers = [];
            this._tempDisposers = null;
            this._indices = [];
            this._tempIndices = null;
        }
        Patcher.prototype.onSetup = function (ln) {
            this._tempDisposers = new Array(ln);
            if (this._indexed) {
                this._tempIndices = new Array(ln);
            }
        };
        Patcher.prototype.onMutation = function (m) {
        };
        Patcher.prototype.onEnter = function (index) {
            return enter(this, index);
        };
        Patcher.prototype.onMove = function (from, to) {
            this._tempDisposers[to] = this._disposers[from];
            if (this._indexed) {
                (this._tempIndices[to] = this._indices[from]).index = to;
            }
        };
        Patcher.prototype.onExit = function (index) {
            this._disposers[index]();
        };
        Patcher.prototype.onUnresolved = function (cStart, cEnd, uStart, uEnd) {
            resolve(this, cStart, cEnd, uStart, uEnd);
        };
        Patcher.prototype.onTeardown = function () {
            this._current = this._updates.slice();
            this._disposers = (this._tempDisposers);
            this._tempDisposers = null;
            if (this._indexed) {
                this._indices = (this._tempIndices);
                this._tempIndices = null;
            }
            return null;
        };
        return Patcher;
    }());
    var MapPatcher = (function (_super) {
        __extends$1(MapPatcher, _super);
        function MapPatcher(fn, mutation) {
            var _this = _super.call(this, fn, mutation) || this;
            _this._mapped = [];
            _this._tempMapped = null;
            return _this;
        }
        MapPatcher.prototype.onSetup = function (ln) {
            this._tempMapped = new Array(ln);
            _super.prototype.onSetup.call(this, ln);
        };
        MapPatcher.prototype.onEnter = function (index) {
            return this._tempMapped[index] = _super.prototype.onEnter.call(this, index);
        };
        MapPatcher.prototype.onMove = function (from, to) {
            this._tempMapped[to] = this._mapped[from];
            _super.prototype.onMove.call(this, from, to);
        };
        MapPatcher.prototype.onTeardown = function () {
            this._mapped = (this._tempMapped);
            this._tempMapped = null;
            _super.prototype.onTeardown.call(this);
            return this._mapped;
        };
        return MapPatcher;
    }(Patcher));
    function reconcile(patcher, u) {
        var ln = u.length;
        patcher._updates = u;
        patcher.onSetup(ln);
        var m = patcher._mutation ? patcher._mutation() : null;
        if (m !== null) {
            patcher.onMutation(m);
        }
        else {
            var c = patcher._current;
            var cStart = 0;
            var uStart = 0;
            var cEnd = c.length - 1;
            var uEnd = ln - 1;
            if (cEnd < 0) {
                if (uEnd > 0) {
                    while (uStart <= uEnd) {
                        patcher.onEnter(uStart++);
                    }
                }
            }
            else if (uStart < 0) {
                if (cEnd > 0) {
                    while (cStart <= cEnd) {
                        patcher.onExit(cStart++);
                    }
                }
            }
            else {
                var loop = true;
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
                }
                else if (cStart > cEnd) {
                    while (uStart <= uEnd) {
                        patcher.onEnter(uStart++);
                    }
                }
                else {
                    patcher.onUnresolved(cStart, cEnd, uStart, uEnd);
                }
            }
        }
        var result = patcher.onTeardown();
        patcher._updates = null;
        return result;
    }
    function mount(patcher, source) {
        S.cleanup(function () { dismount(patcher); });
        return S.on(source, function (result) {
            return (reconcile(patcher, result));
        });
    }
    function dismount(patcher) {
        for (var i = 0, ln = patcher._current.length; i < ln; i++) {
            patcher.onExit(i, true);
        }
    }
    function enter(patcher, index) {
        return S.root(function (dispose) {
            patcher._tempDisposers[index] = dispose;
            var item = patcher._updates[index];
            var owner = (Owner);
            var factory = patcher._factory;
            if (patcher._indexed) {
                var ti_1 = patcher._tempIndices[index] = { data: null, index: index };
                var i = ti_1.data = S.track(function () { logDataRead(owner); return ti_1.index; });
                return (factory)(item, i);
            }
            return (factory)(item);
        });
    }
    function resolve(patcher, cStart, cEnd, uStart, uEnd) {
        var c = patcher._current;
        var u = patcher._updates;
        var i = 0;
        var preserved = {};
        var map = new Map();
        for (i = cEnd; i >= cStart; i--) {
            var cItem = c[i];
            var ex = map.get(cItem);
            if (ex != null) {
                if (typeof ex == 'number') {
                    map.set(cItem, [ex, i]);
                }
                else {
                    ex.push(i);
                }
            }
            else {
                map.set(cItem, i);
            }
        }
        for (i = uStart; i <= uEnd; i++) {
            var uItem = u[i];
            var ex = map.get(uItem);
            if (ex != null) {
                var nbr = typeof ex === 'number';
                var index = nbr ? (ex) : (ex).pop();
                if (nbr || index == null) {
                    map.delete(uItem);
                }
                if (index != null) {
                    preserved[index] = true;
                    patcher.onMove(index, i);
                }
                else {
                    patcher.onEnter(cStart);
                }
            }
            else {
                patcher.onEnter(cStart);
            }
        }
        for (i = cStart; i <= cEnd; i++) {
            if (!preserved[i]) {
                patcher.onExit(i);
            }
        }
    }
    function enqueue(list, change) {
        list._queue[list._count++] = change;
        logWrite(list, null);
    }
    function move(array, ln, from, to) {
        from = from < 0 ? ln + from : from;
        to = to < 0 ? ln + to : to;
        if (ln && from !== to && to >= 0 && from >= 0 && from < ln) {
            var item = array[from];
            var dir = from < to ? 1 : -1;
            for (var j = from; j !== to;) {
                array[j] = array[(j += dir)];
            }
            array[to === ln ? to - 1 : to] = item;
        }
    }
    function removeAt(array, index, ln) {
        index = index < 0 ? ln + index : index;
        if (ln && index >= 0 && index < ln) {
            while (index < ln) {
                array[index++] = array[index];
            }
            array.length--;
        }
    }
    function removeRange(array, ln, from, count) {
        from = from < 0 ? ln + from : from;
        if (ln && from >= 0 && from < ln) {
            var to = from + count;
            for (to = to < ln ? to : ln; to < ln;) {
                array[from++] = array[to++];
            }
            array.length -= to - from;
        }
    }
    function insertRange(array, ln, index, values) {
        index = index < 0 ? index + ln : index;
        var vln = values.length;
        if (vln && index >= 0 && index <= ln) {
            for (var i = ln - 1; i >= index; i--) {
                array[i + vln] = array[i];
            }
            for (var i = 0, j = index; i < vln;) {
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

    Object.defineProperty(exports, '__esModule', { value: true });

}));
