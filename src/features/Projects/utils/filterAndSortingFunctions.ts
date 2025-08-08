import { UserQueryObject, SortField, SortDirection, Project, ProjectRaw } from '@/features/Projects/types/projects.d';

/**
 * Sorts projects based on the specified field and direction
 * @param {Project[]} projects - The projects to sort
 * @param {SortField} sortField - The field to sort by
 * @param {SortDirection} sortDirection - The direction to sort in
 * @returns {Project[]} The sorted projects
 */
export const sortProjects = (projects: Project[], sortField: SortField, sortDirection: SortDirection): Project[] => {
  return [...projects].sort((a, b) => {
    let aValue: string | Date | number;
    let bValue: string | Date | number;

    switch (sortField) {
      case 'name':
        aValue = a.data.title.toLowerCase();
        bValue = b.data.title.toLowerCase();
        break;
      case 'lastSeen':
        aValue = a.time_updated;
        bValue = b.time_updated;
        break;
      case 'dateAdded':
        aValue = a.time_created;
        bValue = b.time_created;
        break;
      case 'bookmarks':
        aValue = a.bookmark_count;
        bValue = b.bookmark_count;
        break;
      case 'notes':
        aValue = a.note_count;
        bValue = b.note_count;
        break;
      case 'status':
        aValue = 0; // Projects don't have status in the current data structure
        bValue = 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
};

export const filterProjects = (projects: Project[] | ProjectRaw[], searchTerm: string, queries?: UserQueryObject[]): Project[] | ProjectRaw[] => {
  const formattedSearchTerm = searchTerm.toLowerCase();
  const filteredProjects = projects.filter(project => {
    let foundMatch = false;
    // check if the project title matches the search term
    if (project.data.title.toLowerCase().includes(formattedSearchTerm)) {
      foundMatch = true;
    }
    // check if any of the project's queries match the search term
    if (queries && project.data.pks.some(pk => queries.find(q => q.data.qid === pk)?.data.title?.toLowerCase().includes(formattedSearchTerm))) {
      foundMatch = true;
    }
    return foundMatch;
  });
  return filteredProjects;
}

/**
 * Filters and sorts projects based on the specified search terms
 * @param {Project[]} projects - The projects to format
 * @param {UserQueryObject[]} queries - The queries to filter by
 * @param {SortField} sortField - The field to sort by
 * @param {SortDirection} sortDirection - The direction to sort in
 * @param {string} searchTerm - The search term to filter by
 * @returns {Project[]} The formatted projects
 */
export const filterAndSortProjects = (projects: Project[], queries: UserQueryObject[], sortField: SortField, sortDirection: SortDirection, searchTerm: string): Project[] => {
  const filteredProjects: Project[] = filterProjects(projects, searchTerm, queries) as Project[];
  const sortedProjects = sortProjects(filteredProjects, sortField, sortDirection);
  // make sure unassigned is always at bottom (has id of -1)
  const unassignedProject = sortedProjects.find(project => project.id === -1);
  if (unassignedProject && sortedProjects.length > 1) {
    sortedProjects.splice(sortedProjects.indexOf(unassignedProject), 1);
    sortedProjects.push(unassignedProject);
  }
  return sortedProjects;
};

/**
 * Sorts queries based on the specified field and direction
 * @param {UserQueryObject[]} queries - The queries to sort
 * @param {SortField} sortField - The field to sort by
 * @param {SortDirection} sortDirection - The direction to sort in
 * @returns {UserQueryObject[]} The sorted queries
*/
export const sortQueries = (queries: UserQueryObject[], sortField: SortField, sortDirection: SortDirection): UserQueryObject[] => {
  return [...queries].sort((a, b) => {
    let aValue: string | Date | number;
    let bValue: string | Date | number;

    switch (sortField) {
      case 'name':
        aValue = a.data.title?.toLowerCase() || '';
        bValue = b.data.title?.toLowerCase() || '';
        break;
      case 'lastSeen':
        aValue = a.data.time_updated;
        bValue = b.data.time_updated;
        break;
      case 'dateAdded':
        aValue = a.data.time_created;
        bValue = b.data.time_created;
        break;
      case 'bookmarks':
        aValue = a.data.bookmark_ids.length;
        bValue = b.data.bookmark_ids.length;
        break;
      case 'notes':
        aValue = a.data.note_count;
        bValue = b.data.note_count;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
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
 * Filters and sorts queries based on the specified search terms
 * @param {UserQueryObject[]} queries - The queries to format
 * @param {string} searchTerm - The search term to filter by
 * @returns {UserQueryObject[]} The formatted queries
 */
export const filterAndSortQueries = (queries: UserQueryObject[], sortField: SortField, sortDirection: SortDirection, searchTerm: string): UserQueryObject[] => {
  const filteredQueries = queries.filter(query => query.data.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
  return sortQueries(filteredQueries, sortField, sortDirection);
};