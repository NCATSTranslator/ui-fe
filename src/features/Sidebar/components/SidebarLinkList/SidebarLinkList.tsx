import { FC } from 'react';
import { SidebarItem } from '@/features/Sidebar/types/sidebar';
import SidebarLink from '@/features/Sidebar/components/SidebarLink/SidebarLink';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';
import { useUser } from '@/features/UserAuth/utils/userApi';

interface SidebarLinkListProps {
  items: SidebarItem[];
}

const SidebarLinkList: FC<SidebarLinkListProps> = ({ items }) => {
  const { togglePanel } = useSidebar();
  const [ user ] = useUser();

  return (
    <>
      {items.map(item => {
        const ariaLabel = item.ariaLabel || item.tooltipText || '';
        const tooltipText = item.tooltipText || '';
        const icon = item.icon;
        const isGrayedOut = (item.id === 'projects' || item.id === 'queries') && !user;

        return item.type === 'link'
          ? 
            <SidebarLink
              key={item.id}
              href={item.to}
              icon={icon}
              tooltipText={tooltipText}
              ariaLabel={ariaLabel}
              isGrayedOut={isGrayedOut}
            />
          : 
            <SidebarLink
              key={item.id}
              onClick={() => togglePanel(item.id)}
              icon={icon}
              tooltipText={tooltipText}
              ariaLabel={ariaLabel}
              isGrayedOut={isGrayedOut}
            />
      }
      )}
    </>
  );
};

export default SidebarLinkList;