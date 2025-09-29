import { useContext, useEffect, useRef, ReactNode, useMemo } from "react";
import { SidebarContext } from "@/features/Sidebar/components/SidebarProvider/SidebarProvider";
import { SidebarItem, SidebarRegistrationOptions } from "@/features/Sidebar/types/sidebar";
import { UserQueryObject } from "@/features/Projects/types/projects";
import { useGetQueriesUpdatedTitles } from "@/features/Projects/hooks/customHooks";

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

  useEffect(() => {
    const { id, to, onClick, panelComponent, buttonComponent, icon, tooltipText, ariaLabel, autoOpen, label } = options;
    // Determine the type based on whether it has a panel component or navigation
    const type: 'link' | 'panel' = panelComponent ? 'panel' : 'link';
    
    // Handle panel component - support both static ReactNode and factory function
    let resolvedPanelComponent: ReactNode = undefined;
    let panelComponentFactory: (() => ReactNode) | undefined = undefined;
    if (panelComponent) {
      if (typeof panelComponent === 'function') {
        // It's a factory function - store it for dynamic rendering
        panelComponentFactory = panelComponent;
        resolvedPanelComponent = undefined;
      } else {
        // It's a static ReactNode
        resolvedPanelComponent = panelComponent;
        panelComponentFactory = undefined;
      }
    }
    // Handle button component - support both static ReactNode and factory function
    let resolvedButtonComponent: ReactNode = undefined;
    let buttonComponentFactory: (() => ReactNode) | undefined = undefined;
    if (buttonComponent) {
      if (typeof buttonComponent === 'function') {
        buttonComponentFactory = buttonComponent;
        resolvedButtonComponent = undefined;
      } else {
        resolvedButtonComponent = buttonComponent;
        buttonComponentFactory = undefined;
      }
    }
    
    // Create the sidebar item
    const sidebarItem: SidebarItem = {
      ariaLabel: ariaLabel || tooltipText,
      icon,
      id,
      label,
      onClick,
      panelComponent: resolvedPanelComponent,
      panelComponentFactory,
      buttonComponent: resolvedButtonComponent,
      buttonComponentFactory,
      to,
      tooltipText,
      type
    };

    // Register the sidebar item
    registerSidebarItem(id, sidebarItem);
    
    // Auto-open the panel if specified
    if (autoOpen && type === 'panel')
      togglePanel(id);

    // Cleanup function
    return () => {
      unregisterSidebarItem(sidebarItemIdRef.current);
    };
  }, options.dependencies || []); // Re-register when dependencies change
};

/**
 * Custom hook for filtering queries based on a search term
 * @param {UserQueryObject[]} queries - The queries to filter
 * @param {string} searchTerm - The search term to filter by
 * @returns {UserQueryObject[]} The filtered queries
 */
export const useFilteredQueries = (queries: UserQueryObject[], searchTerm: string) => {
  const { queries: queriesWithTitles } = useGetQueriesUpdatedTitles(queries);

  return useMemo(() => queriesWithTitles.filter((query) => {
    return query.data.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
  }), [queriesWithTitles, searchTerm]);
};