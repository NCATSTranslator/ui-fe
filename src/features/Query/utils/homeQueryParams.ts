import { getQueryTypeForCategory } from '@/features/Query/utils/queryTypes';

export const HOME_QUERY_TAB_PARAM = 'tab';
export const HOME_QUERY_NODE_ID_PARAM = 'i';
export const HOME_QUERY_NODE_LABEL_PARAM = 'l';
export const HOME_QUERY_NODE_CATEGORY_PARAM = 'nc';

export type HomeQueryTab = 'smart' | 'pathfinder' | 'lookup';

export type HomeQueryTabOptions = {
  includePathfinder?: boolean;
  includeLookup?: boolean;
};

export const homeQueryTabOptionsFromConfig = (config?: {
  include_pathfinder?: boolean;
  include_lookup?: boolean;
} | null): HomeQueryTabOptions => ({
  includePathfinder: config?.include_pathfinder,
  includeLookup: config?.include_lookup,
});

export const HOME_QUERY_TAB_HEADING: Record<HomeQueryTab, string> = {
  smart: 'Smart Query',
  pathfinder: 'Pathfinder Query',
  lookup: 'Lookup',
};

const HOME_QUERY_TAB_ORDER: HomeQueryTab[] = ['smart', 'pathfinder', 'lookup'];

export const isHomeQueryTabEnabled = (
  tab: HomeQueryTab,
  options: HomeQueryTabOptions,
): boolean => {
  if (tab === 'pathfinder') return !!options.includePathfinder;
  if (tab === 'lookup') return !!options.includeLookup;
  return true;
};

export const getHomeQueryPath = (
  tab: HomeQueryTab,
  nodeId: string,
  nodeLabel?: string,
  nodeCategory?: string,
): string => {
  const params = new URLSearchParams({
    [HOME_QUERY_TAB_PARAM]: tab,
    [HOME_QUERY_NODE_ID_PARAM]: nodeId,
  });
  if (nodeLabel) params.set(HOME_QUERY_NODE_LABEL_PARAM, nodeLabel);
  if (nodeCategory) params.set(HOME_QUERY_NODE_CATEGORY_PARAM, nodeCategory);
  return `/?${params.toString()}`;
};

export const getHomeQueryTabHeading = (
  tab: string | null,
  options: HomeQueryTabOptions,
): string | null => {
  if (tab !== 'smart' && tab !== 'pathfinder' && tab !== 'lookup') return null;
  if (!isHomeQueryTabEnabled(tab, options)) return null;
  return HOME_QUERY_TAB_HEADING[tab];
};

export const getEnabledHomeQueryActions = (options: HomeQueryTabOptions) =>
  HOME_QUERY_TAB_ORDER
    .filter((action) => isHomeQueryTabEnabled(action, options))
    .map((action) => ({ action, label: HOME_QUERY_TAB_HEADING[action] }));

export const getQueryActionsForNodeCategory = (
  options: HomeQueryTabOptions,
  nodeCategory: string | undefined,
) => {
  const actions = getEnabledHomeQueryActions(options);
  if (getQueryTypeForCategory(nodeCategory) !== null) return actions;
  return actions.filter((action) => action.action !== 'smart');
};
