import { toast } from "react-toastify";

// Projects
export const projectRestoredToast = () => {
  return toast.success('Project restored');
};

export const projectDeletedToast = () => {
  return toast.error('Project deleted');
};

export const queryAddedToProjectToast = (queryTitle: string, projectTitle: string) => {
  return toast.success(`${queryTitle} Added to ${projectTitle}`);
};

export const queryAlreadyInProjectToast = () => {
  return toast.error('Query already in project');
};

export const projectCreatedToast = () => {
  return toast.success('Project created');
};

export const projectUpdatedToast = (projectTitle?: string, queryTitle?: string, action?: 'add' | 'remove') => {
  if(projectTitle && queryTitle && action === 'add')
    return toast.success(`${queryTitle} added to ${projectTitle}`);

  if(projectTitle && action === 'remove')
    return toast.success(`${queryTitle} removed from ${projectTitle}`);

  if(projectTitle)
    return toast.success(`${projectTitle} updated`);

  if(queryTitle && action === 'add')
    return toast.success(`${queryTitle} added to project`);

  if(queryTitle && action === 'remove')
    return toast.success(`${queryTitle} removed from project`);

  return toast.success('Project updated');
};

// Queries
export const queryRestoredToast = () => {
  return toast.success('Query restored');
};

export const queryDeletedToast = () => {
  return toast.error('Query deleted');
};

export const queryCreatedToast = () => {
  return toast.success('Query created');
};

export const queryUpdatedToast = () => {
  return toast.success('Query updated');
};

// Shared
export const errorToast = (message: string) => {
  return toast.error(message);
};

export const unableToReachLinkToast = () => {
  return toast.error('Unable to reach link');
};