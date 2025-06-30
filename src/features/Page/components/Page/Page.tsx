import { FC, ReactNode, useCallback } from "react";
import DisclaimerModal from "@/features/Common/components/DisclaimerModal/DisclaimerModal";
import { useDisclaimersApproved } from "@/features/Common/utils/customHooks";

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
    <div className={className}>
      {children}
      <DisclaimerModal
        isOpen={!isDisclaimerApproved}
        onClose={handleDisclaimerClose}
      />
    </div>
  );
};

export default Page;
