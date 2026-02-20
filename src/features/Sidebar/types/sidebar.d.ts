import { ReactNode } from 'react';
import { ProjectRaw, UserQueryObject } from '@/features/Projects/types/projects';

type SidebarItemId = 'newQuery' | 'queries' | 'projects' | 'filters' | 'queryStatus' 
  | 'settings' | 'feedback' | 'help' | 'download';

export type SidebarContextValue = {
  collapsed: boolean;
  activePanelId: SidebarItemId | 'none';
  dynamicSidebarItems: SidebarItem[];
  addToProjectQuery: UserQueryObject | null;
  selectedProject: ProjectRaw | null;
  isSelectedProjectMode: boolean;
  setSelectedProjectMode: (isSelectedProjectMode?: boolean) => void;
  setSelectedProject: (project: ProjectRaw) => void;
  clearSelectedProject: () => void;
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
  className?: string;
  disabled?: boolean;
  id: SidebarItemId;
  title: string | ReactNode;
  type: 'link' | 'panel';
  to?: string;
  href?: string;
  onClick?: () => void;
  icon: ReactNode | (() => ReactNode);
  panelComponent?: ReactNode;
  panelComponentFactory?: () => ReactNode;
  buttonComponent?: ReactNode;
  buttonComponentFactory?: () => ReactNode;
  tooltipText?: string;
  noUserTooltipText?: string;
  reduceSpacing?: boolean;
};

export type SidebarRegistrationOptions = {
  className?: string;
  disabled?: boolean;
  id: SidebarItemId;
  to?: string;
  onClick?: () => void;
  panelComponent?: ReactNode | (() => ReactNode);
  buttonComponent?: ReactNode | (() => ReactNode);
  icon: ReactNode | (() => ReactNode);
  tooltipText: string;
  title: string | ReactNode;
  ariaLabel?: string;
  autoOpen?: boolean;
  dependencies?: readonly unknown[];
  reduceSpacing?: boolean;
}

export type HelpPanelItem = {
  id: string;
  title: string;
  component: ReactNode;
}

export type FAQItemParagraph = {
  text: string;
  anchor?: string;
}

export type FAQItem = {
  id: string;
  title: string;
  paragraphs: (string | FAQItemParagraph)[];
}