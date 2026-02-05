import { HelpArticle } from "@/features/Page/types/page";

export const helpArticles: HelpArticle[] = [
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