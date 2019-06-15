var S = _S_.S;
var Data = _S_.Data;

var now = browserNow;
var COUNT = 1e5;

var Runs = 5;


var createAvg = 0;
var updateAvg = 0;

main();

function main() {
    for (var i = 0; i < Runs; i++) {
        var createTotal = 0;
        createTotal += bench(createDataSignals, COUNT, COUNT);
        createTotal += bench(createComputations0to1, COUNT, 0);
        createTotal += bench(createComputations1to1, COUNT, COUNT);
        createTotal += bench(createComputations2to1, COUNT / 2, COUNT);
        createTotal += bench(createComputations4to1, COUNT / 4, COUNT);
        createTotal += bench(createComputations1000to1, COUNT / 1000, COUNT);
        //total += bench1(createComputations8, COUNT, 8 * COUNT);
        createTotal += bench(createComputations1to2, COUNT, COUNT / 2);
        createTotal += bench(createComputations1to4, COUNT, COUNT / 4);
        createTotal += bench(createComputations1to8, COUNT, COUNT / 8);
        createTotal += bench(createComputations1to1000, COUNT, COUNT / 1000);
        createAvg += createTotal;
        //console.log(`create total: ${createTotal.toFixed(0)}`);
        //console.log('---');
        var updateTotal = 0;
        updateTotal += bench(updateComputations1to1, COUNT * 4, 1);
        updateTotal += bench(updateComputations2to1, COUNT * 2, 2);
        updateTotal += bench(updateComputations4to1, COUNT, 4);
        updateTotal += bench(updateComputations1000to1, COUNT / 100, 1000);
        updateTotal += bench(updateComputations1to2, COUNT * 4, 1);
        updateTotal += bench(updateComputations1to4, COUNT * 4, 1);
        updateTotal += bench(updateComputations1to1000, COUNT * 4, 1);
        updateAvg += updateTotal;
        //console.log(`update total: ${updateTotal.toFixed(0)}`);
        //console.log(`total: ${(createTotal + updateTotal).toFixed(0)}`);
    }
    createAvg = createAvg / Runs;
    updateAvg = updateAvg / Runs;
    console.log(`create avg: ${createAvg.toFixed(0)}`);
    console.log('---');
    console.log(`update avg: ${updateAvg.toFixed(0)}`);
    console.log(`avg: ${(createAvg + updateAvg).toFixed(0)}`);
}


function bench(fn, count, scount) {
    var time = run(fn, count, scount);
    console.log(`${fn.name}: ${time.toFixed(0)}`);
    return time;
}

function run(fn, n, scount) {
    // prep n * arity sources
    var start,
        end;

    S.root(function () {
        // run 3 times to warm up 
        var sources = createDataSignals(scount, []);
        fn(n / 100, sources);
        sources = createDataSignals(scount, []);
        fn(n / 100, sources);
        sources = createDataSignals(scount, []);
        fn(n / 100, sources);
        sources = createDataSignals(scount, []);
        for (var i = 0; i < scount; i++) {
            sources[i].get();
            sources[i].get();
            //%OptimizeFunctionOnNextCall(sources[i]);
            sources[i].get();
        }

        start = now();

        fn(n, sources);

        // end GC clean
        sources = null;

        end = now();
    });

    return end - start;
}

function createDataSignals(n, sources) {
    for (var i = 0; i < n; i++) {
        sources[i] = new Data(i);
    }
    return sources;
}

function createComputations0to1(n, sources) {
    for (var i = 0; i < n; i++) {
        createComputation0(i);
    }
}

function createComputations1to1000(n, sources) {
    for (var i = 0; i < n / 1000; i++) {
        for (var j = 0; j < 1000; j++) {
            createComputation1(sources[i]);
        }
        //sources[i] = null;
    }
}

function createComputations1to8(n, sources) {
    for (var i = 0; i < n / 8; i++) {
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        //sources[i] = null;
    }
}

function createComputations1to4(n, sources) {
    for (var i = 0; i < n / 4; i++) {
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        //sources[i] = null;
    }
}

function createComputations1to2(n, sources) {
    for (var i = 0; i < n / 2; i++) {
        createComputation1(sources[i]);
        createComputation1(sources[i]);
        //sources[i] = null;
    }
}

function createComputations1to1(n, sources) {
    for (var i = 0; i < n; i++) {
        createComputation1(sources[i]);
        //sources[i] = null;
    }
}

