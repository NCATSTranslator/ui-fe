import { Location as RouterLocation } from 'react-router-dom';

export const getDataFromQueryVar = (varID: string, decodedParams: string) => {
  const dataValue = new URLSearchParams(decodedParams).get(varID);
  const valueToReturn = (dataValue) ? dataValue : null;
  return valueToReturn;
};

export const getFullPathname = (location: RouterLocation | Location): string => {
  let fullPath = location.pathname;
  if(!!location.search)
    fullPath += location.search;

  if(!!location.hash)
    fullPath += location.hash;

  return fullPath;
};
