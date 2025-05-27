import DisclaimerModal from "../Modals/DisclaimerModal";
import { useDisclaimersApproved } from "../../Utilities/customHooks";

const Page = ({ title, children }) => {

  const [isDisclaimerApproved, setIsDisclaimerApproved] = useDisclaimersApproved(title);

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
