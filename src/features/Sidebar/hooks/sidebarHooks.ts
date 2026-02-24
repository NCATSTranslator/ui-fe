import { useContext, useEffect, useRef, ReactNode, useMemo } from "react";
import { SidebarContext } from "@/features/Sidebar/components/SidebarProvider/SidebarProvider";
import { SidebarItem, SidebarRegistrationOptions } from "@/features/Sidebar/types/sidebar";
import { SortSearchState, UserQueryObject } from "@/features/Projects/types/projects";
import { useGetQueriesUpdatedTitles } from "@/features/Projects/hooks/customHooks";
import { filterAndSortQueries } from "@/features/Projects/utils/filterAndSortingFunctions";

/**
 * Custom hook for accessing the sidebar context
 * @returns {SidebarContextValue} The sidebar context value
 */
export const useSidebar = () => useContext(SidebarContext);

/**
 * Custom hook for registering a context-specific sidebar item with automatic cleanup
 * Supports both static ReactNodes and factory functions for dynamic panel components
 * 
 * @param options - Configuration for the sidebar item registration
 */
export const useSidebarRegistration = (options: SidebarRegistrationOptions) => {
  const {
    registerSidebarItem,
    unregisterSidebarItem,
    togglePanel
  } = useSidebar();
  
  // Track the sidebar item ID for cleanup
  const sidebarItemIdRef = useRef(options.id);

  // Helper function to resolve a component to a static ReactNode or a factory function
  const resolveComponent = (panelComponent: ReactNode | (() => ReactNode) | undefined) => {
    if (!panelComponent)
      return { static: undefined, factory: undefined };
    if (typeof panelComponent === 'function')
      return { static: undefined, factory: panelComponent };
    return { static: panelComponent, factory: undefined };
  };

  // Update the item content on initial registration and whenever dependencies change
  useEffect(() => {
    const { id, to, onClick, panelComponent, buttonComponent, icon, tooltipText, ariaLabel, 
      autoOpen, title, className, disabled, reduceSpacing } = options;
    // Determine the type based on whether it has a panel component or navigation
    const type: 'link' | 'panel' = panelComponent ? 'panel' : 'link';
    
    // Handle panel component - support both static ReactNode and factory function
    let resolvedPanelComponent = resolveComponent(panelComponent);
    // Handle button component - support both static ReactNode and factory function
    let resolvedButtonComponent = resolveComponent(buttonComponent);
    
    // Create the sidebar item
    const sidebarItem: SidebarItem = {
      ariaLabel: ariaLabel || tooltipText,
      className,
      disabled,
      icon,
      id,
      title,
      onClick,
      panelComponent: resolvedPanelComponent.static,
      panelComponentFactory: resolvedPanelComponent.factory,
      buttonComponent: resolvedButtonComponent.static,
      buttonComponentFactory: resolvedButtonComponent.factory,
      to,
      tooltipText,
      type,
      reduceSpacing
    };

    // Register/update the sidebar item
    registerSidebarItem(id, sidebarItem);
    
    // Auto-open the panel if specified
    if (autoOpen && type === 'panel')
      togglePanel(id);
      
  }, [registerSidebarItem, togglePanel, ...options.dependencies || []]);

  // Hook to handle cleanup on unmount or id change
  useEffect(() => {
    const { id } = options;
    sidebarItemIdRef.current = id;
    
    return () => {
      unregisterSidebarItem(sidebarItemIdRef.current);
    };
  }, [options.id, unregisterSidebarItem]);
};

/**
 * Custom hook for filtering queries based on a search term
 * @param {UserQueryObject[]} queries - The queries to filter
 * @param {boolean} includeDeleted - Whether to include deleted queries
 * @param {SortSearchState} sortState - The sort state to use
 * @param {string} searchTerm - The search term to filter by
 * @returns {UserQueryObject[]} The filtered queries
 */
export const useFilteredQueries = (queries: UserQueryObject[], includeDeleted: boolean = false, sortState: SortSearchState, searchTerm?: string) => {
  const { queries: queriesWithTitles } = useGetQueriesUpdatedTitles(queries);

  return useMemo(() => filterAndSortQueries(queriesWithTitles, sortState.sortField, sortState.sortDirection, searchTerm ?? '').filter((query) => {
    return includeDeleted ? true : !query.data.deleted;
  }), [queriesWithTitles, sortState, searchTerm, includeDeleted]);
};