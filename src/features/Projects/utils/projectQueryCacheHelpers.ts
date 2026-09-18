import { QueryClient } from '@tanstack/react-query';
import { ProjectRaw, UserQueryObject } from '@/features/Projects/types/projects.d';

export const mapProjectById = (
  oldData: ProjectRaw[] | undefined,
  id: number,
  updater: (project: ProjectRaw) => ProjectRaw,
): ProjectRaw[] | undefined => {
  if (!oldData) return oldData;
  return oldData.map(project => (project.id === id ? updater(project) : project));
};

export const setProjectsDeletedFlag = (
  queryClient: QueryClient,
  projectIds: number[],
  deleted: boolean,
) => {
  const idSet = new Set(projectIds);
  queryClient.setQueryData(['userProjects'], (oldData: ProjectRaw[] | undefined) => {
    if (!oldData) return oldData;
    return oldData.map(project => (
      idSet.has(project.id) ? { ...project, deleted } : project
    ));
  });
};

export const setQueriesDeletedFlag = (
  queryClient: QueryClient,
  querySids: number[],
  deleted: boolean,
) => {
  const sidSet = new Set(querySids);
  queryClient.setQueryData(['userQueries'], (oldData: UserQueryObject[] | undefined) => {
    if (!oldData) return oldData;
    return oldData.map(query => (
      sidSet.has(query.sid)
        ? { ...query, data: { ...query.data, deleted } }
        : query
    ));
  });
};

export const getProjectPkDiffAction = (
  previousPks: string[],
  nextPks: string[] | undefined,
  queries: UserQueryObject[],
): { action?: 'add' | 'remove'; titles?: string } => {
  if (!nextPks) return {};
  const newlyIncluded = nextPks.filter(qid => !previousPks.includes(qid));
  const newlyRemoved = previousPks.filter(qid => !nextPks.includes(qid));
  const titleFor = (qid: string) => queries.find(q => q.data.qid === qid)?.data.title || '';

  if (newlyIncluded.length > 0) {
    return { action: 'add', titles: newlyIncluded.map(titleFor).join(', ') };
  }
  if (newlyRemoved.length > 0) {
    return { action: 'remove', titles: newlyRemoved.map(titleFor).join(', ') };
  }
  return {};
};

export const optimisticUpdateProject = (
  queryClient: QueryClient,
  projectId: number,
  title: string,
  pks: string[],
) => {
  queryClient.setQueryData(['userProjects'], (oldData: ProjectRaw[]) =>
    mapProjectById(oldData, projectId, project => ({
      ...project,
      data: { title, pks },
    })),
  );
};

export const revertProjectUpdate = (
  queryClient: QueryClient,
  project: ProjectRaw,
) => {
  queryClient.setQueryData(['userProjects'], (oldData: ProjectRaw[]) =>
    mapProjectById(oldData, project.id, () => project),
  );
};
