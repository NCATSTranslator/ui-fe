import { toast } from "react-toastify";
import AppToast from "@/features/Core/components/AppToast/AppToast";

// Projects
export const projectRestoredToast = () => {
  return toast(AppToast, { data: { topText: 'Project restored' } });
};

export const projectDeletedToast = () => {
  return toast(AppToast, { data: { topText: 'Project deleted' } });
};

export const queryAddedToProjectToast = (queryTitle: string, projectTitle: string) => {
  return toast(AppToast, { data: { topText: `${queryTitle} Added to ${projectTitle}` } });
};

export const queryAlreadyInProjectToast = () => {
  return toast(AppToast, { data: { topText: 'Query already in project' } });
};

export const projectCreatedToast = () => {
  return toast(AppToast, { data: { topText: 'Project created' } });
};

export const projectUpdatedToast = (projectTitle?: string, queryTitle?: string, action?: 'add' | 'remove') => {
  if(projectTitle && queryTitle && action === 'add')
    return toast(AppToast, { data: { topText: `${queryTitle} added to ${projectTitle}` } });

  if(projectTitle && action === 'remove')
    return toast(AppToast, { data: { topText: `${queryTitle} removed from ${projectTitle}` } });

  if(projectTitle)
    return toast(AppToast, { data: { topText: `${projectTitle} updated` } });

  if(queryTitle && action === 'add')
    return toast(AppToast, { data: { topText: `${queryTitle} added to project` } });

  if(queryTitle && action === 'remove')
    return toast(AppToast, { data: { topText: `${queryTitle} removed from project` } });

  return toast(AppToast, { data: { topText: 'Project updated' } });
};

// Queries
export const queryRestoredToast = () => {
  return toast(AppToast, { data: { topText: 'Query restored' } });
};

export const queryDeletedToast = () => {
  return toast(AppToast, { data: { topText: 'Query deleted' } } );
};

export const queryCreatedToast = () => {
  return toast(AppToast, { data: { topText: 'Query created' } });
};

export const queryUpdatedToast = () => {
  return toast(AppToast, { data: { topText: 'Query updated' } });
};

// Shared
export const errorToast = (message: string) => {
  return toast.error(AppToast, { data: { topText: message } });
};

export const unableToReachLinkToast = () => {
  return toast.error(AppToast, { data: { topText: 'Unable to reach link' } });
};