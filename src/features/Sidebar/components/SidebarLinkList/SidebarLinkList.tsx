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
        const noUserTooltipText = item.noUserTooltipText || '';
        const icon = item.icon;
        const isGrayedOut = (item.id === 'projects' || item.id === 'queries') && !user;
        const hasRedDot = item.id === 'settings' && !user;

        return item.type === 'link'
          ? 
            <SidebarLink
              key={item.id}
              href={item.to}
              icon={icon}
              tooltipText={isGrayedOut ? noUserTooltipText : tooltipText}
              ariaLabel={ariaLabel}
              isGrayedOut={isGrayedOut}
              onClick={isGrayedOut ? undefined : item.onClick}
              hasRedDot={hasRedDot}
            />
          : 
            <SidebarLink
              key={item.id}
              onClick={isGrayedOut ? undefined : () => togglePanel(item.id)}
              icon={icon}
              tooltipText={isGrayedOut ? noUserTooltipText : tooltipText}
              ariaLabel={ariaLabel}
              isGrayedOut={isGrayedOut}
              hasRedDot={hasRedDot}
            />
      }
      )}
    </>
  );
};

export default SidebarLinkList;