import { capitalizeFirstLetter } from '@/features/Common/utils/utilities';
import { UserQueryObject } from '@/features/Projects/types/projects.d';
import { queryTypes } from '@/features/Query/utils/queryTypes';
/**
 * Generates the title of a query based on the query type and direction
 * @param {UserQueryObject} query - The query to generate the title for
 * @returns {string} The title of the query
 */
export const generateQueryTitle = (query: UserQueryObject): string => {
  if(query.data.title)
    return query.data.title;

  let title = 'No title available';

  if(query.data.query.type === 'pathfinder') {
    // TODO: add constraint and nodes to title when Gus adds them to the query object
    const constraint = query.data.query.constraint || null;
    const nodeOne = query.data.query.node_one_label || query.data.query.subject?.id || 'nodeOne';
    const nodeTwo = query.data.query.node_two_label || query.data.query.object?.id || 'nodeTwo';

    title = constraint
      ? `${capitalizeFirstLetter(nodeOne)} and ${capitalizeFirstLetter(nodeTwo)} — ${capitalizeFirstLetter(constraint)} Connections`
      : `${capitalizeFirstLetter(nodeOne)} and ${capitalizeFirstLetter(nodeTwo)}`;
  } else {
    const queryType = queryTypes.find(type => type.targetType === query.data.query.type);
    const label = query.data.query.node_one_label || query.data.query.curie;
    if(queryType) {
      // TODO: update curie to node label when Gus adds it to the query object
      title = `${label} — ${capitalizeFirstLetter(queryType.targetType)}s`;
    }
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
