import { FC } from 'react';
import styles from './SidebarLinkList.module.scss';
import { SidebarItem } from '@/features/Sidebar/types/sidebar';
import SidebarLink from '@/features/Sidebar/components/SidebarLink/SidebarLink';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';

interface SidebarLinkListProps {
  items: SidebarItem[];
}

const SidebarLinkList: FC<SidebarLinkListProps> = ({ items }) => {
  const { togglePanel } = useSidebar();

  return (
    <>
      {items.map(item => {
        const ariaLabel = item.ariaLabel || item.tooltipText || '';
        const tooltipText = item.tooltipText || '';
        const icon = item.icon;
        return item.type === 'link'
          ? 
            <SidebarLink
              key={item.id}
              href={item.to}
              icon={icon}
              tooltipText={tooltipText}
              ariaLabel={ariaLabel}
            />
          : 
            <SidebarLink
              key={item.id}
              onClick={() => togglePanel(item.id)}
              icon={icon}
              tooltipText={tooltipText}
              ariaLabel={ariaLabel}
            />
      }
      )}
    </>
  );
};

export default SidebarLinkList;