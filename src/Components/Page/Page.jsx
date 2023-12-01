import { useEffect, useState } from "react";
import DisclaimerModal from "../Modals/DisclaimerModal";

const Page = ({ title, children }) => {
  const [isDisclaimerApproved, setIsDisclaimerApproved] = useState(false);

  useEffect(() => {
    const disclaimerApproved = JSON.parse(localStorage.getItem('disclaimerApproved'));
    const loginDisclaimer = localStorage.getItem('loginDisclaimerApproved');

    let initDisclaimerApproval = disclaimerApproved;
    if (window.location.pathname.includes('login') && loginDisclaimer) {
      const { approved, timestamp } = JSON.parse(loginDisclaimer);
      const oneYear = 365 * 24 * 60 * 60 * 1000; // one year in milliseconds
      const isOlderThanOneYear = Date.now() - timestamp > oneYear;

      if (isOlderThanOneYear) {
        localStorage.removeItem('loginDisclaimerApproved');
        initDisclaimerApproval = false;
      } else {
        initDisclaimerApproval = approved;
      }
    }

    setIsDisclaimerApproved(initDisclaimerApproval);
    document.title = `${title} - NCATS Biomedical Data Translator` || "";
  }, [title]);

  const handleDisclaimerClose = () => {
    const cookieName = window.location.pathname.includes("login") ? 'loginDisclaimerApproved' : 'disclaimerApproved';
    const item = JSON.stringify({ approved: true, timestamp: Date.now() });
    localStorage.setItem(cookieName, item);
    setIsDisclaimerApproved(true);
  }

  return (
    <>
      {children}
      <DisclaimerModal
        isOpen={!isDisclaimerApproved}
        onClose={handleDisclaimerClose}
      />
    </>
  )
};

export default Page;
