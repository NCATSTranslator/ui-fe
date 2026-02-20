import HelpEdgeDiagram from "@/assets/images/HelpEdgeDiagram.png";
import { Link } from 'react-router-dom';

export const AboutTranslator = () => {
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>

      <h2 className="h6">About Translator</h2>

      <p>
        The Biomedical Data Translator is an open-access research platform that{" "}
        <strong>helps researchers explore relationships between drugs, genes, diseases, and other biomedical entities</strong>.
        Developed by a consortium of scientists, physicians, bioinformaticians, programmers, and funded by the{" "}
        <a href="https://ncats.nih.gov/research/research-activities/translator/about" target="_blank" rel="noreferrer">
          National Center for Advancement of Translational Sciences (NCATS)
        </a>
        , Translator <strong>integrates disparate data sources</strong> and uses{" "}
        <Link to="/about-translator#reasoning-agents">reasoning agents</Link> to reveal both{" "}
        <a href="/paths-and-graphs">direct and inferred relationships</a> that{" "}
        <strong>
          support <a href="/relationship-evidence">evidence-based discovery</a> in translational research
        </strong>
        . The goal of this program is to <strong>accelerate the development of new treatments</strong> and improve disease
        classification by moving beyond symptom-based approaches and towards molecular and cellular-level understanding.
      </p>

      <h2 className="h6">More Than a Search Engine</h2>

      <p>
        While search engines can only retrieve existing information about a single topic,{" "}
        <strong>Translator uses complex logic and reasoning grounded in trusted biomedical data</strong> to identify possible
        relationships between biomedical entities such as drugs, genes, and diseases. These relationships are supported by
        evidence found by Translator’s reasoning agents, derived from accumulated knowledge sources, and
        supported by large data sets or scientific literature. One of the strengths of Translator is the integration of these
        knowledge sources to facilitate <strong>connecting concepts that could not previously be connected in a single place</strong>.
      </p>

      <span className="hash-anchor" id="reasoning-agents"></span>

      <h2 className="h6">Translator’s Reasoning Agents</h2>

      <p>
        Reasoning agents are automated reasoning systems that apply logic and computational techniques to analyze the network
        of relationships found in our interconnected dataset. These systems evaluate existing relationships and use predefined
        rules to infer new insights, often revealing relationships that have not yet been explicitly recorded in the data.
      </p>

      <p>
        Our knowledge sources might contain information that <em>Gene A</em> affects <em>Protein B</em> and <em>Protein B</em>{" "}
        is linked to <em>Disease C</em>. Translator’s reasoning agents can suggest a potential connection between{" "}
        <em>Gene A</em> and <em>Disease C</em> even if no direct connection is recorded in the dataset. By following these
        logical pathways, reasoners can uncover hidden patterns that may lead to new discoveries, allowing researchers to
        generate fresh hypotheses and explore potential breakthroughs from existing data.
      </p>

      <p style={{textAlign: 'center', margin: '30px auto'}}><img src={HelpEdgeDiagram} style={{display: 'block'}} alt="Gene A to Protein B to Disease C indicates an indirect relationship between Gene A and Disease C" /></p>

      <p>Each agent has different methods of reasoning:</p>

      <p>
        <strong>ARAGORN</strong>
        <br />
        ARAGORN reasons over a federated biomedical knowledge graph, ranking and clustering related answers in real time to
        surface the most relevant connections while reconciling detailed data with higher-level, human-interpretable
        explanations.
      </p>

      <p>
        <strong>ARAX Translator Reasoner</strong>
        <br />
        ARAX uses machine learning across a large knowledge graph to use existing biomedical patterns and relationships to
        predict new ones.
      </p>

      <p>
        <strong>BioThings Explorer</strong>
        <br />
        BioThings Explorer reasons by dynamically chaining semantically annotated biomedical web services at query time,
        constructing multi-step graph paths without relying on a centralized knowledge graph.
      </p>

      <p>
        By systematically evaluating pathways and relationships, reasoners help transform known information into new
        knowledge, enhancing biomedical research and supporting scientific discovery.
      </p>

      <h2 className="h6">Articles and News</h2>

      <ul>
        <li>
          <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12241707/" target="_blank" rel="noreferrer">
            Announcing the Biomedical Data Translator: Initial Public Release
          </a>
        </li>
        <li>
          <a href="https://youtu.be/hlh0E8pk8BI?si=AaCR-ByrkES_qCJg&t=1195" target="_blank" rel="noreferrer">The Jorie Effect</a>
        </li>
        <li>
          <a href="https://www.gimopen.org/article/S2949-7744(25)00133-5/fulltext" target="_blank" rel="noreferrer">
            BabyFORce: A pioneering program translating variants identified via rapid genome sequencing to targeted
            therapeutics for neonatal intensive care unit patients
          </a>
        </li>
        <li>
          <a href="https://ncats.nih.gov/news-events/news/NCATS-team-creates-novel-computational-pipeline-find-new-ways-treat-glioblastoma" target="_blank" rel="noreferrer">
            NCATS Team Creates Novel Computational Pipeline to Find New Ways to Treat Glioblastoma
          </a>
        </li>
        <li>
          <a href="https://tracs.unc.edu/index.php/news-articles/2059-biomedical-data-translator-consortium-provides-progress-updates-in-latest-companion-publications" target="_blank" rel="noreferrer">
            Biomedical Data Translator Consortium provides progress updates in latest companion publications
          </a>
        </li>
        <li>
          <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9372428/" target="_blank" rel="noreferrer">
            Progress toward a universal biomedical data translator
          </a>
        </li>
        <li>
          <a href="https://www.statnews.com/2019/07/31/nih-funded-project-aims-to-build-a-google-for-biomedical-data/" target="_blank" rel="noreferrer">
            NIH-Funded Project Aims to Build a ‘Google’ for Biomedical Data
          </a>
        </li>
        <li>
          <a href="https://ascpt.onlinelibrary.wiley.com/doi/10.1111/cts.12595" target="_blank" rel="noreferrer">
            Deconstructing the Translational Tower of Babel
          </a>
        </li>
        <li>
          <a href="https://ascpt.onlinelibrary.wiley.com/doi/full/10.1111/cts.12591" target="_blank" rel="noreferrer">
            Toward A Universal Biomedical Data Translator
          </a>
        </li>
      </ul>

      <h2 className="h6">Get Involved</h2>

      <p>
        Submit{" "}
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSeXeMigLJ4WzUtdSexgk0jBNRX_9J7U3gHyH-gOjh78c1LFeg/viewform" target="_blank" rel="noreferrer">
          this form
        </a>{" "}
        to receive updates, access documentation, participate in training opportunities, and get support from the Translator
        team regarding your research projects or other inquiries.
      </p>

      <h2 className="h6">Funding Information</h2>

      <p>
        This work was supported by the{" "}
        <a href="https://ncats.nih.gov/research/research-activities/translator/about" target="_blank" rel="noreferrer">
          NCATS Biomedical Data Translator Program
        </a>{" "}
        (Other Transaction Awards OT2TR003434, OT2TR003436, OT2TR003428, OT2TR003448, OT2TR003427, OT2TR003430, OT2TR003433,
        OT2TR003450, OT2TR003437, OT2TR003443, OT2TR003441, OT2TR003449, OT2TR003445, OT2TR003422, OT2TR003435, OT3TR002026,
        OT3TR002020, OT3TR002025, OT3TR002019, OT3TR002027, OT2TR002517, OT2TR002514, OT2TR002515, OT2TR002584, OT2TR002520,
        OT2TR005706, OT2TR005710, OTRTR005712, 75N95021P00636, and 75N95024F00144; Contract number 75N95024F00144). Additional
        funding was provided by the Intramural Research Program at NCATS (ZIA TR000276-05).
      </p>
    </>
  );
};

