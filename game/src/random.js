// Seeded RNG (mulberry32) so staged screenshots and replays are deterministic:
// the same seed always grows the same farmyard.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one element of an array with the seeded RNG.
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// A value in [min, max) from the seeded RNG.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}
