/** Numeric helpers shared across gameplay and rendering code. */

/** Restrict `value` to the inclusive `[min, max]` range. */
export const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

/** Linear interpolation between `from` and `to` by factor `t` (0..1). */
export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** Map `value` from one range to another. */
export const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => {
  if (inMax === inMin) return outMin;
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
};

/** Inclusive random float in `[min, max)`. */
export const randomRange = (min: number, max: number): number => min + Math.random() * (max - min);

/** Inclusive random integer in `[min, max]`. */
export const randomInt = (min: number, max: number): number =>
  Math.floor(randomRange(min, max + 1));

/** Pick a random element from a non-empty array, or `undefined` when empty. */
export const pickRandom = <T>(items: readonly T[]): T | undefined =>
  items.length === 0 ? undefined : items[Math.floor(Math.random() * items.length)];

/** True roughly `probability` (0..1) of the time. */
export const chance = (probability: number): boolean => Math.random() < probability;
