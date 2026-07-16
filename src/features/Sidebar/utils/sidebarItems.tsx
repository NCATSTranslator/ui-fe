import { lazy, Suspense } from 'react';
import { Link } from "react-router-dom";
import { SidebarItem } from "@/features/Sidebar/types/sidebar";
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
import HelpButton from "@/features/Sidebar/components/HelpButton/HelpButton";
import CirclePlusIcon from '@/assets/icons/queries/CirclePlus.svg?react';
import WorkspaceIcon from '@/assets/icons/navigation/Workspace.svg?react';

const CanvasPanel = lazy(() => import('@/features/Sidebar/components/Panels/CanvasPanel/CanvasPanel'));

const ViewProjectsButton = () => {
  return <Button iconLeft={<ExternalLink />} iconOnly href="/projects" link small variant="textOnly" title="View All Projects" />;
};

const ViewAllQueriesButton = () => {
  return <Button iconLeft={<ExternalLink />} iconOnly href="/query-history" link small variant="textOnly" title="View All Queries" />;
};

const ViewCanvasesButton = () => {
  return <Button iconLeft={<ExternalLink />} iconOnly href="/canvases" link small variant="textOnly" title="View All Canvases" />;
};

export const topItems: SidebarItem[] = [
  { id: 'newQuery', title: 'New Query', type: 'link', to: '/new-query', icon: <CirclePlusIcon />, tooltipText: 'New Query' },
  { id: 'projects', title: <Link to="/projects">Projects</Link>, type: 'panel', icon: <FolderIcon />, tooltipText: 'Projects', noUserTooltipText: 'Log In to Access Projects', panelComponent: <ProjectsPanel />, buttonComponent: <ViewProjectsButton /> },
  { id: 'queries', title: <Link to="/query-history">Query History</Link>, type: 'panel', icon: <HistoryIcon />, tooltipText: 'Query History', noUserTooltipText: 'Log In to Access Query History', panelComponent: <QueriesPanel />, buttonComponent: <ViewAllQueriesButton /> },
  { id: 'canvases', title: <Link to="/canvases">Canvases</Link>, type: 'panel', icon: <WorkspaceIcon />, tooltipText: 'Canvases', noUserTooltipText: 'Log In to Access Canvases', panelComponent: <Suspense fallback={null}><CanvasPanel /></Suspense>, buttonComponent: <ViewCanvasesButton /> },
];

export const bottomItems: SidebarItem[] = [
  { id: 'feedback', title: 'Send Feedback', type: 'panel', icon: <Feedback />, tooltipText: 'Send Feedback', panelComponent: <FeedbackPanel /> },
  { id: 'help', title: <Link to="/frequently-asked-questions">Help</Link>, type: 'panel', icon: <Question />, tooltipText: 'Help', panelComponent: <HelpPanel />, buttonComponent: <HelpButton />, reduceSpacing: true },
  { id: 'settings', title: 'Account Settings', type: 'panel', icon: <UserIcon />, tooltipText: 'Account Settings', noUserTooltipText: 'Log In to Access Account Settings', panelComponent: <SettingsPanel />, reduceSpacing: true },
];