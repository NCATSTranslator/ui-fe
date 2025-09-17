import { FC, ReactNode, createContext, useCallback, useMemo, useRef, useState } from "react";
import { SidebarContextValue, SidebarItemId, SidebarItem } from "@/features/Sidebar/types/sidebar";

export const SidebarContext = createContext<SidebarContextValue>({
  collapsed: true,
  activePanelId: 'none',
  dynamicSidebarItems: [],
  setCollapsed: () => {},
  togglePanel: () => {},
  closePanel: () => {},
  registerSidebarItem: () => {},
  unregisterSidebarItem: () => {},
  getSidebarItem: () => null,
  getContextPanel: () => null,
});

const SidebarProvider: FC<{ children: ReactNode }> = ({ children }) => {

  const [collapsed, setCollapsedState] = useState<boolean>(true);
  const [activePanelId, setActivePanelId] = useState<SidebarContextValue['activePanelId']>('none');
  const [dynamicSidebarItems, setDynamicSidebarItems] = useState<Map<SidebarItemId, SidebarItem>>(new Map());

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
  }, []);

  const togglePanel = useCallback((id: SidebarItemId) => {
    setActivePanelId(prev => {
      const shouldCollapse = prev === id;
      const newActivePanelId = shouldCollapse? 'none' : id;
      setCollapsedState(shouldCollapse);
      return newActivePanelId;
    });
  }, []);

  const closePanel = useCallback(() => {
    setActivePanelId('none');
    setCollapsedState(true);
  }, []);

  const registerSidebarItem = useCallback((id: SidebarItemId, item: SidebarItem) => {
    setDynamicSidebarItems(prev => new Map(prev).set(id, item));
  }, []);

  const unregisterSidebarItem = useCallback((id: SidebarItemId) => {
    setDynamicSidebarItems(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const getSidebarItem = useCallback((id: SidebarItemId) => {
    return dynamicSidebarItems.get(id) ?? null;
  }, [dynamicSidebarItems]);

  const getContextPanel = useCallback((sidebarItem: SidebarItem) => {
    return sidebarItem.panelComponent || null;
    // return contextPanels.current.get(sidebarItem.id) ?? null;
  }, []);

  const value: SidebarContextValue = useMemo(() => ({
    collapsed,
    activePanelId,
    dynamicSidebarItems: Array.from(dynamicSidebarItems.values()),
    setCollapsed,
    togglePanel,
    closePanel,
    registerSidebarItem,
    unregisterSidebarItem,
    getSidebarItem,
    getContextPanel,
  }), [
    collapsed,
    activePanelId,
    dynamicSidebarItems,
    setCollapsed,
    togglePanel,
    closePanel,
    registerSidebarItem,
    unregisterSidebarItem,
    getSidebarItem,
    getContextPanel,
  ]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarProvider;