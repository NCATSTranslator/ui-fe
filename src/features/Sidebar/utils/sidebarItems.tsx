import { SidebarItem } from "@/features/Sidebar/types/sidebar";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import HistoryIcon from '@/assets/icons/navigation/History.svg?react';
import Cog from '@/assets/icons/navigation/Settings.svg?react';
import Feedback from '@/assets/icons/navigation/Feedback.svg?react';
import Question from '@/assets/icons/navigation/Help.svg?react';


export const topItems: SidebarItem[] = [
  { id: 'newQuery', label: 'New Query', type: 'link', to: '/', icon: <SearchIcon />, tooltipText: 'New Query' },
  { id: 'projectsPanel', label: 'Projects', type: 'panel', icon: <FolderIcon />, tooltipText: 'Projects' },
  { id: 'queries', label: 'Query History', type: 'panel', icon: <HistoryIcon />, tooltipText: 'Query History' },
];

export const bottomItems: SidebarItem[] = [
  { id: 'feedback', label: 'Send Feedback', type: 'link', to: '/send-feedback', icon: <Feedback />, tooltipText: 'Send Feedback' },
  { id: 'help', label: 'Help', type: 'link', to: '/help', icon: <Question />, tooltipText: 'Help' },
  { id: 'settings', label: 'Settings', type: 'panel', icon: <Cog />, tooltipText: 'Settings' },
];