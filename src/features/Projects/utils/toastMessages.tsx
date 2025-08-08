import { toast } from "react-toastify";

// Projects
export const projectRestoredToast = () => {
  return toast.success('Project restored');
};

export const projectDeletedToast = () => {
  return toast.error('Project deleted');
};

export const projectCreatedToast = () => {
  return toast.success('Project created');
};

export const projectUpdatedToast = () => {
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