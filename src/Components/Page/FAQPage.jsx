import React, { useEffect } from "react";
import FAQSidebar from "../FAQSidebar/FAQSidebar";
import DisclaimerModal from "../Modals/DisclaimerModal";
import styles from './FAQPage.module.scss';

const FAQPage = ({title, children}) => {

  const articles = [
    {
      title: 'About Translator', 
      link:'https://ncats.nih.gov/translator/about',
      subArticles: [
        {
          title: 'What is Translational Science?', 
          link: 'https://ncats.nih.gov/training-education/translational-science-principles',
        },
        {
          title: 'The National Center for Advancing Translational Sciences', 
          link: 'https://ncats.nih.gov/about'
        },
        {
          title: 'Funding Information', 
          slug: 'funding-information'
        },
      ]
    },
    {
      title: 'Logging In', 
      slug: 'logging-in',
    },
    {
      title: 'Overview', 
      slug: 'overview',
    },
    {
      title: 'Exploring Relationships', 
      slug: 'exploring-relationships',
    },
    {
      title: 'Review and Identify Favorite Results', 
      slug: 'review-and-identify',
    },
    {
      title: 'Workspace', 
      slug: 'workspace-help',
    },
    {
      title: 'User Preferences', 
      slug: 'user-preferences',
    },
    {
      title: 'Frequently Asked Questions', 
      slug:'help'
    },
    {
      title: 'Search History', 
      slug:'search-history'
    },
    {
      title: 'Send Feedback', 
      slug:'send-feedback'
    },
    {
      title: 'Security and Privacy', 
      link:'https://ncats.nih.gov/privacy'
    },
  ]

  useEffect(() => {
    document.title = title || "";
  }, [title]);



  return (
    <>
      <div className={`container faq-container ${styles.faqContainer}`}>
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