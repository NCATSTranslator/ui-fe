import { FC, ReactNode, createContext, useCallback, useMemo, useState } from "react";
import { SidebarContextValue, SidebarItemId, SidebarItem } from "@/features/Sidebar/types/sidebar";

export const SidebarContext = createContext<SidebarContextValue>({
  collapsed: true,
  activePanelId: 'none',
  dynamicSidebarItems: [],
  addToProjectQuery: null,
  setCollapsed: () => {},
  togglePanel: () => {},
  closePanel: () => {},
  setAddToProjectMode: () => {},
  clearAddToProjectMode: () => {},
  registerSidebarItem: () => {},
  unregisterSidebarItem: () => {},
  getSidebarItem: () => null,
  getContextPanel: () => null,
  getButtonComponent: () => null,
});

const SidebarProvider: FC<{ children: ReactNode }> = ({ children }) => {

  const [collapsed, setCollapsedState] = useState<boolean>(true);
  const [activePanelId, setActivePanelId] = useState<SidebarContextValue['activePanelId']>('none');
  const [dynamicSidebarItems, setDynamicSidebarItems] = useState<SidebarItem[]>([]);
  const [addToProjectQuery, setAddToProjectQuery] = useState<SidebarContextValue['addToProjectQuery']>(null);

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
    setAddToProjectQuery(null);
  }, []);

  const setAddToProjectMode = useCallback((query: SidebarContextValue['addToProjectQuery']) => {
    setAddToProjectQuery(query);
  }, []);

  const clearAddToProjectMode = useCallback(() => {
    setAddToProjectQuery(null);
  }, []);

  const registerSidebarItem = useCallback((id: SidebarItemId, item: SidebarItem) => {
    setDynamicSidebarItems(prev => {
      const existingIndex = prev.findIndex(existingItem => existingItem.id === id);
      
      if (existingIndex >= 0) {
        // Update existing item in place
        const newItems = [...prev];
        newItems[existingIndex] = item;
        return newItems;
      } else {
        // Add new item at the end
        return [...prev, item];
      }
    });
  }, []);

  const unregisterSidebarItem = useCallback((id: SidebarItemId) => {
    setDynamicSidebarItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const getSidebarItem = useCallback((id: SidebarItemId) => {
    return dynamicSidebarItems.find(item => item.id === id) ?? null;
  }, [dynamicSidebarItems]);

  const getButtonComponent = useCallback((sidebarItem: SidebarItem) => {
    // If there's a factory function, call it to get the dynamic component
    if (sidebarItem.buttonComponentFactory) {
      return sidebarItem.buttonComponentFactory();
    }
    // Otherwise return the static component
    return sidebarItem.buttonComponent || null;
  }, []);

  const getContextPanel = useCallback((sidebarItem: SidebarItem) => {
    // If there's a factory function, call it to get the dynamic component
    if (sidebarItem.panelComponentFactory) {
      return sidebarItem.panelComponentFactory();
    }
    // Otherwise return the static component
    return sidebarItem.panelComponent || null;
  }, []);

  const value: SidebarContextValue = useMemo(() => ({
    collapsed,
    activePanelId,
    dynamicSidebarItems,
    addToProjectQuery,
    setCollapsed,
    togglePanel,
    closePanel,
    setAddToProjectMode,
    clearAddToProjectMode,
    registerSidebarItem,
    unregisterSidebarItem,
    getSidebarItem,
    getContextPanel,
    getButtonComponent,
  }), [
    collapsed,
    activePanelId,
    dynamicSidebarItems,
    addToProjectQuery,
    setCollapsed,
    togglePanel,
    closePanel,
    setAddToProjectMode,
    clearAddToProjectMode,
    registerSidebarItem,
    unregisterSidebarItem,
    getSidebarItem,
    getContextPanel,
    getButtonComponent,
  ]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarProvider;