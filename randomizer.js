// /Users/ryder/code/crystals_of_the_canopy/randomizer.js
// Seedable random generator and helpers for game logic

class Randomizer {
    constructor(seed = Date.now()) {
        this._seed = this._normalizeSeed(seed);
        this._rnd = this._makeRng(this._seed);
    }

    _normalizeSeed(s) {
        if (typeof s === 'string') {
            // simple string -> number hash
            let h = 2166136261;
            for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
            return h >>> 0;
        }
        return Number.isFinite(s) ? Math.floor(s) >>> 0 : Date.now() >>> 0;
    }

    _makeRng(a) {
        // mulberry32
        let seed = a >>> 0;
        return () => {
            seed = (seed + 0x6D2B79F5) >>> 0;
            let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    reseed(seed) {
        this._seed = this._normalizeSeed(seed);
        this._rnd = this._makeRng(this._seed);
        return this;
    }

    seed() {
        return this._seed;
    }

    // Float in [0, 1)
    random() {
        return this._rnd();
    }

    // Integer in [min, max] inclusive
    randInt(min, max) {
        min = Math.floor(min);
        max = Math.floor(max);
        if (max < min) [min, max] = [max, min];
        const range = max - min + 1;
        return Math.floor(this.random() * range) + min;
    }

    // Float in [min, max)
    randFloat(min = 0, max = 1) {
        return this.random() * (max - min) + min;
    }

    // Choose one element
    choice(array) {
        if (!array || array.length === 0) return undefined;
        return array[this.randInt(0, array.length - 1)];
    }

    // Fisher-Yates shuffle (returns new array)
    shuffle(array) {
        const a = array.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = this.randInt(0, i);
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // Sample k unique elements (k <= array.length)
    sample(array, k = 1) {
        if (k <= 0) return [];
        if (k >= array.length) return this.shuffle(array);
        const a = array.slice();
        const res = [];
        for (let i = 0; i < k; i++) {
            const j = this.randInt(i, a.length - 1);
            [a[i], a[j]] = [a[j], a[i]];
            res.push(a[i]);
        }
        return res;
    }

    // Generate 'count' unique integers in [min, max] (order shuffled)
    uniqueInts(count, min, max) {
        const total = max - min + 1;
        if (count <= 0) return [];
        if (count >= total) {
            const all = [];
            for (let v = min; v <= max; v++) all.push(v);
            return this.shuffle(all);
        }
        // reservoir-like by shuffling portion
        const pool = [];
        for (let v = min; v <= max; v++) pool.push(v);
        return this.sample(pool, count);
    }

    // Roll 'count' dice with 'sides' and return { rolls: [...], total }
    rollDice(sides = 6, count = 1) {
        const rolls = [];
        let total = 0;
        for (let i = 0; i < count; i++) {
            const r = this.randInt(1, Math.max(1, sides));
            rolls.push(r);
            total += r;
        }
        return { rolls, total };
    }

    // Weighted random choice: items array and parallel weights array
    weightedChoice(items, weights) {
        if (!items || items.length === 0) return undefined;
        if (!weights || weights.length !== items.length) {
            // fallback to uniform
            return this.choice(items);
        }
        let sum = 0;
        for (let w of weights) sum += Math.max(0, +w || 0);
        if (sum <= 0) return this.choice(items);
        let r = this.random() * sum;
        for (let i = 0; i < items.length; i++) {
            r -= Math.max(0, +weights[i] || 0);
            if (r <= 0) return items[i];
        }
        return items[items.length - 1];
    }
}

// Default RNG instance for quick use
const defaultRng = new Randomizer();

// Convenience wrappers using defaultRng
function setSeed(seed) { return defaultRng.reseed(seed); }
function random() { return defaultRng.random(); }
function randInt(min, max) { return defaultRng.randInt(min, max); }
function randFloat(min, max) { return defaultRng.randFloat(min, max); }
function choice(a) { return defaultRng.choice(a); }
function shuffle(a) { return defaultRng.shuffle(a); }
function sample(a, k) { return defaultRng.sample(a, k); }
function uniqueInts(count, min, max) { return defaultRng.uniqueInts(count, min, max); }
function rollDice(sides, count) { return defaultRng.rollDice(sides, count); }
function weightedChoice(items, weights) { return defaultRng.weightedChoice(items, weights); }

export {
    Randomizer,
    defaultRng,
    setSeed,
    random,
    randInt,
    randFloat,
    choice,
    shuffle,
    sample,
    uniqueInts,
    rollDice,
    weightedChoice
};