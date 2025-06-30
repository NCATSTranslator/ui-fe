
export const Aras = () => {
  return (
    <>
      <p className="caption">Last updated on September 6th, 2022</p>
      <p>Autonomous Relay Agents (ARAs) expand upon the knowledge contributed by KPs and use reasoning and inferencing to provide answers to queries. There are six ARAs:</p>
      <h2 className="h6">Ranking Agent</h2>
      <p>The Ranking Agent team created and maintains ARAGORN, a set of tools that provide unified access to multiple operations, including fill/bind/complete, merge answers, edge weighting, and result scoring.</p>
      <h2 className="h6">imProving Agent</h2>
      <p>imProving Agent is an Autonomous Reasoning Agent built on top of the <a href="https://spoke.ucsf.edu/" target="_blank" rel="noreferrer">Scalable Precision Medicine Oriented Knowledge Engine (SPOKE)</a> that aims to improve user queries by utilizing electronic health records and multi-omic cohorts to extract the best knowledge for a given concept.</p>
      <h2 className="h6">Explanatory Agent</h2>
      <p>The Explanatory Agent team utilizes a case-based reasoning approach to execute ARS queries by obtaining results from multiple knowledge providers (KPs) and relies on natural language understanding models to seek explanations in the biomedical literature to rank KP's results.</p>
      <h2 className="h6">Exploring Agent</h2>
      <p>Exploring Agent is responsible for unified querying of the BioThings Explorer APIs. They do this by building a query path plan defining APIs that are relevant to answering the query and by executing the query path plan to retrieve data from the different APIs.</p>
      <h2 className="h6">Expander Agent</h2>
      <p>Expander Agent is a tool for enhancing query graphs. ARAX exposes all graph reasoning capabilities within a domain-specific language: ARAXi. ARAX is a tool for querying, manipulating, filtering, learning on, and exploring biomedical knowledge graphs.</p>
      <h2 className="h6">Unsecret Agent</h2>
      <p>Team Unsecret Agent manages mediKanren, comprised of static knowledge graphs originating from both KPs and Standards and Reference Implementation. mediKanren is a graphical user interface that describes relationships between medical concepts and facilitates simplified data exploration and common queries.</p>
    </>
  );
}