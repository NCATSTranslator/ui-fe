import React, { useEffect } from "react";
import FAQSidebar from "../FAQ/FAQSidebar";
import DisclaimerModal from "../Modals/DisclaimerModal";
import styles from './FAQPage.module.scss';

const FAQPage = ({title, children}) => {

  const articles = [
    {
      title: 'Frequestly Asked Questions', 
      slug:'help'
    },
    {
      title: 'About Translator', 
      slug:'about-translator',
      subArticles: [
        {
          title: 'What is Translational Science?', 
          slug:'what-is-translational-science'
        },
        {
          title: 'The National Center for Advancing Translational Sciences', 
          slug:'national-center'
        },
        {
          title: 'Affiliated Organizations OR Funding Information', 
          slug:'affiliates-or-funding'
        },
      ]
    },
    {
      title: 'How it Works', 
      slug:'how-it-works',
      subArticles: [
        {
          title: 'Knowledge Providers', 
          slug:'kps'
        },
        {
          title: 'Autonomous Relay Agents', 
          slug:'aras'
        },
        {
          title: 'Autonomous Relay System', 
          slug:'ars'
        },
      ]
    },
    {
      title: 'Results', 
      slug:'article-results',
      subArticles: [
        {
          title: 'Evidence', 
          slug:'evidence'
        },
      ]
    },
  ]

  useEffect(() => {
    document.title = title || "";
  }, [title]);



  return (
    <>
      <div className={`container ${styles.faqContainer}`}>
        <FAQSidebar articles={articles} />
        <div className="right">
          <h1 className="h5">{title}</h1>
          {children}
        </div>
      </div>
      <DisclaimerModal></DisclaimerModal>
    </>
  )
};

export default FAQPage;