import { Link } from 'react-router-dom';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';

export const FrequentlyAskedQuestions = () => {
  const { togglePanel } = useSidebar();
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>

      <h2 className="h6">What does it mean for a drug to impact a disease?</h2>
      <p>
        Translator is designed to help researchers who may be developing treatments for a disease, so the
        Translator team has optimized models for predicting what may impact a disease. For example, results
        can include drugs that may impact a disease based on <strong>machine learning algorithms</strong> and{" "}
        <strong>knowledge graph modeling patterns of known treatments</strong>. This does not mean that the
        drug will definitely impact the disease. <strong>Translator results should be considered for research only.</strong>
      </p>

      <h2 className="h6">
        Should I start taking a drug that Translator identified as possibly impacting a disease I have?
      </h2>
      <p>
        <strong>No.</strong> Translator results are designed for <strong>research purposes only</strong>. Only
        your physician should guide your medical care, even for commercially available over-the-counter
        medicines.
      </p>

      <h2 className="h6">What do different categories of drugs mean?</h2>
      <p>
        <strong>Drugs</strong> include any chemical or biologic where Translator has identified an FDA
        approval status indicating it can be <strong>marketed for its indicated treatment</strong>. This does
        not mean that the drug has been tested for the disease that was searched.
      </p>
      <p>
        <strong>Phase 1-3 Drugs</strong> are chemical or biologics that are currently in clinical trials and
        have <strong>not been FDA approved</strong> previously.
      </p>
      <p>
        <strong>Other</strong> includes all other chemicals, as well as those{" "}
        <strong>available over the counter</strong> and not regulated by the FDA. This may include chemicals
        with little known about them or dietary supplements.
      </p>

      <span className="hash-anchor" id="scores"></span>

      <h2 className="h6">How are result scores calculated?</h2>
      <p>
        Result scores range from 0.00 – 5.00 and reflect a combined assessment of{" "}
        <strong>confidence, clinical evidence, and novelty</strong>; higher scores indicate stronger overall
        support. Scores help you quickly identify <strong>high-confidence results</strong> that are most
        likely to be meaningful.
      </p>
      <p>
        Scores are unavailable when results are still{" "}
        <Link to="/loading-and-syncing#loading">loading</Link>. Once the results are fully loaded, you can{" "}
        <Link to="/loading-and-syncing#syncing">sync</Link> them to view scores.
      </p>

      <h2 className="h6">Can I export results?</h2>
      <p>
        Yes, all of the data and relationships in your result set can be downloaded for further analysis. You
        can export either a JSON or CSV of all results from a query, only the results that remain after
        applying filters, or just your bookmarked results.
      </p>

      <h2 className="h6">Why are genes and proteins conflated?</h2>
      <p>
        Translator treats genes and their resulting proteins as single entities to{" "}
        <strong>simplify relationships within its knowledge graph</strong>. Without this conflation, paths
        that link genes to functions would <strong>require an additional intermediary relationship</strong>{" "}
        (from gene to protein to function) that adds unnecessary complexity.
      </p>
      <p>
        While differentiating between genes and proteins might be more precise from a biological perspective,
        simplifying them allows for more <strong>efficient investigation into biological mechanisms</strong>.
      </p>

      <h2 className="h6">
        Why do I see a disease in my results that is different from the one I searched for?
      </h2>
      <p>
        Translator uses the{" "}
        <a href="http://obofoundry.org/ontology/mondo.html" target="_blank" rel="noreferrer">
          Mondo Disease Ontology
        </a>{" "}
        hierarchical structure to ensure harmonized disease classification. This means that{" "}
        <strong>certain terms have a parent/child relationship</strong> where a parent term is more general
        and a child term is more specific. For example, <em>Diabetes Mellitus</em> is a child (or subtype) of{" "}
        <em>Endocrine Pancreas Disease</em> while also being a parent of <em>Type 1 Diabetes Mellitus</em>.
      </p>
      <p>
        Translator reasoners infer that{" "}
        <strong>relationships to parent terms likely also exist with their children</strong>. Results for
        diseases higher in the hierarchy may include the children of those terms. For more information on
        disease terms and their hierarchy, please visit the{" "}
        <a href="https://next.monarchinitiative.org/" target="_blank" rel="noreferrer">
          Monarch Initiative
        </a>
        .
      </p>

      <h2 className="h6">Why am I seeing different results after submitting the same query twice?</h2>
      <p>
        Translator is not deterministic, meaning there is some randomness in how a query is processed.
        Usually, <strong>similar results will be returned</strong>, although{" "}
        <strong>Translator is currently under development</strong>, and is continuing to integrate new
        algorithms and additional knowledge sources and evidence.
      </p>

      <h2 className="h6">How long are my queries stored?</h2>
      <p>
        Queries are retained in our system indefinitely, making it possible to return to a query via a link or
        the user interface long after it was submitted. Even if you remove a query from your{" "}
        <a href="/projects-article">Projects</a> or{" "}
        <a href="/query-historty-article">Query History</a>, its results remain accessible through any links
        you’ve already generated.
      </p>

      <h2 className="h6">
        Why are the types of queries and relationships I can explore with Translator so limited?
      </h2>
      <p>
        During the alpha-phase testing, a few limited domains were selected for user exploration based on
        researcher interests, including chemicals, drugs, genes, and diseases.{" "}
        <strong>Over time, more domains and additional relationships will be added.</strong> These
        relationships are expected to have broad interest and allow us to understand how people would like to
        interact with the Translator user interface and the results it returns.
      </p>
      <p>
        <strong>We invite you to </strong>
        <a href="#" onClick={(e) => { e.preventDefault(); togglePanel('feedback'); }}>Send Feedback</a>
        <strong> if there are queries you would like to submit on Translator!</strong>
      </p>

      <h2 className="h6">Where does my feedback go?</h2>
      <p>
        When you submit feedback using the <a href="#" onClick={(e) => { e.preventDefault(); togglePanel('feedback'); }}>Send Feedback</a> form in the sidebar, your comments
        are <strong>stored in a private repository</strong> used solely by the Translator team. Feedback is
        not shared outside this team unless required for maintenance, security, or by law. Your feedback is
        extremely valuable to us, and we welcome you to send as much feedback as you’d like to{" "}
        <strong>help us improve Translator</strong>!
      </p>
    </>
  );
};

