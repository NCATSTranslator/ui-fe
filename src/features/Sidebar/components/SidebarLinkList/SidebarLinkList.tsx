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
        const disabled = ((item.id === 'projects' || item.id === 'queries') && !user) || item.disabled;
        const hasRedDot = item.id === 'settings' && !user;
        const onClick = disabled ? undefined : item.onClick ? item.onClick : () => togglePanel(item.id);

        return item.type === 'link'
          ? 
            <SidebarLink
              key={item.id}
              id={item.id}
              to={item.to}
              icon={icon}
              tooltipText={disabled ? noUserTooltipText : tooltipText}
              ariaLabel={ariaLabel}
              disabled={disabled}
              onClick={item.onClick}
              hasRedDot={hasRedDot}
              className={item.className}
            />
          : 
            <SidebarLink
              key={item.id}
              id={item.id}
              onClick={onClick}
              icon={icon}
              tooltipText={disabled ? noUserTooltipText : tooltipText}
              ariaLabel={ariaLabel}
              disabled={disabled}
              hasRedDot={hasRedDot}
              className={item.className}
            />
      }
      )}
    </>
  );
};

export default SidebarLinkList;