import { FC, ReactNode, useEffect, useCallback } from "react";
import FAQSidebar from "@/features/Page/components/FAQSidebar/FAQSidebar";
import DisclaimerModal from "@/features/Common/components/DisclaimerModal/DisclaimerModal";
import { useDisclaimersApproved } from "@/features/Common/hooks/customHooks";
import styles from './FAQPage.module.scss';
import { FAQArticle } from "@/features/Page/types/page";

export interface FAQPageProps {
  title: string;
  children: ReactNode;
}

const FAQPage: FC<FAQPageProps> = ({ title, children }) => {

  const [isDisclaimerApproved, setIsDisclaimerApproved] = useDisclaimersApproved(title);

  const handleDisclaimerClose = useCallback(() => {
    try {
      const cookieName = window.location.pathname.includes("login") 
        ? 'loginDisclaimerApproved' 
        : 'disclaimerApproved';
      
      const item = JSON.stringify({ 
        approved: true, 
        timestamp: Date.now() 
      });
      
      localStorage.setItem(cookieName, item);
      setIsDisclaimerApproved(true);
    } catch (error) {
      console.error('Error saving disclaimer approval:', error);
      setIsDisclaimerApproved(true);
    }
  }, [setIsDisclaimerApproved]);

  const articles: FAQArticle[] = [
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
      slug:'send-feedback-help'
    },
    {
      title: 'Security and Privacy', 
      link:'https://ncats.nih.gov/privacy'
    },
  ];

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
      <DisclaimerModal
        isOpen={!isDisclaimerApproved}
        onClose={handleDisclaimerClose}
      />
    </>
  );
};

export default FAQPage; 