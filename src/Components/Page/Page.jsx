import { useEffect } from "react";
import DisclaimerModal from "../Modals/DisclaimerModal";

const Page = ({title, children}) => {
  useEffect(() => {
    document.title = `${title} - NCATS Biomedical Data Translator`|| "";
  }, [title]);
  return (
    <>
      {children}
      <DisclaimerModal></DisclaimerModal>
    </>
  )
};

export default Page;