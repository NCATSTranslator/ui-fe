import { useSelector } from 'react-redux';
import { currentRoot } from '../../Redux/rootSlice';
import { Link } from 'react-router-dom';

export const SendFeedbackArticle = () => {
  const root = useSelector(currentRoot);

  return (
    <>
      <p className="caption">Last updated on September 6th, 2022</p>
      <p>To send feedback to the Translator team, please fill out <Link className="link" to={`/${root}?fm=true`} reloadDocument target={'_blank'}>this form</Link>. There are several categories of feedback that you can submit:</p>
      <p><strong>Suggestions</strong> are recommendations for improvements or new features.</p>
      <p><strong>Bug Reports</strong> are a description of an error, issue, or glitch in the Translator interface. You will be asked to include the steps to reproduce the bug. Please be as specific as possible when listing these steps. For example: “I had already run a query (what drugs treat Wilson’s Disease), and I tried running a second query from the results page (what drugs treat Alzheimer's).”</p>
      <p><strong>Other Comments</strong> include generic comments, questions, or observations about Translator. You may also use this category to let us know that you’re interested in getting involved with the Translator program!</p>
      <p>After you have submitted feedback, a Github ticket will be automatically generated for you to view or subscribe to. We invite you to leave additional comments or feedback on your ticket.</p>
    </>
  );
}
