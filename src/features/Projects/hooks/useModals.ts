import { useState } from 'react';
import { ModalObject, ModalType } from '@/features/Projects/types/projects.d';

/**
 * Generic hook to manage modal state for any set of modals
 * @param initialModals - Object defining the initial state of all modals
 * @returns {Object} - An object containing modal states and handlers
 */
export const useModals = ( initialModals: ModalObject) => {
  const [modals, setModals] = useState(initialModals);

  const openModal = (modalType: ModalType) => {
    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: ModalType) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
  };

  const closeAllModals = () => {
    setModals(initialModals);
  };

  return { 
    modals, 
    openModal, 
    closeModal, 
    closeAllModals 
  };
};
