import { UserQueryObject, SortField, SortDirection, Project, ProjectRaw, SortValue } from '@/features/Projects/types/projects.d';

/**
 * Sorts projects based on the specified field and direction
 * @param {Project[]} projects - The projects to sort
 * @param {SortField} sortField - The field to sort by
 * @param {SortDirection} sortDirection - The direction to sort in
 * @returns {Project[]} The sorted projects
 */
export const sortProjects = (projects: Project[], sortField: SortField, sortDirection: SortDirection): Project[] => {
  return [...projects].sort((a, b) => {
    let aValue: SortValue;
    let bValue: SortValue;

    switch (sortField) {
      case 'name':
        aValue = a.data.title.toLowerCase();
        bValue = b.data.title.toLowerCase();
        break;
      case 'created':
        aValue = a.time_created;
        bValue = b.time_created;
        break;
      case 'lastSeen':
        aValue = a.time_updated;
        bValue = b.time_updated;
        break;
      case 'queries':
        aValue = a.data.pks.length;
        bValue = b.data.pks.length;
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
    if (queries && project.data.pks.some(pk => queries.find(q => (q.data.qid === pk && !q.data.deleted))?.data.title?.toLowerCase().includes(formattedSearchTerm))) {
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
  return sortProjects(filteredProjects, sortField, sortDirection);
};

/**
 * Sorts queries based on the specified field and direction
 * @param {UserQueryObject[]} queries - The queries to sort
 * @param {SortField} sortField - The field to sort by
 * @param {SortDirection} sortDirection - The direction to sort in
 * @returns {UserQueryObject[]} The sorted queries
*/
export const sortQueries = (queries: UserQueryObject[], sortField: SortField, sortDirection: SortDirection): UserQueryObject[] => {
  const getSortValue = (query: UserQueryObject): SortValue => {
    switch (sortField) {
      case 'name': return query.data.title?.toLowerCase() || '';
      case 'created': return query.data.time_created;
      case 'lastSeen': return query.data.time_updated;
      case 'queries': return 0;
      case 'bookmarks': return query.data.bookmark_ids.length;
      case 'notes': return query.data.note_count;
      case 'queryType': return query.data.query.type;
      case 'status': return query.status;
      default: return 0;
    }
  };

  return [...queries].sort((a, b) => {
    const aValue = getSortValue(a);
    const bValue = getSortValue(b);
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