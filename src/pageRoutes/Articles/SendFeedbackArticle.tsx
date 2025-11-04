import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';

export const SendFeedbackArticle = () => {
  const {togglePanel} = useSidebar();
  return (
    <>
      <p className="caption">Last updated on July 16th, 2025</p>
      <p>To send feedback to the Translator team, please fill out <span className="link" onClick={()=>togglePanel('feedback')}>this form</span>. There are several categories of feedback that you can submit:</p>
      <p><strong>Suggestions</strong> are recommendations for improvements or new features.</p>
      <p><strong>Bug Reports</strong> are a description of an error, issue, or glitch in the Translator interface. You will be asked to include the steps to reproduce the bug. Please be as specific as possible when listing these steps. For example: “I had already run a query (what drugs may impact Wilson's Disease), and I tried running a second query from the results page (what drugs may impact Alzheimer's).”</p>
      <p><strong>Other Comments</strong> include generic comments, questions, or observations about Translator. You may also use this category to let us know that you're interested in getting involved with the Translator program!</p>
      <p>After you have submitted feedback, a Github ticket will be automatically generated for you to view or subscribe to. We invite you to leave additional comments or feedback on your ticket.</p>
    </>
  );
}
