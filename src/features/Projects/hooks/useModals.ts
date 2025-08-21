import { useState } from 'react';

/**
 * Generic hook to manage modal state for any set of modals
 * @param initialModals - Object defining the initial state of all modals
 * @returns {Object} - An object containing modal states and handlers
 */
export const useModals = <T extends Record<string, boolean>>(initialModals: T) => {
  const [modals, setModals] = useState(initialModals);

  const openModal = (modalType: keyof T) => {
    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof T) => {
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
