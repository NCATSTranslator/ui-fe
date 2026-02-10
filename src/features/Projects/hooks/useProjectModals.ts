import { useContext } from 'react';
import { ProjectModalsContext } from '@/features/Projects/components/ProjectModalsProvider/ProjectModalsProvider';

/**
 * Hook to access the ProjectModals context
 * Must be used within a ProjectModalsProvider
 */
export const useProjectModals = () => {
  const context = useContext(ProjectModalsContext);
  if (!context) {
    throw new Error('useProjectModals must be used within ProjectModalsProvider');
  }
  return context;
};

