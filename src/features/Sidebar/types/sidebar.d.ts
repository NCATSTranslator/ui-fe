import { ReactNode } from 'react';

type SidebarItemId = 'newQuery' | 'projects' | 'queries' | 'projectsPanel' | 'filters' | 'settings' | 'feedback' | 'help';

export type SidebarContextValue = {
  collapsed: boolean;
  activePanel: SidebarItemId | 'none';
  dynamicSidebarItems: SidebarItem[];
  setCollapsed: (v: boolean) => void;
  togglePanel: (id: SidebarItemId) => void;
  closePanel: () => void;
  registerSidebarItem: (id: SidebarItemId, item: SidebarItem) => void;
  unregisterSidebarItem: (id: SidebarItemId) => void;
  getSidebarItem: (id: SidebarItemId) => SidebarItem | null;
  registerContextPanel: (id: SidebarItemId, node: ReactNode) => void;
  unregisterContextPanel: (id: SidebarItemId) => void;
  getContextPanel: (id: SidebarItemId) => ReactNode | null;
};


export type SidebarItem = {
  ariaLabel?: string;
  id: SidebarItemId;
  label: string;
  type: 'link' | 'panel';
  to?: string;
  onClick?: () => void;
  icon: ReactNode;
  tooltipText?: string;
  requiresRoute?: string;
};

export type SidebarRegistrationOptions = {
  id: SidebarItemId;
  to?: string;
  onClick?: () => void;
  panelComponent?: ReactNode;
  icon: ReactNode;
  tooltipText: string;
  label: string;
  ariaLabel?: string;
  autoOpen?: boolean;
}