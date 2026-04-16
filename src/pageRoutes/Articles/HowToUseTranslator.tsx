import HelpEvidence from "@/assets/images/HelpEvidence.png";
import HelpNewQuery from "@/assets/images/HelpNewQuery.png";
import HelpProjects from "@/assets/images/HelpProjects.png";
import HelpResultsPage from "@/assets/images/HelpResultsPage.png";
import HelpSelectedProject from "@/assets/images/HelpSelectedProject.png";
import { Link } from 'react-router-dom';

export const HowToUseTranslator = () => {
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>

      <h2 className="h6">Submit a Query</h2>

      <p>
        <a href="/account-and-settings">Logged in</a> users can explore biomedical relationships by{' '}
        <a href="/submitting-queries">
          submitting two types of queries
        </a>
        .
      </p>

      <p>
        <strong>Smart Queries</strong> use templated questions to uncover <strong>relationships between diseases, genes, and chemicals</strong>. Select a question, enter and select a search term, and submit the query to view the{' '}
        <a href="/paths-and-graphs">paths</a> that connect your question to your search term.
      </p>

      <p>
        <strong>Pathfinder Queries</strong> find relationships connecting two biomedical entities. Enter and select two search terms to generate all possible{' '}
        <a href="/paths-and-graphs">paths</a> between your search terms. Optionally, you may also include a type of object, such as a drug, disease, or gene, that must be included in all of the paths returned.
      </p>

      <p style={{textAlign: 'center', margin: '30px auto', border: '1px solid #CED0D0', borderRadius: '8px', overflow: 'hidden'}}><img src={HelpNewQuery} alt="Querying interface" style={{display: 'block'}} /></p>

      <h2 className="h6">Load and Sync</h2>

      <p>
        Translator <strong>results are loaded incrementally</strong> because our{' '}
        <Link to="/about-translator#reasoning-agents">reasoning agents</Link> return data at different speeds. When{' '}
        <a href="/loading-and-syncing#syncing">prompted</a>, click <strong>Sync New Results</strong> in the sidebar to refresh the page and view newly available paths and evidence.
      </p>

      <h2 className="h6">Explore Results</h2>

      <p>
        Results are displayed as{' '}
        <a href="/paths-and-graphs">
          paths and graphs
        </a>{' '}
        to help you explore relationships between biomedical entities.
      </p>

      <p>
        <strong>Paths show linear multi-step relationships between your selected question and/or search term(s).</strong>{' '}
        Paths can be direct or indirect, where reasoning agents infer these relationships through intermediary concepts.
      </p>

      <p>
        <strong>Graphs provide a non-linear view of the same data</strong>, revealing patterns and clusters across all relationships.
      </p>

      <p>
        <a href="/sorting-and-filtering">
          <strong>Filters</strong>
        </a>{' '}
        <strong>accessible from the sidebar allow you to refine your results</strong> based on qualities such as FDA approval, chemical classification, biomedical entities within paths, and types of supporting evidence.
      </p>

      <p style={{textAlign: 'center', margin: '30px auto', border: '1px solid #CED0D0', borderRadius: '8px', overflow: 'hidden'}}><img src={HelpResultsPage} alt="Example result set with filters" style={{display: 'block'}} /></p>

      <h2 className="h6">Investigate Evidence</h2>

      <p>
        Every relationship you’ll encounter in result paths is backed by{' '}
        <a href="/relationship-evidence">
          evidence
        </a>{' '}
        collected by Translator’s{' '}
        <Link to="/about-translator#reasoning-agents">reasoning agents</Link>.{' '}
        <strong>Click on the connecting terms between entities</strong> (e.g., “impacts,” “associated with,” “subclass of”) to view supporting evidence, which may include{' '}
        <strong>publications</strong>, <strong>clinical trials</strong>, <strong>miscellaneous data</strong>, and{' '}
        <strong>knowledge sources</strong> that provide the underlying reasoning for the relationship.
      </p>

      <p style={{textAlign: 'center', margin: '30px auto', border: '1px solid #CED0D0', borderRadius: '8px', overflow: 'hidden'}}><img src={HelpEvidence} alt="Evidence supporting a relationship" style={{display: 'block'}} /></p>

      <h2 className="h6">Add Bookmarks and Notes</h2>

      <p>
        <a href="/bookmarks-and-notes">
          Bookmarks and notes
        </a>{' '}
        make it easy to find the results you found most interesting. Click the <strong>bookmark icon</strong> on any result to save it, or use the <strong>note icon</strong> to add comments to it.
      </p>

      <p>
        You can also <strong>filter your results to show only bookmarked results or those with notes</strong> using the sidebar{' '}
        <a href="/sorting-and-filtering">
          <strong>Filters</strong>
        </a>{' '}
        tab.
      </p>

      <p>
        When you’re done adding bookmarks and notes, you can reference them in your{' '}
        <a href="/projects">
          Projects
        </a>{' '}
        or{' '}
        <a href="/query-history">
          Query History
        </a>
        .
      </p>

      <p style={{textAlign: 'center', margin: '30px auto', border: '1px solid #CED0D0', borderRadius: '8px', overflow: 'hidden'}}><img src={HelpSelectedProject} alt="Example project" style={{display: 'block'}} /></p>

      <h2 className="h6">Dive Deeper in Projects</h2>

      <p>
        <strong>Organize and group related queries</strong> with the{' '}
        <a href="/projects-article">
          Projects
        </a>{' '}
        feature. You can populate projects with your past queries or while{' '}
        <a href="/new-query">
          submitting a new one
        </a>
        . Projects also display each query’s{' '}
        <a href="/bookmarks-and-notes#bookmarks">
          bookmarks
        </a>
        ,{' '}
        <a href="/bookmarks-and-notes#notes">
          notes
        </a>
        , and{' '}
        <a href="/loading-and-syncing">
          loading status
        </a>
        , helping you manage your work over time.
      </p>

      <p style={{textAlign: 'center', margin: '30px auto', border: '1px solid #CED0D0', borderRadius: '8px', overflow: 'hidden'}}><img src={HelpProjects} alt="Example list of projects" style={{display: 'block'}} /></p>
    </>
  );
};

