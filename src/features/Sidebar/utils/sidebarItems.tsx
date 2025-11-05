import { SidebarItem } from "@/features/Sidebar/types/sidebar";
import SearchPlusIcon from '@/assets/icons/projects/searchplus.svg?react';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import HistoryIcon from '@/assets/icons/navigation/History.svg?react';
import UserIcon from '@/assets/icons/projects/user.svg?react';
import Feedback from '@/assets/icons/navigation/Feedback.svg?react';
import Question from '@/assets/icons/navigation/Help.svg?react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import Button from "@/features/Core/components/Button/Button";
import ProjectsPanel from "@/features/Sidebar/components/Panels/ProjectsPanel/ProjectsPanel";
import QueriesPanel from "@/features/Sidebar/components/Panels/QueriesPanel/QueriesPanel";
import SettingsPanel from "@/features/Sidebar/components/Panels/SettingsPanel/SettingsPanel";
import HelpPanel from "@/features/Sidebar/components/Panels/HelpPanel/HelpPanel";
import FeedbackPanel from "@/features/Sidebar/components/Panels/FeedbackPanel/FeedbackPanel";

const ViewProjectsButton = () => {
  return <Button iconLeft={<ExternalLink />} iconOnly href="/projects" link small variant="textOnly" title="View All Projects" />;
};

const ViewAllQueriesButton = () => {
  return <Button iconLeft={<ExternalLink />} iconOnly href="/queries" link small variant="textOnly" title="View All Queries" />;
};

const HelpButton = () => {
  return <Button iconRight={<ExternalLink />} href="/help" link variant="textOnly" smallFont>All Help Topics</Button>;
};

export const topItems: SidebarItem[] = [
  { id: 'newQuery', label: 'New Query', type: 'link', to: '/', icon: <SearchPlusIcon />, tooltipText: 'New Query' },
  { id: 'projects', label: 'Projects', type: 'panel', icon: <FolderIcon />, tooltipText: 'Projects', panelComponent: <ProjectsPanel />, buttonComponent: <ViewProjectsButton /> },
  { id: 'queries', label: 'Query History', type: 'panel', icon: <HistoryIcon />, tooltipText: 'Query History', panelComponent: <QueriesPanel />, buttonComponent: <ViewAllQueriesButton /> },
];

export const bottomItems: SidebarItem[] = [
  { id: 'feedback', label: 'Send Feedback', type: 'panel', icon: <Feedback />, tooltipText: 'Send Feedback', panelComponent: <FeedbackPanel /> },
  { id: 'help', label: 'Help', type: 'panel', icon: <Question />, tooltipText: 'Help', panelComponent: <HelpPanel />, buttonComponent: <HelpButton /> },
  { id: 'settings', label: 'Account Settings', type: 'panel', icon: <UserIcon />, tooltipText: 'Account Settings', panelComponent: <SettingsPanel /> },
];