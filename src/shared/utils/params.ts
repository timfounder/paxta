import { ZERO_VEC3, type Vec3 } from '@shared/types/spatial';

/**
 * Typed accessors for the `{ type, params }` data shape shared by the data-driven
 * frameworks (missions, and reusable by anomaly/night). Params are plain
 * serialisable values; these read them without `any` and with a fallback.
 */
export type ParamValue = string | number | boolean | Vec3;
export type Params = Readonly<Record<string, ParamValue>>;

export const numberParam = (params: Params, key: string, fallback: number): number => {
  const value = params[key];
  return typeof value === 'number' ? value : fallback;
};

export const stringParam = (params: Params, key: string, fallback = ''): string => {
  const value = params[key];
  return typeof value === 'string' ? value : fallback;
};

export const boolParam = (params: Params, key: string, fallback = false): boolean => {
  const value = params[key];
  return typeof value === 'boolean' ? value : fallback;
};

export const vec3Param = (params: Params, key: string, fallback: Vec3 = ZERO_VEC3): Vec3 => {
  const value = params[key];
  return typeof value === 'object' && value !== null ? value : fallback;
};
