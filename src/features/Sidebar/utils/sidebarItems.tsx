import { SidebarItem } from "@/features/Sidebar/types/sidebar";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import HistoryIcon from '@/assets/icons/navigation/History.svg?react';
import UserIcon from '@/assets/icons/projects/user.svg?react';
import Feedback from '@/assets/icons/navigation/Feedback.svg?react';
import Question from '@/assets/icons/navigation/Help.svg?react';
import ProjectsPanel from "@/features/Sidebar/components/Panels/ProjectsPanel/ProjectsPanel";
import QueriesPanel from "@/features/Sidebar/components/Panels/QueriesPanel/QueriesPanel";
import SettingsPanel from "@/features/Sidebar/components/Panels/SettingsPanel/SettingsPanel";
import Button from "@/features/Core/components/Button/Button";
import FolderPlus from '@/assets/icons/projects/folderplus.svg?react';
import SearchPlus from '@/assets/icons/projects/searchplus.svg?react';

const NewProjectButton = () => {
  return <Button iconLeft={<FolderPlus />} iconOnly />;
};

const NewQueryButton = () => {
  return <Button iconLeft={<SearchPlus />} iconOnly href="/" link />;
};

export const topItems: SidebarItem[] = [
  { id: 'newQuery', label: 'New Query', type: 'link', to: '/', icon: <SearchIcon />, tooltipText: 'New Query' },
  { id: 'projectsPanel', label: 'Projects', type: 'panel', icon: <FolderIcon />, tooltipText: 'Projects', panelComponent: <ProjectsPanel />, buttonComponent: <NewProjectButton /> },
  { id: 'queries', label: 'Query History', type: 'panel', icon: <HistoryIcon />, tooltipText: 'Query History', panelComponent: <QueriesPanel />, buttonComponent: <NewQueryButton /> },
];

export const bottomItems: SidebarItem[] = [
  { id: 'feedback', label: 'Send Feedback', type: 'link', to: '/send-feedback', icon: <Feedback />, tooltipText: 'Send Feedback' },
  { id: 'help', label: 'Help', type: 'link', to: '/help', icon: <Question />, tooltipText: 'Help' },
  { id: 'settings', label: 'Settings', type: 'panel', icon: <UserIcon />, tooltipText: 'Settings', panelComponent: <SettingsPanel /> },
];