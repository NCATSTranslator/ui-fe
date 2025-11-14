import { toast } from "react-toastify";
import AppToast from "@/features/Core/components/AppToast/AppToast";
import { getFormattedLoginURL } from "@/features/UserAuth/utils/userApi";

// Projects
export const projectRestoredToast = () => {
  return toast(AppToast, { data: { topText: 'Project restored' } });
};
export const projectDeletedToast = () => {
  return toast(AppToast, { data: { topText: 'Project deleted' } });
};
export const queryAddedToProjectToast = (queryTitle: string, projectTitle: string) => {
  return toast(AppToast, { data: { topText: `${queryTitle}`, bottomText: `Added to ${projectTitle}` } });
};
export const queryAlreadyInProjectToast = (queryTitle: string, projectTitle: string) => {
  return toast.error(AppToast, { data: { topText: `${queryTitle}`, bottomText: `Already in ${projectTitle}` } });
};
export const projectCreatedToast = () => {
  return toast(AppToast, { data: { topText: 'Project created' } });
};
export const projectUpdatedToast = (projectTitle?: string, queryTitle?: string, action?: 'add' | 'remove') => {
  if(projectTitle && queryTitle && action === 'add')
    return toast(AppToast, { data: { topText: `${queryTitle}`, bottomText: `Added to ${projectTitle}` } });

  if(projectTitle && action === 'remove')
    return toast(AppToast, { data: { topText: `${queryTitle}`, bottomText: `Removed from ${projectTitle}` } });

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

// Authentication
export const unauthorizedErrorToast = (location?: Location) => {
  return toast.error(AppToast, { data: { topText: 'Your login has expired or is invalid. Please try logging in again.', bottomText: <a href={getFormattedLoginURL(location)}>Log In</a> } });
};
export const forbiddenErrorToast = (location?: Location) => {
  return toast.error(AppToast, { data: { topText: 'You do not have permission to access this resource. Please contact support if you believe this is an error.', bottomText: <a href={getFormattedLoginURL(location)}>Log In</a> } });
};
export const notFoundErrorToast = () => {
  return toast.error(AppToast, { data: { topText: 'The requested resource was not found.', bottomText: 'Please contact support if you believe this is an error.' } });
};
export const internalServerErrorToast = () => {
  return toast.error(AppToast, { data: { topText: 'An internal server error occurred.', bottomText: 'Please try again later or contact support if the problem persists.' } });
};
export const preferencesSavedToast = () => {
  return toast(AppToast, { data: { topText: 'Preferences Saved' } });
};

// Bookmarks
export const bookmarkAddedToast = () => {
  return toast(AppToast, { data: { topText: 'Bookmark Added' } });
};
export const bookmarkRemovedToast = () => {
  return toast(AppToast, { data: { topText: 'Bookmark Removed' } });
}
export const bookmarkErrorToast = () => {
  return toast.error(AppToast, { data: { topText: 'Error Adding Bookmark', bottomText: 'We were unable to save this bookmark to your account.' } });
};