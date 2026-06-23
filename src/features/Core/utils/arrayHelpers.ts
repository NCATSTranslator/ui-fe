import { RefObject } from 'react';
import cloneDeep from 'lodash/cloneDeep';

export const removeDuplicateObjects = <T extends Record<string, unknown>,>(arr: T[], propName: keyof T): T[] => {
  const unique: T[] = [];
  const seenValues = new Set();

  arr.forEach(item => {
    if (!seenValues.has(item[propName])) {
      unique.push(item);
      seenValues.add(item[propName]);
    }
  });

  return unique;
};

export const getLastItemInArray = <T,>(arr: T[]): T | undefined => {
  return arr.at(-1);
};

export const getRandomIntInclusive = (min: number, max: number) => {
  const ceiledMin = Math.ceil(min);
  const flooredMax = Math.floor(max);
  return Math.floor(Math.random() * (flooredMax - ceiledMin + 1)) + ceiledMin;
};

export const mergeObjectArrays = <T extends { [key: string]: unknown },>(array1: T[], array2: T[], uniqueProp: keyof T): T[] => {
  const mergedMap = new Map<unknown, T>();

  [...array1, ...array2].forEach(item => {
    const uniqueValue = item[uniqueProp];
    if (!mergedMap.has(uniqueValue)) {
      mergedMap.set(uniqueValue, item);
    }
  });

  return Array.from(mergedMap.values());
};

export const combineObjectArrays = <T extends Record<string, unknown>,>(arr1: T[] | undefined | null, arr2: T[] | undefined | null, duplicateRemovalProperty?: keyof T): T[] => {
  let combinedArray: T[] = [];
  if(!!arr1)
    combinedArray = combinedArray.concat(cloneDeep(arr1));

  if(!!arr2)
    combinedArray = combinedArray.concat(cloneDeep(arr2));

  if(!!duplicateRemovalProperty)
    return removeDuplicateObjects(combinedArray, duplicateRemovalProperty);

  return combinedArray;
};

export const scrollToRef = (elementRef: RefObject<HTMLElement | null>) => {
  if (elementRef.current)
    elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  else
    console.warn("Could not scroll to element, element ref is not set");
};

export const findInSet = <T,>(set: Set<T>, predicate: (obj: T)=>boolean): T | undefined => {
  for (const item of set) {
    if(predicate(item)) {
      return item;
    }
  }
  return undefined;
};