function createComputations2to1(n, sources) {
    for (var i = 0; i < n; i++) {
        createComputation2(
            sources[i * 2],
            sources[i * 2 + 1]
        );
        //sources[i * 2] = null;
        //sources[i * 2 + 1] = null;
    }
}

function createComputations4to1(n, sources) {
    for (var i = 0; i < n; i++) {
        createComputation4(
            sources[i * 4],
            sources[i * 4 + 1],
            sources[i * 4 + 2],
            sources[i * 4 + 3]
        );
        //sources[i * 4] = null;
        //sources[i * 4 + 1] = null;
        //sources[i * 4 + 2] = null;
        //sources[i * 4 + 3] = null;
    }
}

function createComputations8(n, sources) {
    for (var i = 0; i < n; i++) {
        createComputation8(
            sources[i * 8],
            sources[i * 8 + 1],
            sources[i * 8 + 2],
            sources[i * 8 + 3],
            sources[i * 8 + 4],
            sources[i * 8 + 5],
            sources[i * 8 + 6],
            sources[i * 8 + 7]
        );
        sources[i * 8] = null;
        sources[i * 8 + 1] = null;
        sources[i * 8 + 2] = null;
        sources[i * 8 + 3] = null;
        sources[i * 8 + 4] = null;
        sources[i * 8 + 5] = null;
        sources[i * 8 + 6] = null;
        sources[i * 8 + 7] = null;
    }
}

// only create n / 100 computations, as otherwise takes too long
function createComputations1000to1(n, sources) {
    for (var i = 0; i < n; i++) {
        createComputation1000(sources, i * 1000);
    }
}

function createComputation0(i) {
    S.track(function () { return i; });
}

function createComputation1(s1) {
    S.track(function () { return s1.get(); });
}

function createComputation2(s1, s2) {
    S.track(function () { return s1.get() + s2.get(); });
}

function createComputation4(s1, s2, s3, s4) {
    S.track(function () { return s1.get() + s2.get() + s3.get() + s4.get(); });
}

function createComputation8(s1, s2, s3, s4, s5, s6, s7, s8) {
    S.track(function () { return s1.get() + s2.get() + s3.get() + s4.get() + s5.get() + s6.get() + s7.get() + s8.get(); });
}

function createComputation1000(ss, offset) {
    S.track(function () {
        var sum = 0;
        for (var i = 0; i < 1000; i++) {
            sum += ss[offset + i].get();
        }
        return sum;
    });
}

function updateComputations1to1(n, sources) {
    var s1 = sources[0],
        c = S.track(function () { return s1.get(); });
    for (var i = 0; i < n; i++) {
        s1.set(i);
    }
}

function updateComputations2to1(n, sources) {
    var s1 = sources[0],
        s2 = sources[1],
        c = S.track(function () { return s1.get() + s2.get(); });
    for (var i = 0; i < n; i++) {
        s1.set(i);
    }
}

function updateComputations4to1(n, sources) {
    var s1 = sources[0],
        s2 = sources[1],
        s3 = sources[2],
        s4 = sources[3],
        c = S.track(function () { return s1.get() + s2.get() + s3.get() + s4.get(); });
    for (var i = 0; i < n; i++) {
        s1.set(i);
    }
}

function updateComputations1000to1(n, sources) {
    var s1 = sources[0],
        c = S.track(function () {
            var sum = 0;
            for (var i = 0; i < 1000; i++) {
                sum += sources[i].get();
            }
            return sum;
        });
    for (var i = 0; i < n; i++) {
        s1.set(i);
    }
}

function updateComputations1to2(n, sources) {
    var s1 = sources[0],
        c1 = S.track(function () { return s1.get(); }),
        c2 = S.track(function () { return s1.get(); });
    for (var i = 0; i < n / 2; i++) {
        s1.set(i);
    }
}

function updateComputations1to4(n, sources) {
    var s1 = sources[0],
        c1 = S.track(function () { return s1.get(); }),
        c2 = S.track(function () { return s1.get(); }),
        c3 = S.track(function () { return s1.get(); }),
        c4 = S.track(function () { return s1.get(); });
    for (var i = 0; i < n / 4; i++) {
        s1.set(i);
    }
}

function updateComputations1to1000(n, sources) {
    var s1 = sources[0];
    for (var i = 0; i < 1000; i++) {
        S.track(function () { return s1.get(); });
    }
    for (var i = 0; i < n / 1000; i++) {
        s1.set(i);
    }
}

function browserNow() {
    return performance.now();
}