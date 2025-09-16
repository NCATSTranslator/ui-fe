import { useContext, useEffect, useRef } from "react";
import { SidebarContext } from "@/features/Sidebar/components/SidebarProvider/SidebarProvider";
import { SidebarItem, SidebarRegistrationOptions } from "@/features/Sidebar/types/sidebar";

/**
 * Custom hook for accessing the sidebar context
 * @returns {SidebarContextValue} The sidebar context value
 */
export const useSidebar = () => useContext(SidebarContext);

/**
 * Custom hook for registering a context-specific sidebar item with automatic cleanup
 * Registers sidebar items once, prevents infinite re-renders, and cleans up on unmount
 * 
 * @param options - Configuration for the sidebar item registration
 */
export const useSidebarRegistration = (options: SidebarRegistrationOptions) => {
  const { 
    registerSidebarItem, 
    unregisterSidebarItem, 
    registerContextPanel, 
    unregisterContextPanel,
    togglePanel 
  } = useSidebar();
  
  // Use ref to store options to avoid dependency on options object changing
  const optionsRef = useRef(options);
  optionsRef.current = options;
  
  // Track if we've already registered to prevent duplicate registrations
  const hasBeenRegistered = useRef(false);

  useEffect(() => {
    const { id, to, onClick, panelComponent, icon, tooltipText, ariaLabel, autoOpen, label } = optionsRef.current;
    
    // Only register once
    if (hasBeenRegistered.current) {
      return;
    }

    // Determine the type based on whether it has a panel component or navigation
    const type: 'link' | 'panel' = panelComponent ? 'panel' : 'link';
    
    // Create the sidebar item
    const sidebarItem: SidebarItem = {
      id,
      label,
      type,
      to,
      onClick,
      icon,
      tooltipText,
      ariaLabel: ariaLabel || tooltipText,
    };

    // Register the sidebar item
    registerSidebarItem(id, sidebarItem);
    
    // If it has a panel component, register the panel
    if (panelComponent)
      registerContextPanel(id, panelComponent);
    
    // Auto-open the panel if specified
    if (autoOpen && type === 'panel')
      togglePanel(id);
    
    hasBeenRegistered.current = true;

    // Cleanup function
    return () => {
      unregisterSidebarItem(id);
      if (panelComponent) {
        unregisterContextPanel(id);
      }
      hasBeenRegistered.current = false;
    };
  }, []);

  // Additional effect to handle option changes after initial registration
  // TODO: Fix this, it causes the additional unnecessary re-renders
  // useEffect(() => {
  //   if (!hasBeenRegistered.current) {
  //     return;
  //   }

  //   const { id, panelComponent } = optionsRef.current;
    
  //   // Update the panel component if it exists and has changed
  //   if (panelComponent) {
  //     console.log("update");
  //     registerContextPanel(id, panelComponent);
  //   }
  // }, [options.panelComponent, registerContextPanel]);
};

