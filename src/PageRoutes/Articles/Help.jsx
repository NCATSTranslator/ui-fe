import { Link } from "react-router-dom";
import shareImage from '../../Assets/Images/share.png';

export const Help = () => {

  return (
    <>
      <p className="caption">Last updated on September 8th, 2023</p>
      <h2 className="h6">How is this tool different from a search engine?</h2>
      <p>The Translator UI is a tool designed for the exploration of biomedical knowledge. Unlike search engines which provide an answer based on a topic search, Translator uses reasoning, based on biomedical knowledge, to provide probable answers supported by known evidence. This allows the user to explore the relationships between biomedical concepts.</p>
      <p>Given the complexity of the results and the different goals of users, the UI provides multiple ways to sort and filter results to identify those most relevant to a user.</p>
      <p>Translator allows reasoning through knowledge graphs and exposes relationships between biomedical concepts. Each relationship has clear evidence and sources that come from accumulated knowledge sources, supported by large data sets or scientific literature. One of the strengths of Translator is the integration of these knowledge sources to facilitate connecting concepts that could not previously be connected in a single place.</p>
      <p>Search engines are designed to search for individual terms or sites. Translator is a reasoning engine using graph networks capable of using logic to generate new knowledge.  For example, if A is related to B and B is related to C, Translator not only provides a visual representation of this concept, it also provides an interface to access the evidence available for each 'hop' in the concept chain.</p>
      
      <h2 className="h6">What can I expect Translator to return?</h2>
      <p>Translator will return a network related to each answer to a query.  These are broken into paths representing the possible logical paths through the network from the result to the target. The relationships shown are always supported by evidence which can be accessed by clicking the lines connecting two concepts.  The interface is designed to enable the exploration of results and evidence in a systematic way.</p>
      
      <h2 className="h6">What is a result "path"?</h2>
      <p>Translator uses systems biology and knowledge graphs to surface knowledge that may be of interest to the researcher. Paths are individual routes through connecting pieces of data within the knowledge graph that go from the result to the targeted concept. Translator displays evidence (publications and sources) for each connection along the route. Publications are displayed in a table including the relationship that the paper supports. Other sources of evidence have links to wiki or other pages explaining the reasoning behind the connection it is associated with.</p>

      <h2 className="h6">Is it possible to see the evidence supporting each result?</h2>
      <p>Yes, Translator provides evidence for every association between two concepts. At the moment Translator is able to distinguish two different types of evidence: publications and knowledge sources. </p>
      
      <h2 className="h6">Is it okay to take a commercially available drug that Translator returns as a possible treatment for my disease of interest?</h2>
      <p>No. Translator is designed for research, and the results are for research only.  Only physicians should guide medical care even for over-the-counter medicines.</p>

      <h2 className="h6">Why do some results display first? When will I know I have all of the results?</h2>
      <p>Translator may take up to five minutes to return the results to the user. Five different reasoning engines are employed for each query.  These often vary in the time required to return results.  "Load new results" may need to be clicked multiple times to return all of the results.  "Results Complete" will be displayed when all of the results have been returned.</p>
      
      <h2 className="h6">I ran the same query a second time, why am I seeing different results?</h2>
      <p>Translator is not deterministic, meaning there is some randomness in how a query is processed. Usually, similar results will be returned, although Translator is currently under development, and is continuing to integrate new algorithms and additional knowledge sources and evidence.</p>
     
      <h2 className="h6">What does it mean if a drug "may treat" a disease?</h2>
      <p>Translator is designed to help researchers who may be developing treatments for a disease. Different teams across Translator have optimized models for predicting what may treat a disease. For example, results can include those drugs that may treat a disease based on machine learning algorithms and knowledge graph modeling patterns of known treatments. This information can be helpful to researchers who study the disease or want to develop a treatment. It does not mean that the drug will definitely treat the disease. <strong>The results should be considered for research only.</strong></p>

      <h2 className="h6">Why can I only explore a few different kinds of relationships: drugs/disease, chemicals/genes, etc.?</h2>
      <p>During the alpha-phase testing, a few limited domains were selected for user exploration based on analysis of researchers' interests, including chemicals, drugs, genes, and diseases. Over time, more domains will be added. These relationships are expected to have broad interest and allow us to understand how people would like to interact with the Translator user interface and the results it returns. Future Translator updates will include additional relationships.</p>
      
      <h2 className="h6">Are there illicit drugs in some results?</h2>
      <p>Yes. Translator strives to include results based on all available evidence.</p>

      <h2 className="h6">Why do I see multiple entries for the same disease (e.g., Alzheimer's, Alzheimer's 1, Alzheimer's 16, etc.)?</h2>
      <p>Translator teams use the Mondo Disease Ontology to provide possible matches to disease names as they are entered. Mondo was developed to provide a harmonized hierarchical structure for diseases unifying and curating various disease resources. Results for the diseases higher in the hierarchy can include the children of those terms.  Multiple versions of the same disease mean there are likely similarly named variations of the disease. A list of results for the Alzheimer's example can be found here.</p>
      <p>It is generally a safe bet to choose the most general of entries provided.</p>

      <h2 className="h6">How can I share my results?</h2>
      <p>Click on the purple export icon to the top right of a result list to generate a shareable link to it. You can also generate this link by clicking the same icon next to a result set in your <a href="/history">search history</a>.</p>
      
      <h2 className="h6">Why do I see a disease in my results that is different than the one I searched for?</h2>
      <p>Translator uses the <a href="http://obofoundry.org/ontology/mondo.html" target="_blank" rel="noreferrer">Mondo Disease Ontology</a> which has a hierarchical structure. This means that certain terms have a 'parent/child' relationship.  A parent term is more general, and a child term is more specific.  For example, 'diabetes mellitus' is a child (or subtype) of 'endocrine pancreas disease' and a parent of 'type 1 diabetes mellitus.' When working with diseases in Translator, it may be assumed that if there is a relationship with the parent term, then the relationship also exists with the children of that term.  As such, if a user selects 'diabetes mellitus' in the query, there will likely be results related to 'type 1 diabetes' as well as the other children of that term.  For more information on the disease terms and their hierarchy go to <a href="https://next.monarchinitiative.org/" target="_blank" rel="noreferrer">https://next.monarchinitiative.org/</a>.</p>
      
      <h2 className="h6">What if I cannot find my disease of interest in order to search for drugs that may treat it?</h2>
      <p>Make sure the disease name is spelled correctly. A Mondo identifier might not exist, or it may have an alias unknown to Translator. Consider exploring the <a href="https://monarchinitiative.org/" target="_blank" rel="noreferrer">Monarch Initiative</a> website to find alternate names for many diseases.</p>
      
      <h2 className="h6">What do different categories of drugs mean?</h2>
      <p>'Drugs' include any chemical or biologic where Translator has identified an FDA approval status indicating it can be marketed for its indicated treatment. Categories of drugs are also included (e.g., neuroprotective agents, antioxidants, etc.). This category does not mean that the drug has been tested for the disease that was searched.</p>
      <p>'Phase 1-3 Drugs' are chemical or biologics that are currently in clinical trials and have not been FDA approved previously.</p>
      <p>'Other' includes all other chemicals and may include those available over the counter and not regulated by the FDA. This may include chemicals with little known about them or dietary supplements.</p>

      <h2 className="h6">Why do I get chemicals that are not commercialized compounds?</h2>
      <p>To enable the discovery of new usages of chemicals, Translator does not constrain the chemical space to drugs or commercialized compounds.</p>
      
      <h2 className="h6">How can I share my results?</h2>
      <p>Click on the purple export icon to the top right of a result list to generate a shareable link. This link can also be generated by clicking the same icon next to a result set in <Link to={`/history`}>search history</Link>.</p>
      <p style={{textAlign: 'center'}}><img src={shareImage} alt="example screenshot showing export button on results page" /></p>

    </>
  );
}