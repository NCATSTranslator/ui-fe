import { useEffect, useMemo } from "react";
import styles from "./Sidebar.module.scss";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { topItems, bottomItems } from "@/features/Sidebar/utils/sidebarItems";
import { joinClasses } from "@/features/Common/utils/utilities";
import SidebarLinkList from "@/features/Sidebar/components/SidebarLinkList/SidebarLinkList";
import ContextPanel from "@/features/Sidebar/components/ContextPanel/ContextPanel";

const Sidebar = () => {
  const { collapsed, activePanelId, dynamicSidebarItems, getContextPanel, getButtonComponent, addToProjectQuery, isSelectedProjectMode, closePanel } = useSidebar();
  const allSidebarItems = useMemo(() => [...topItems, ...dynamicSidebarItems, ...bottomItems], [dynamicSidebarItems]);
  const activeSidebarItem = useMemo(() => allSidebarItems.find(item => item.id === activePanelId), [allSidebarItems, activePanelId]);
  
  const activeTitle = useMemo(() => {
    if (!activeSidebarItem) return '';
    
    // Special case for projects panel - dynamic title based on mode
    // if (activeSidebarItem.id === 'projects' && addToProjectQuery)
    //   return 'Add to Project';

    // if (activeSidebarItem.id === 'projects' && isSelectedProjectMode)
    //   return 'Select Project';

    return activeSidebarItem.label;
  }, [activeSidebarItem, addToProjectQuery, isSelectedProjectMode]);

  // when the sidebar mounts, if the active panel doesn't exist, close the sidebar
  useEffect(() => {
    if (!activeSidebarItem)
      closePanel();
  }, [activeSidebarItem, closePanel]);

  return (
    <aside className={joinClasses(styles.sidebar, collapsed && styles.collapsed)} aria-label="Sidebar">
      <div className={styles.linkList}>
        <nav className={styles.top} aria-label="Global navigation">
          <SidebarLinkList items={topItems} />
          <div className={styles.sep} />
          <div className={styles.middle} aria-label="Page-specific links">
            {
              dynamicSidebarItems && dynamicSidebarItems.length > 0 && 
              (
                <SidebarLinkList items={dynamicSidebarItems} />
              )
            }
          </div>
        </nav>
        <nav className={styles.bottom} aria-label="Bottom navigation">
          <div className={styles.sep} />
          <SidebarLinkList items={bottomItems} />
        </nav>
      </div>
      <div className={styles.activePanel}>
        {
          activeSidebarItem &&
          <ContextPanel
            activePanelId={activePanelId}
            buttonComponent={activeSidebarItem && getButtonComponent(activeSidebarItem)}
            panel={activeSidebarItem && getContextPanel(activeSidebarItem)}
            title={activeTitle}
          />
        }
      </div>
    </aside>
  );
};

export default Sidebar;