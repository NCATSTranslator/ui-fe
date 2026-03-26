import { capitalizeAllWords, capitalizeFirstLetter, formatBiolinkTypeString } from '@/features/Common/utils/utilities';
import { UserQueryObject } from '@/features/Projects/types/projects.d';
import { queryTypes } from '@/features/Query/utils/queryTypes';
/**
 * Generates the title of a query based on the query object
 * @param {UserQueryObject} query - The query to generate the title for
 * @returns {string} The title of the query
 */
export const generateQueryTitleFromQueryObject = (query: UserQueryObject): string => {
  if(query.data.title)
    return query.data.title;

  const queryType = query.data.query.type;
  const nodeOneLabel = query.data.query.node_one_label || query.data.query.subject?.id || '';
  const nodeTwoLabel = query.data.query.node_two_label || query.data.query.object?.id || '';
  const constraint = query.data.query.constraint || null;

  return generateQueryTitle(queryType, nodeOneLabel, nodeTwoLabel, constraint);
}

/**
 * Generates the title of a query based on the query type and direction
 * @param {string} queryTypeId - The type of the query
 * @param {string} nodeOneLabel - The label of the first node
 * @param {string} nodeTwoLabel - The label of the second node
 * @param {string | null} constraint - The constraint of the query
 * @returns {string} The title of the query
 */
export const generateQueryTitle = (queryTypeId: string | null, nodeOneLabel: string, nodeTwoLabel: string, constraint: string | null): string => {
  let title = 'No title available';

  if(queryTypeId === 'p' || queryTypeId === 'pathfinder') {
    title = constraint
      ? `${capitalizeAllWords(nodeOneLabel)} and ${capitalizeAllWords(nodeTwoLabel)} — ${formatBiolinkTypeString(constraint)} Connections`
      : `${capitalizeAllWords(nodeOneLabel)} and ${capitalizeAllWords(nodeTwoLabel)}`;
  } else {
    const queryTypeObject = queryTypes.find(type => type.targetType === queryTypeId || type.id === parseInt(queryTypeId || '0'));
    if(queryTypeObject)
      title = `${nodeOneLabel} — ${capitalizeFirstLetter(queryTypeObject.targetType)}s`;
    else
      console.warn(`Query type object not found for query type: ${queryTypeId}`);
  }

  return title;
}

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
 * Find all curies in the query title
 * @param {string} title - The title to check
 * @returns {string[]} Array of all curies found in the title
 */
export const findAllCuriesInTitle = (title: string): string[] => {
  const curieRegex = /\b[A-Za-z][A-Za-z0-9_]*:[A-Za-z0-9_-]+\b/g;
  const matches = title.match(curieRegex);
  return matches || [];
}

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
