import React, { useEffect } from "react";
import DisclaimerModal from "../Modals/DisclaimerModal";

const Page = (props) => {
  useEffect(() => {
    document.title = props.title || "";
  }, [props.title]);
  return (
    <>
      {props.children}
      <DisclaimerModal></DisclaimerModal>
    </>
  )
};

export default Page;