import { useMemo } from "react";
import styles from "./Sidebar.module.scss";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { topItems, bottomItems } from "@/features/Sidebar/utils/sidebarItems";
import { joinClasses } from "@/features/Common/utils/utilities";
import SidebarLinkList from "@/features/Sidebar/components/SidebarLinkList/SidebarLinkList";
import ContextPanel from "@/features/Sidebar/components/ContextPanel/ContextPanel";

const Sidebar = () => {
  const { collapsed, activePanelId, dynamicSidebarItems, getContextPanel, getButtonComponent } = useSidebar();
  const allSidebarItems = useMemo(() => [...topItems, ...dynamicSidebarItems, ...bottomItems], [dynamicSidebarItems]);
  const activeSidebarItem = useMemo(() => allSidebarItems.find(item => item.id === activePanelId), [allSidebarItems, activePanelId]);

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
            buttonComponent={activeSidebarItem && getButtonComponent(activeSidebarItem)}
            panel={activeSidebarItem && getContextPanel(activeSidebarItem)}
            title={activeSidebarItem.label || ''}
          />
        }
      </div>
    </aside>
  );
};

export default Sidebar;