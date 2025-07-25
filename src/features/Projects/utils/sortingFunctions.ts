import { Project, QueryStatusObject, SortField, SortDirection } from '@/features/Projects/types/projects.d';

/**
 * Sorts projects based on the specified field and direction
 * @param {Project[]} projects - The projects to sort
 * @param {SortField} sortField - The field to sort by
 * @param {SortDirection} sortDirection - The direction to sort in
 * @returns {Project[]} The sorted projects
 */
export const sortProjects = (projects: Project[], sortField: SortField, sortDirection: SortDirection): Project[] => {
  return [...projects].sort((a, b) => {
    let aValue: string | Date;
    let bValue: string | Date;

    switch (sortField) {
      case 'name':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'lastSeen':
        aValue = a.time_updated;
        bValue = b.time_updated;
        break;
      case 'dateAdded':
        aValue = a.time_created;
        bValue = b.time_created;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Sorts queries based on the specified field and direction
 * @param {QueryStatusObject[]} queries - The queries to sort
 * @param {SortField} sortField - The field to sort by
 * @param {SortDirection} sortDirection - The direction to sort in
 * @returns {QueryStatusObject[]} The sorted queries
*/
export const sortQueries = (queries: QueryStatusObject[], sortField: SortField, sortDirection: SortDirection): QueryStatusObject[] => {
  return [...queries].sort((a, b) => {
    let aValue: string | Date;
    let bValue: string | Date;

    switch (sortField) {
      case 'name':
        aValue = a.data.title.toLowerCase();
        bValue = b.data.title.toLowerCase();
        break;
      case 'lastSeen':
        aValue = a.data.time_updated;
        bValue = b.data.time_updated;
        break;
      case 'dateAdded':
        aValue = a.data.time_created;
        bValue = b.data.time_created;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
};
