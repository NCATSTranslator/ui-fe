export const isObject = (e: unknown): e is Record<string, unknown> => {
  return typeof e === "object" && e !== null && !Array.isArray(e);
}

export const isBoolean = (e: unknown): e is boolean => {
  return typeof e === "boolean";
}

export const isNumber = (e: unknown): e is number => {
  return typeof e === "number";
}

export const isString = (e: unknown): e is string => {
  return typeof e === "string";
}

export const makeIsHomogeneousArray = (isType: (e: unknown) => boolean): (a: unknown) => boolean => {
  return (a) => Array.isArray(a) && a.every(isType);
}

export const isStringArray = makeIsHomogeneousArray(isString);

export const makeIsOneOf = <T extends string>(values: readonly T[]): (e: unknown) => e is T => {
  return (e: unknown): e is T => typeof e === "string" && (values as readonly string[]).includes(e);
}

export const nullable = (e: unknown, isType: (x: unknown) => boolean): boolean => {
  return e === null || isType(e);
}

export const missable = (e: unknown, isType: (x: unknown) => boolean): boolean => {
  return e === undefined || e === null || isType(e);
}
