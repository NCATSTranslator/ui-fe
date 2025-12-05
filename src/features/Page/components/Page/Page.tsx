import { FC, ReactNode, useCallback } from "react";
import DisclaimerModal from "@/features/Common/components/DisclaimerModal/DisclaimerModal";
import { useDisclaimersApproved } from "@/features/Common/hooks/customHooks";
import { PageTitleProvider } from "@/features/Page/components/PageTitleProvider/PageTitleProvider";
import BackNavButton from "@/features/Core/components/BackNavButton/BackNavButton";
import { joinClasses } from "@/features/Common/utils/utilities";

export interface PageProps {
  title: string;
  children: ReactNode;
  className?: string;
  onDisclaimerApproved?: () => void;
}

const Page: FC<PageProps> = ({ 
  title, 
  children, 
  className,
  onDisclaimerApproved 
}) => {
  const [isDisclaimerApproved, setIsDisclaimerApproved] = useDisclaimersApproved(title);
  const pageClasses = joinClasses(className, 'page');
  
  const handleDisclaimerClose = useCallback(() => {
    try {
      const cookieName = window.location.pathname.includes("login") 
        ? 'loginDisclaimerApproved' 
        : 'disclaimerApproved';
      
      const item = JSON.stringify({ 
        approved: true, 
        timestamp: Date.now() 
      });
      
      localStorage.setItem(cookieName, item);
      setIsDisclaimerApproved(true);
      
      onDisclaimerApproved?.();
    } catch (error) {
      console.error('Error saving disclaimer approval:', error);
      setIsDisclaimerApproved(true);
    }
  }, [setIsDisclaimerApproved, onDisclaimerApproved]);

  return (
    <PageTitleProvider baseTitle={title}>
      <div className={pageClasses}>
        {children}
        <BackNavButton />
        <DisclaimerModal
          isOpen={!isDisclaimerApproved}
          onClose={handleDisclaimerClose}
        />
      </div>
    </PageTitleProvider>
  );
};

export default Page;
