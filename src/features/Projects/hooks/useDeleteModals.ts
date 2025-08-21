import { useState } from 'react';

/**
 * Hook to manage modal state for all deletion modals in ProjectListInner
 * Replaces 6 individual useState hooks with a consolidated state management approach
 * @returns {Object} - An object containing all the modal states
 */
export const useDeleteModals = () => {
  const [modals, setModals] = useState({
    deleteProjects: false,
    deleteQueries: false,
    permanentDeleteProject: false,
    permanentDeleteQuery: false,
    permanentDeleteSelected: false,
    emptyTrash: false
  });

  const openModal = (modalType: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
  };

  const closeAllModals = () => {
    setModals({
      deleteProjects: false,
      deleteQueries: false,
      permanentDeleteProject: false,
      permanentDeleteQuery: false,
      permanentDeleteSelected: false,
      emptyTrash: false
    });
  };

  return { 
    modals, 
    openModal, 
    closeModal, 
    closeAllModals 
  };
};
