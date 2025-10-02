import { UserQueryObject } from '@/features/Projects/types/projects.d';
import { generateQueryTitle, findAllCuriesInTitle } from '@/features/Projects/utils/utilities';

/**
 * Generates a base title for a query, using existing title or generating one
 * @param {UserQueryObject} query - The query object
 * @returns {string} The base title
 */
export const getBaseTitle = (query: UserQueryObject): string => {
  return query.data.title || generateQueryTitle(query);
};

/**
 * Extracts all unique curies from an array of titles
 * @param {string[]} titles - Array of title strings
 * @returns {string[]} Array of unique curie strings
 */
export const extractAllCuriesFromTitles = (titles: string[]): string[] => {
  const curieSet = new Set<string>();
  titles.forEach(title => {
    const titleCuries = findAllCuriesInTitle(title);
    titleCuries.forEach(curie => curieSet.add(curie));
  });
  return Array.from(curieSet);
};

/**
 * Replaces curies in a title with their resolved names
 * @param {string} title - The original title
 * @param {Record<string, string>} resolvedNames - Mapping of curie to resolved name
 * @returns {string} The title with curies replaced by resolved names
 */
export const replaceCuriesInTitle = (
  title: string, 
  resolvedNames: Record<string, string>
): string => {
  const titleCuries = findAllCuriesInTitle(title);
  
  if (titleCuries.length === 0 || Object.keys(resolvedNames).length === 0) {
    return title;
  }
  
  let newTitle = title;
  
  // Replace each curie with its resolved name
  titleCuries.forEach(curie => {
    const resolvedName = resolvedNames[curie];
    if (resolvedName && resolvedName !== curie) {
      newTitle = newTitle.replace(curie, resolvedName);
    }
  });
  
  return newTitle;
};

/**
 * Determines if a title has been updated (different from original)
 * @param {string} originalTitle - The original title
 * @param {string} updatedTitle - The updated title
 * @returns {boolean} True if the title has been updated
 */
export const hasTitleBeenUpdated = (originalTitle: string, updatedTitle: string): boolean => {
  return updatedTitle !== originalTitle;
};

/**
 * Creates an updated query object with a new title
 * @param {UserQueryObject} query - The original query object
 * @param {string} newTitle - The new title to set
 * @returns {UserQueryObject} The updated query object
 */
export const createUpdatedQueryWithTitle = (
  query: UserQueryObject, 
  newTitle: string
): UserQueryObject => {
  return {
    ...query,
    data: {
      ...query.data,
      title: newTitle
    }
  };
};
