import { useOutletContext } from "react-router-dom";

export const Help = () => {
  const setFeedbackModalOpen = useOutletContext();

  return (
    <>
      <p className="caption">Last updated on September 6th, 2022</p>
      <br/>
      <h2 className="h6">Will software written as part of this program be open source?</h2>
      <p>Yes. The goal of this programmatic effort is to produce data, software, and tools that are publicly available for users. The Translator Github can be found <a href="https://github.com/NCATSTranslator" target="_blank" rel="noreferrer">here</a>.</p>
      <h2 className="h6">How can I share my results?</h2>
      <p>Click on the purple export icon to the top right of a result list to generate a shareable link to it. You can also generate this link by clicking the same icon next to a result set in your <a href="/history">search history</a>.</p>
      <p style={{textAlign: 'center'}}><img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/RHtDQafKIi6w03dp8ZLn8s6pFIfkdzo31pjJd1spbgb8Wk4jJ0ARyEL2ggdauGiajR8=w2400" alt="Search History"/></p>
      <h2 className="h6">How can I provide feedback?</h2>
      <p>To send feedback to the Translator team, please fill out <button className="link" onClick={()=>{setFeedbackModalOpen(true)}}>this form</button>.</p>
      <h2 className="h6">How is this tool different from a search engine?</h2>
      <p>Translator exposes relationships between concepts that normal search engines can't. If A is related to B and B is related to C, only Translator can display and show evidence for the relationship between A and C through B. Translator can also connect papers that are currently not associated elsewhere.</p>
      <h2 className="h6">What does it mean if a drug “may treat” a disease?</h2>
      <p>Multiple research teams across Translator used different models for predicting what may treat a disease. For example, you may see results that include both drugs that are known to treat symptoms of a disease in addition to those that may treat that disease based on machine learning algorithms and knowledge graph modeling patterns of known treatments.</p>
      <h2 className="h6">Why can I only discover drugs that treat diseases?</h2>
      <p>During the beta phase testing, we selected a single templated query to narrow the focus of the development team and usability testers: what drugs may treat a disease? This question is expected to have broad interest and allow us to understand how people would like to interact with the Translator user interface and the results it returns. Future Translator updates will include additional templated queries and the ability to build custom queries.</p>
      <h2 className="h6">Why do I see multiple entries for the same disease? ex. Alzheimer's, Alzheimer's 1, Alzheimer's 16, etc.</h2>
      <p>We are using the Mondo Disease Ontology to provide possible matches to disease names as they are entered. Mondo was developed to provide a logic-based structure for unifying multiple disease resources. Multiple versions of the same disease mean there are likely similarly named variations of the disease. A list of results for the Alzheimer's example can be found <a href="https://monarchinitiative.org/search/alzheimer's" target="_blank" rel="noreferrer">here</a>.</p>
      <h2 className="h6">Why don't I see any results for my disease?</h2>
      <p>Make sure you have spelled the disease name correctly. There may be no results for your disease, a Mondo identifier might not exist, or it may have an alias unknown to Translator. You can explore the <a href="https://monarchinitiative.org/" target="_blank" rel="noreferrer">Monarch Initiative</a> website to find alternate names for many diseases.</p>
      <h2 className="h6">Are results FDA-approved to treat my disease of interest?</h2>
      <p>No. Drugs marked as FDA-approved are authorized for use in treating a specific disease or condition by the FDA. This does not mean that the FDA has approved these drugs to treat the disease(s) you specified in your search.</p>
    </>
  );
}