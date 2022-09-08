import React, { useEffect } from "react";
import FAQSidebar from "../FAQSidebar/FAQSidebar";
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
      title: 'How it Works', 
      slug:'how-it-works',
      subArticles: [
        {
          title: 'Knowledge Providers', 
          slug:'knowledge-providers'
        },
        {
          title: 'Autonomous Relay Agents', 
          slug:'autonomous-relay-agents'
        },
        {
          title: 'Autonomous Relay System', 
          slug:'autonomous-relay-system'
        },
        {
          title: 'Knowledge Graphs', 
          slug:'knowledge-graphs'
        },
        {
          title: 'SmartAPI', 
          slug:'smartapi'
        },
      ]
    },
    {
      title: 'Forming a Question', 
      slug: 'forming-a-question',
    },
    {
      title: 'Results', 
      slug:'article-results',
    },
    {
      title: 'Evidence', 
      slug:'evidence'
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