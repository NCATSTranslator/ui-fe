import { ReactNode } from 'react';
import { UserQueryObject } from '@/features/Projects/types/projects';

type SidebarItemId = 'newQuery' | 'queries' | 'projects' | 'filters' | 'queryStatus' | 'settings' | 'feedback' | 'help';

export type SidebarContextValue = {
  collapsed: boolean;
  activePanelId: SidebarItemId | 'none';
  dynamicSidebarItems: SidebarItem[];
  addToProjectQuery: UserQueryObject | null;
  setCollapsed: (v: boolean) => void;
  togglePanel: (id: SidebarItemId) => void;
  closePanel: () => void;
  setAddToProjectMode: (query: UserQueryObject) => void;
  clearAddToProjectMode: () => void;
  registerSidebarItem: (id: SidebarItemId, item: SidebarItem) => void;
  unregisterSidebarItem: (id: SidebarItemId) => void;
  getSidebarItem: (id: SidebarItemId) => SidebarItem | null;
  getContextPanel: (sidebarItem: SidebarItem) => ReactNode | null;
  getButtonComponent: (sidebarItem: SidebarItem) => ReactNode | null;
};

export type SidebarItem = {
  ariaLabel?: string;
  id: SidebarItemId;
  label: string;
  type: 'link' | 'panel';
  to?: string;
  onClick?: () => void;
  icon: ReactNode | (() => ReactNode);
  panelComponent?: ReactNode;
  panelComponentFactory?: () => ReactNode;
  buttonComponent?: ReactNode;
  buttonComponentFactory?: () => ReactNode;
  tooltipText?: string;
};

export type SidebarRegistrationOptions = {
  id: SidebarItemId;
  to?: string;
  onClick?: () => void;
  panelComponent?: ReactNode | (() => ReactNode);
  buttonComponent?: ReactNode | (() => ReactNode);
  icon: ReactNode | (() => ReactNode);
  tooltipText: string;
  label: string;
  ariaLabel?: string;
  autoOpen?: boolean;
  dependencies?: readonly unknown[];
}