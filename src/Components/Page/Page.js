import React, { useEffect } from "react";

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
    </>
  )
};

export default Page;