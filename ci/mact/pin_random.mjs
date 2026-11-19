// ci/mact/pin_random.mjs — UNIT mact · a preload (node --import): Math.random is PINNED to one value, so every random bucket an id
// mint draws is the SAME bucket. A mint that is unique only by chance mints equal ids under it; a mint unique by construction does not.
Math.random = () => 0.5;
