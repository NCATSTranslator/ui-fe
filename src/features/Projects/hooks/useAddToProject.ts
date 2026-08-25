import { useCallback } from 'react';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';
import type { UserQueryObject } from '@/features/Projects/types/projects';

const useAddToProject = () => {
  const { activePanelId, setAddToProjectMode, togglePanel } = useSidebar();

  const addToProject = useCallback((query: UserQueryObject) => {
    setAddToProjectMode(query);
    if (activePanelId !== 'projects') {
      togglePanel('projects');
    }
  }, [activePanelId, setAddToProjectMode, togglePanel]);

  return { addToProject };
};

export default useAddToProject;
