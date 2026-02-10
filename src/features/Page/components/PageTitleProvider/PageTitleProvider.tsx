import { createContext, useState, ReactNode, useEffect } from 'react';

interface PageTitleContextValue {
  baseTitle: string;
  dynamicTitle: string | null;
  setDynamicTitle: (title: string | null) => void;
  finalTitle: string;
}

export const PageTitleContext = createContext<PageTitleContextValue | null>(null);

export const PageTitleProvider = ({ 
  baseTitle, 
  children 
}: { 
  baseTitle: string; 
  children: ReactNode;
}) => {
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);
  const finalTitle = dynamicTitle || baseTitle;

  useEffect(() => {
    document.title = `${finalTitle} - NCATS Biomedical Data Translator`;
  }, [finalTitle]);

  return (
    <PageTitleContext.Provider value={{ 
      baseTitle, 
      dynamicTitle, 
      setDynamicTitle,
      finalTitle
    }}>
      {children}
    </PageTitleContext.Provider>
  );
};