/**
 * Branded (nominal) types. They compile to plain strings but cannot be mixed
 * up with each other or with raw strings, which prevents a whole class of
 * "passed the wrong id" bugs at the type level.
 */
declare const brand: unique symbol;

export type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand };

export type EntityId = Brand<string, 'EntityId'>;
export type SceneId = Brand<string, 'SceneId'>;
export type QuestId = Brand<string, 'QuestId'>;
export type ObjectiveId = Brand<string, 'ObjectiveId'>;
export type AnomalyId = Brand<string, 'AnomalyId'>;
export type SaveSlotId = Brand<string, 'SaveSlotId'>;
export type AudioTrackId = Brand<string, 'AudioTrackId'>;

/** Cast a raw string into a branded id. Use at trust boundaries only. */
export const asBrand = <T extends Brand<string, string>>(value: string): T => value as T;
