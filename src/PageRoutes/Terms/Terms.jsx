import React from "react";
import { useOutletContext } from "react-router-dom";

const Terms = () => {
  const setFeedbackModalOpen = useOutletContext();

  return (
    <div className={`container`}>
      <h1 className="h5">Terms of Use</h1>
      <p className="caption">Last updated on September 6th, 2022</p>
      <p>The Biomedical Data Translator was built to help biomedical researchers explore the knowledge found in many data sources and aid these researchers in generating new hypotheses. This system is for research purposes and is not meant to be used by clinical service providers in the course of treating patients. Note that there is no expectation that results from queries you run will be retained for future use at this time. This system is in a beta testing stage, so bugs and errors will not be uncommon, and we ask that you provide feedback through the feedback form <button className="link" onClick={()=>{setFeedbackModalOpen(true)}}>here</button>.</p>
    </div>
  );
}

export default Terms;