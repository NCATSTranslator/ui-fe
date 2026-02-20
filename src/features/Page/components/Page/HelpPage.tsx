import { FC, ReactNode, useEffect, useCallback } from "react";
import HelpSidebar from "@/features/Page/components/HelpSidebar/HelpSidebar";
import DisclaimerModal from "@/features/Common/components/DisclaimerModal/DisclaimerModal";
import { useDisclaimersApproved } from "@/features/Common/hooks/customHooks";
import styles from './HelpPage.module.scss';

export interface HelpPageProps {
  title: string;
  children: ReactNode;
}

const HelpPage: FC<HelpPageProps> = ({ title, children }) => {

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
    } catch (error) {
      console.error('Error saving disclaimer approval:', error);
      setIsDisclaimerApproved(true);
    }
  }, [setIsDisclaimerApproved]);

  useEffect(() => {
    document.title = title || "";
  }, [title]);

  return (
    <>
      <div className={`container help-container ${styles.helpContainer}`}>
        <div className="left">
          <h1 className="h5">{title}</h1>
          {children}
        </div>
        <HelpSidebar />
      </div>
      <DisclaimerModal
        isOpen={!isDisclaimerApproved}
        onClose={handleDisclaimerClose}
      />
    </>
  );
};

export default HelpPage; 