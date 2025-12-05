import { useContext, useEffect } from "react";
import { PageTitleContext } from "@/features/Page/components/PageTitleProvider/PageTitleProvider";

/**
 * Hook to access the PageTitle context
 * Must be used within a PageTitleProvider
 * 
 * @returns {PageTitleContextValue} - The PageTitle context value
 * (baseTitle, dynamicTitle, setDynamicTitle, finalTitle)
 */
export const usePageTitle = () => {
  const context = useContext(PageTitleContext);
  if (!context) {
    throw new Error('usePageTitle must be used within PageTitleProvider');
  }

  return context;
};

/**
 * Hook to set dynamic page title from child components
 */
export const useDynamicPageTitle = (title: string | null) => {
  const { setDynamicTitle, baseTitle } = usePageTitle();
  
  useEffect(() => {
    setDynamicTitle(title);
    return () => {
      setDynamicTitle(null);
    }; // Clean up on unmount
  }, [title, setDynamicTitle, baseTitle]);
};