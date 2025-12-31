export const isObject = (e: any): boolean => {
  return typeof e === "object" && e !== null && !Array.isArray(e);
}

export const isBoolean = (e: any): boolean => {
  return typeof e === "boolean";
}

export const isNumber = (e: any): boolean => {
  return typeof e === "number";
}

export const isString = (e: any): boolean => {
  return typeof e === "string";
}

export const makeIsHomogeneousArray = (isType: (e: any) => boolean): (a: any) => boolean => {
  return (a) => Array.isArray(a) && a.every(isType);
}

export const isStringArray = makeIsHomogeneousArray(isString);

export const nullable = (e: any, isType: (x: any) => boolean): boolean => {
  return e === null || isType(e);
}

export const missable = (e: any, isType: (x: any) => boolean): boolean => {
  return e === undefined || e === null || isType(e);
}
