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
    var NoValue = (function () {
        function NoValue() {
        }
        return NoValue;
    }());
    var NOT_PENDING = ({});

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
    var S = {};
    var Signal = (function () {
        function Signal(value) {
            this._value = value;
        }
        Signal.prototype.get = function () {
            return this._value;
        };
        return Signal;
    }());
    var Computation = (function (_super) {
        __extends(Computation, _super);
        function Computation() {
            var _this = _super.call(this, void 0) || this;
            _this._fn = null;
            _this._age = -1;
            _this._state = 0;
            _this._onchange = false;
            _this._source1 = null;
            _this._source1slot = 0;
            _this._sources = null;
            _this._sourceslots = null;
            _this._ownerslot = -1;
            _this._dependents = 0;
            _this._dependentslots = null;
            _this._log = null;
            _this._owned = null;
            _this._cleanups = null;
            return _this;
        }
        Computation.prototype.get = function () {
            if (Listener !== null) {
                logComputationRead(this);
            }
            return this._value;
        };
        return Computation;
    }(Signal));
    var Data = (function (_super) {
        __extends(Data, _super);
        function Data(value) {
            var _this = _super.call(this, value) || this;
            _this._log = null;
            _this._pending = NOT_PENDING;
            return _this;
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
    }(Signal));
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
    var NOT_OWNED = new Computation();
    var RootClock = new Clock();
    var RunningClock = null;
    var Owner = null;
    var Listener = null;
    var Slot = 0;
    var Escaped = false;
    var Recycled = null;
    S.run = function (fn, seed) {
        return makeComputationNode(fn, seed, getCandidateNode());
    };
    S.track = function (fn, seed) {
        var node = (getCandidateNode());
        node._onchange = true;
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
    S.bind = function (ev, fn, onchanges) {
        var type = typeof ev === 'function' ? 0 : Array.isArray(ev) ? 1 : 2;
        return function (value) {
            if (type === 0) {
                (ev)();
            }
            else if (type === 1) {
                for (var i = 0, ln = (ev).length; i < ln; i++) {
                    (ev)[i].get();
                }
            }
            else {
                (ev).get();
            }
            if (onchanges) {
                onchanges = false;
            }
            else {
                value = S.sample(function () { return fn(value); });
            }
            return value;
        };
    };
    S.on = function (ev, fn, seed, onchanges) {
        var evFn = typeof ev === 'function';
        return S.run(function (seed) {
            var value = evFn ? (ev)() : (ev).get();
            if (onchanges) {
                onchanges = false;
            }
            else {
                seed = S.sample(function () { return fn(value, seed); });
            }
            return seed;
        }, seed);
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
            return fn();
        }
        finally {
            Listener = listener;
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
    S.escape = function (fn) {
        var escaped = Escaped;
        try {
            Escaped = true;
            return fn();
        }
        finally {
            Escaped = escaped;
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
        value = toplevel ? execToplevelComputation(fn, value) : fn(value);
        Owner = owner;
        Listener = listener;
        var recycled = recycleOrClaimNode(node, fn, value);
        if (toplevel) {
            finishToplevelComputation(owner, listener);
        }
        return recycled ? new Signal(value) : node;
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
    function logComputationRead(node) {
        if ((node._state & 6) !== 0) {
            var queue = RootClock._updates._items;
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
                if (node._value !== current) {
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
            this.enqueue(function (array) {
                var ln = value.length;
                for (var i = 0; i < ln; i++) {
                    array[i] = value[i];
                }
                array.length = ln;
            });
            return value;
        };
        List.prototype.enqueue = function (change) {
            this._queue[this._count++] = change;
            _super.prototype.set.call(this, null);
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
            this.enqueue(function (array, ln) {
                array[ln] = value;
            });
        };
        List.prototype.pop = function () {
            this.enqueue(function (array, ln) {
                if (ln) {
                    array.length--;
                }
            });
        };
        List.prototype.unshift = function (value) {
            this.enqueue(function (array, ln) {
                while (ln) {
                    array[ln--] = array[ln];
                }
                array[0] = value;
            });
        };
        List.prototype.shift = function () {
            this.enqueue(function (array) {
                array.shift();
            });
        };
        List.prototype.insert = function (index, value) {
            this.enqueue(function (array, ln) {
                index = index < 0 ? index + ln : index;
                if (index >= 0 && index <= ln) {
                    array.splice(index, 0, value);
                }
            });
        };
        List.prototype.insertRange = function (index, values) {
            this.enqueue(function (array, ln) {
                insertRange(array, ln, index, values);
            });
        };
        List.prototype.remove = function (value) {
            this.enqueue(function (array, ln) {
                for (var i = 0; i < ln; i++) {
                    if (array[i] === value) {
                        return removeAt(array, i, ln);
                    }
                }
            });
        };
        List.prototype.removeAt = function (index) {
            this.enqueue(function (array, ln) {
                removeAt(array, index, ln);
            });
        };
        List.prototype.removeRange = function (from, count) {
            this.enqueue(function (array, ln) {
                removeRange(array, ln, from, count);
            });
        };
        List.prototype.replace = function (index, value) {
            this.enqueue(function (array, ln) {
                index = index < 0 ? ln + index : index;
                if (ln && index >= 0 && index < ln) {
                    array[index] = value;
                }
            });
        };
        List.prototype.move = function (from, to) {
            this.enqueue(function (array, ln) {
                move(array, ln, from, to);
            });
        };
        List.prototype.enumerable = function () {
            return new Enumerable(this);
        };
        List.prototype.find = function (fn) {
            return this.enumerable().find(fn);
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
        Enumerable.prototype.get = function () {
            return this._source.get();
        };
        Enumerable.prototype.find = function (fn) {
            var _this = this;
            var index = null;
            return S.track(function (prev) {
                var values = _this.get();
                var mutation = [];
                if (mutation !== null && index !== null) {
                    var nochange = true;
                    for (var i = 0, ln = mutation.length; nochange && i < ln; i++) {
                        var _a = mutation[i], id = _a[0], from = _a[1];
                        nochange = index === -1 ? id < 1 : from > index;
                    }
                    if (nochange) {
                        return prev;
                    }
                }
                for (var i = 0, ln = values.length; i < ln; i++) {
                    var value = values[i];
                    if (fn(value, i)) {
                        index = i;
                        return value;
                    }
                }
                index = -1;
                return null;
            }, (null));
        };
        Enumerable.prototype.forEach = function (fn) {
            var source = this._source;
            var patcher = new ListPatcher(source, fn, this._mutation);
            S.run(function () { patcher.update(source.get()); });
        };
        Enumerable.prototype.map = function (fn) {
            var source = this._source;
            var patcher = new MapPatcher(source, fn, this._mutation);
            var data = S.run(function () {
                patcher.update(source.get());
                return patcher._mapped;
            });
            return new Enumerable(data, this._mutation);
        };
        return Enumerable;
    }());
    var Patcher = (function () {
        function Patcher(mutation) {
            var _this = this;
            this._current = [];
            this._updates = null;
            this._mutation = mutation;
            S.cleanup(function () { _this.onCleanup(); });
        }
        Patcher.prototype.update = function (u) {
            var ln = u.length;
            this._updates = u;
            this.onSetup(ln);
            var m = this._mutation ? this._mutation() : null;
            if (m !== null) {
                this.onMutation(m);
            }
            else {
                var c = this._current;
                var cStart = 0;
                var uStart = 0;
                var cEnd = c.length - 1;
                var uEnd = ln - 1;
                if (cEnd < 0) {
                    if (uEnd > 0) {
                        while (uStart <= uEnd) {
                            this.onEnter(uStart++);
                        }
                    }
                }
                else if (uStart < 0) {
                    if (cEnd > 0) {
                        while (cStart <= cEnd) {
                            this.onExit(cStart++);
                        }
                    }
                }
                else {
                    var loop = true;
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
                    }
                    else if (cStart > cEnd) {
                        while (uStart <= uEnd) {
                            this.onEnter(uStart++);
                        }
                    }
                    else {
                        this.onUnresolved(cStart, cEnd, uStart, uEnd);
                    }
                }
            }
            this.onTeardown();
            this._updates = null;
        };
        Patcher.prototype.onCleanup = function () { };
        Patcher.prototype.onSetup = function (ln) { };
        Patcher.prototype.onMutation = function (changes) { };
        Patcher.prototype.onEnter = function (index) { };
        Patcher.prototype.onMove = function (from, to, type) { };
        Patcher.prototype.onExit = function (index) { };
        Patcher.prototype.onUnresolved = function (cStart, cEnd, uStart, uEnd) { };
        Patcher.prototype.onTeardown = function () { };
        return Patcher;
    }());
    var ListPatcher = (function (_super) {
        __extends$1(ListPatcher, _super);
        function ListPatcher(source, fn, mutation) {
            var _this = _super.call(this, mutation) || this;
            _this._source = source;
            _this._factory = fn;
            _this._indexed = fn.length > 1;
            _this._disposers = [];
            _this._tempDisposers = null;
            _this._indices = [];
            _this._tempIndices = null;
            return _this;
        }
        ListPatcher.prototype.onCleanup = function () {
            for (var i = 0, ln = this._disposers.length; i < ln; i++) {
                this.onExit(i);
            }
        };
        ListPatcher.prototype.enter = function (item, index, i) {
            return this._indexed ? (this._factory)(item, (i)) : (this._factory)(item);
        };
        ListPatcher.prototype.onSetup = function (ln) {
            this._tempDisposers = new Array(ln);
            if (this._indexed) {
                this._tempIndices = new Array(ln);
            }
        };
        ListPatcher.prototype.onEnter = function (index) {
            var _this = this;
            this._tempDisposers[index] = S.root(function (dispose) {
                var item = _this._updates[index];
                if (_this._indexed) {
                    var i_1 = _this._tempIndices[index] = { data: null, index: index };
                    var node = i_1.data = S.track(function () {
                        S.escape(function () { _this._source.get(); });
                        return i_1.index;
                    });
                    _this.enter(item, index, node);
                }
                else {
                    _this.enter(item, index);
                }
                return dispose;
            });
        };
        ListPatcher.prototype.onMove = function (from, to) {
            this._tempDisposers[to] = this._disposers[from];
            if (this._indexed) {
                (this._tempIndices[to] = this._indices[from]).index = to;
            }
        };
        ListPatcher.prototype.onExit = function (index) {
            this._disposers[index]();
        };
        ListPatcher.prototype.onUnresolved = function (cStart, cEnd, uStart, uEnd) {
            var c = this._current;
            var u = this._updates;
            var preserved = {};
            var map = new Map();
            for (var i = cEnd; i >= cStart; i--) {
                var cItem = c[i];
                var ex = map.get(cItem);
                if (ex != null) {
                    if (typeof ex === 'number') {
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
            for (; uStart <= uEnd; uStart++) {
                var cItem = u[uStart];
                var ex = map.get(cItem);
                if (ex != null) {
                    var index = void 0;
                    var del = false;
                    if ((del = typeof ex === 'number')) {
                        index = ex;
                    }
                    else {
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
        };
        ListPatcher.prototype.onTeardown = function () {
            this._current = this._updates.slice();
            this._disposers = (this._tempDisposers);
            this._tempDisposers = null;
            if (this._indexed) {
                this._indices = (this._tempIndices);
                this._tempIndices = null;
            }
        };
        return ListPatcher;
    }(Patcher));
    var MapPatcher = (function (_super) {
        __extends$1(MapPatcher, _super);
        function MapPatcher(source, fn, mutation) {
            var _this = _super.call(this, source, fn, mutation) || this;
            _this._mapped = [];
            _this._tempMapped = null;
            return _this;
        }
        MapPatcher.prototype.enter = function (item, index, i) {
            return this._tempMapped[index] = _super.prototype.enter.call(this, item, index, i);
        };
        MapPatcher.prototype.onSetup = function (ln) {
            this._tempMapped = new Array(ln);
            _super.prototype.onSetup.call(this, ln);
        };
        MapPatcher.prototype.onMove = function (from, to) {
            this._tempMapped[to] = this._mapped[from];
            _super.prototype.onMove.call(this, from, to);
        };
        MapPatcher.prototype.onTeardown = function () {
            this._mapped = (this._tempMapped);
            _super.prototype.onTeardown.call(this);
        };
        return MapPatcher;
    }(ListPatcher));
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
            for (var i = index; i < ln;) {
                array[i++] = array[i];
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
    exports.List = List;
    exports.ListPatcher = ListPatcher;
    exports.MapPatcher = MapPatcher;
    exports.NOT_PENDING = NOT_PENDING;
    exports.NoValue = NoValue;
    exports.Patcher = Patcher;
    exports.S = S;
    exports.Value = Value;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
