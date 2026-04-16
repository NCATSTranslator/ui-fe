import { FAQItem } from "@/features/Sidebar/types/sidebar";

export const faqItems: FAQItem[] = [
  {
    id: "search-engine-difference",
    title: "How is this tool different from a search engine?",
    paragraphs: [
      "The Translator UI is a tool designed for the exploration of biomedical knowledge. Unlike search engines which provide an answer based on a topic search, Translator uses reasoning, based on biomedical knowledge, to provide probable answers supported by known evidence. This allows the user to explore the relationships between biomedical concepts.",
      "Given the complexity of the results and the different goals of users, the UI provides multiple ways to sort and filter results to identify those most relevant to a user.",
      "Translator allows reasoning through knowledge graphs and exposes relationships between biomedical concepts. Each relationship has clear evidence and sources that come from accumulated knowledge sources, supported by large data sets or scientific literature. One of the strengths of Translator is the integration of these knowledge sources to facilitate connecting concepts that could not previously be connected in a single place.",
      "Search engines are designed to search for individual terms or sites. Translator is a reasoning engine using graph networks capable of using logic to generate new knowledge.  For example, if A is related to B and B is related to C, Translator not only provides a visual representation of this concept, it also provides an interface to access the evidence available for each 'hop' in the concept chain."
    ]
  },
  {
    id: "what-translator-returns",
    title: "What can I expect Translator to return?",
    paragraphs: [
      "Translator will return a network related to each answer to a query.  These are broken into paths representing the possible logical paths through the network from the result to the target. The relationships shown are always supported by evidence which can be accessed by clicking the lines connecting two concepts.  The interface is designed to enable the exploration of results and evidence in a systematic way."
    ]
  },
  {
    id: "result-path",
    title: "What is a result 'path?'",
    paragraphs: [
      "Translator uses systems biology and knowledge graphs to surface knowledge that may be of interest to the researcher. Paths are individual routes through connecting pieces of data within the knowledge graph that go from the result to the targeted concept. Translator displays evidence (publications and sources) for each connection along the route. Publications are displayed in a table including the relationship that the paper supports. Other sources of evidence have links to wiki or other pages explaining the reasoning behind the connection it is associated with."
    ]
  },
  {
    id: "reasoning-agents",
    title: "What are reasoning agents?",
    paragraphs: [
      { text: "Reasoning agents are an automated reasoning system that apply logic and computational techniques to analyze the network of relationships found in our interconnected dataset. These systems evaluate existing connections and use predefined rules to infer new insights, often revealing relationships that have not yet been explicitly recorded in the data.", anchor: "reasoner" },
      "For example, our knowledge sources might contain information that Drug A interacts with Protein B, and Protein B plays a role in Disease C. Reasoners can suggest a potential link between Drug A and Disease C, even if no direct connection is recorded in the dataset. By following these logical pathways, reasoners can uncover hidden patterns that may lead to new discoveries, allowing researchers to generate fresh hypotheses and explore potential breakthroughs from existing data.",
      "By systematically evaluating pathways and relationships, reasoners help transform known information into new knowledge, enhancing biomedical research and supporting scientific discovery."
    ]
  },
  {
    id: "indirect-paths",
    title: "What are indirect paths?",
    paragraphs: [
      { text: "Indirect paths are identified by reasoning agents that use logic and pattern recognition to uncover inferred links between objects. When two pieces of information aren't directly connected in our database, also called a knowledge graph, these agents look at existing relationships and apply logical rules to suggest possible connections.", anchor: "indirect" },
      "For example, say Gene A affects Protein B, and Protein B is linked to Disease C. Translator reasoners can infer a possible connection between Gene A and Disease C even if no research paper directly states it. These connections are built step by step, and the supporting paths that follow them on the list of paths show the intermediary connections that explain why the objects in the indirect path are associated with each other."
    ]
  },
  {
    id: "evidence-support",
    title: "Is it possible to see the evidence supporting each result?",
    paragraphs: [
      "Yes, Translator provides evidence for every association between two concepts. At the moment Translator is able to distinguish two different types of evidence: publications and knowledge sources.",
      "Click on a relationship to view the evidence supporting it."
    ]
  },
  {
    id: "drug-safety",
    title: "Is it okay to take a commercially available drug that Translator returns as a possible impact for my disease of interest?",
    paragraphs: [
      "No. Translator is designed for research, and the results are for research only.  Only physicians should guide medical care even for over-the-counter medicines."
    ]
  },
  {
    id: "results-timing",
    title: "Why do some results display first? When will I know I have all of the results?",
    paragraphs: [
      "Translator may take up to five minutes to return the results to the user. Five different reasoning engines are employed for each query.  These often vary in the time required to return results.  \"Load new results\" may need to be clicked multiple times to return all of the results.  \"Results Complete\" will be displayed when all of the results have been returned."
    ]
  },
  {
    id: "query-variation",
    title: "I ran the same query a second time, why am I seeing different results?",
    paragraphs: [
      "Translator is not deterministic, meaning there is some randomness in how a query is processed. Usually, similar results will be returned, although Translator is currently under development, and is continuing to integrate new algorithms and additional knowledge sources and evidence."
    ]
  },
  {
    id: "drug-impact",
    title: "What does it mean if a drug 'may impact' a disease?",
    paragraphs: [
      "Translator is designed to help researchers who may be developing treatments for a disease. Different teams across Translator have optimized models for predicting what may impact a disease. For example, results can include those drugs that may impact a disease based on machine learning algorithms and knowledge graph modeling patterns of known treatments. This information can be helpful to researchers who study the disease or want to develop a treatment. It does not mean that the drug will definitely impact the disease. The results should be considered for research only.",
      "The results should be considered for research only."
    ]
  },
  {
    id: "relationship-types",
    title: "Why can I only explore a few different kinds of relationships: drugs/disease, chemicals/genes, etc.?",
    paragraphs: [
      "During the alpha-phase testing, a few limited domains were selected for user exploration based on analysis of researchers' interests, including chemicals, drugs, genes, and diseases. Over time, more domains will be added. These relationships are expected to have broad interest and allow us to understand how people would like to interact with the Translator user interface and the results it returns. Future Translator updates will include additional relationships."
    ]
  },
  {
    id: "illicit-drugs",
    title: "Are there illicit drugs in some results?",
    paragraphs: [
      "Yes. Translator strives to include results based on all available evidence."
    ]
  },
  {
    id: "disease-entries",
    title: "Why do I see multiple entries for the same disease (e.g., Alzheimer's, Alzheimer's 1, Alzheimer's 16, etc.)?",
    paragraphs: [
      "Translator teams use the Mondo Disease Ontology to provide possible matches to disease names as they are entered. Mondo was developed to provide a harmonized hierarchical structure for diseases unifying and curating various disease resources. Results for the diseases higher in the hierarchy can include the children of those terms.  Multiple versions of the same disease mean there are likely similarly named variations of the disease. A list of results for the Alzheimer's example can be found here.",
      "It is generally a safe bet to choose the most general of entries provided."
    ]
  },
  {
    id: "different-disease",
    title: "Why do I see a disease in my results that is different than the one I searched for?",
    paragraphs: [
      "Translator teams use the Mondo Disease Ontology to provide possible matches to disease names as they are entered. Mondo was developed to provide a harmonized hierarchical structure for diseases unifying and curating various disease resources. Results for the diseases higher in the hierarchy can include the children of those terms.  Multiple versions of the same disease mean there are likely similarly named variations of the disease. A list of results for the Alzheimer's example can be found here.",
      "It is generally a safe bet to choose the most general of entries provided."
    ]
  },
  {
    id: "chemical-compounds",
    title: "Why do I get chemicals that are not commercialized compounds?",
    paragraphs: [
      "To enable the discovery of new usages of chemicals, Translator does not constrain the chemical space to drugs or commercialized compounds."
    ]
  },
  {
    id: "share-results",
    title: "How can I share my results?",
    paragraphs: [
      "Click on the \"Share Result Set\" button at the top of the result list to generate a shareable link.",
      "Additionally you can generate a link to a specific result by clicking the share button on an that result."
    ]
  }
];