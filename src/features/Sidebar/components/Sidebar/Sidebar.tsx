import { useMemo } from "react";
import styles from "./Sidebar.module.scss";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { topItems, bottomItems } from "@/features/Sidebar/utils/sidebarItems";
import { joinClasses } from "@/features/Common/utils/utilities";
import SidebarLinkList from "@/features/Sidebar/components/SidebarLinkList/SidebarLinkList";
import ContextPanel from "@/features/Sidebar/components/ContextPanel/ContextPanel";

const Sidebar = () => {
  const { collapsed, activePanel, dynamicSidebarItems, getContextPanel } = useSidebar();
  const allSidebarItems = useMemo(() => [...topItems, ...dynamicSidebarItems, ...bottomItems], [dynamicSidebarItems]);
  const activePanelItem = useMemo(() => allSidebarItems.find(item => item.id === activePanel), [allSidebarItems, activePanel]);

  return (
    <aside className={joinClasses(styles.sidebar, collapsed && styles.collapsed)} aria-label="Sidebar">
      <div className={styles.linkList}>
        <nav className={styles.top} aria-label="Global navigation">
          <SidebarLinkList items={topItems} />
          <div className={styles.sep} />
        </nav>
        <div className={styles.middle} aria-label="Page-specific links">
        {
          dynamicSidebarItems && dynamicSidebarItems.length > 0 && 
          (
            <SidebarLinkList items={dynamicSidebarItems} />
          )
        }
          {/* Context-specific: e.g., filters on Results route */}
          {/* {getContextPanel('filters')} */}
          {/* Global panels: only show when active */}
          {/* {activePanel === 'projects' && <ProjectsQuickList />} */}
          {/* {activePanel === 'settings' && <SettingsQuickPanel />} */}
        </div>
        <nav className={styles.bottom} aria-label="Bottom navigation">
          <div className={styles.sep} />
          <SidebarLinkList items={bottomItems} />
        </nav>
      </div>
      <div className={styles.activePanel}>
        {
          activePanel !== 'none' &&
          <ContextPanel
            panel={getContextPanel(activePanel)}
            title={activePanelItem?.label || ''}
          />
        }
      </div>
    </aside>
  );
};

export default Sidebar;