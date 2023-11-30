import { useEffect, useState } from "react";
import DisclaimerModal from "../Modals/DisclaimerModal";

const Page = ({title, children}) => {

  const disclaimerApproved = JSON.parse(localStorage.getItem('disclaimerApproved'));
  const loginDisclaimerApproved = JSON.parse(localStorage.getItem('loginDisclaimerApproved'));
  const path = window.location.pathname;
  const initDisclaimerApproval = (path.includes('login') ? loginDisclaimerApproved : disclaimerApproved);
  const [isDisclaimerApproved, setIsDisclaimerApproved] = useState(initDisclaimerApproval);

  useEffect(() => {
    document.title = `${title} - NCATS Biomedical Data Translator`|| "";
  }, [title]);

  const handleDisclaimerClose = () => {
    let cookieName;
    if(path.includes("login"))
      cookieName = 'loginDisclaimerApproved';
    else 
      cookieName = 'disclaimerApproved';

    localStorage.setItem(cookieName, true);
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