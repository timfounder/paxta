/** A teardown callback returned by subscription APIs across the codebase. */
export type Unsubscribe = () => void;

/** A function returning the current epoch time in milliseconds; injectable. */
export type Clock = () => number;
