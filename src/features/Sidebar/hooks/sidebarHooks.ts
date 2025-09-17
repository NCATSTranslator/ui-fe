import { useContext, useEffect, useRef, ReactNode } from "react";
import { SidebarContext } from "@/features/Sidebar/components/SidebarProvider/SidebarProvider";
import { SidebarItem, SidebarRegistrationOptions } from "@/features/Sidebar/types/sidebar";

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
    const { id, to, onClick, panelComponent, icon, tooltipText, ariaLabel, autoOpen, label } = options;
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
    
    // Create the sidebar item
    const sidebarItem: SidebarItem = {
      ariaLabel: ariaLabel || tooltipText,
      icon,
      id,
      label,
      onClick,
      panelComponent: resolvedPanelComponent,
      panelComponentFactory,
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

