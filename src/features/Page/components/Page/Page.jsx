import DisclaimerModal from "@/features/Common/components/DisclaimerModal/DisclaimerModal";
import { useDisclaimersApproved } from "@/features/Common/utils/customHooks";

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
