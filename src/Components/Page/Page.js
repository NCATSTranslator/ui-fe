import React, { useEffect } from "react";
import DisclaimerModal from "../Modals/DisclaimerModal";

const Page = (props) => {
  useEffect(() => {
    document.title = props.title || "";
  }, [props.title]);
  return (
    <>
      <h1 className='page-title h5'>
        {props.title}
      </h1>
      {props.children}
      <DisclaimerModal></DisclaimerModal>
    </>
  )
};

export default Page;