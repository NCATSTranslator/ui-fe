import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';

export const SubmittingQueries = () => {
  const { togglePanel } = useSidebar();
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>

      <p>
        Translator supports two types of queries that help you explore biomedical relationships across drugs,
        chemicals, genes, and diseases. You can submit a query from the{" "}
        <a href="/">home page</a> or by clicking on the sidebar <a href="/new-query">New Query tab</a>.
      </p>

      <p>
        Please let us know about any additional query types you might need to support your research by{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); togglePanel('feedback'); }}>sending us feedback</a>!
      </p>

      <h2 className="h6">Smart Queries</h2>

      <p>
        Smart Queries provide results based on a set of templated questions that correspond with disease, gene, or
        chemical search terms.
      </p>

      <ul>
        <li>
          Use the dropdown menu in the query bar to <strong>select a question</strong> and relationship to explore. The
          currently supported questions are:
          <ul>
            <li>
              What <em>drugs</em> may impact a <em>disease</em>?
            </li>
            <li>
              What <em>chemicals</em> may (positively/negatively) impact a <em>gene</em>?
            </li>
            <li>
              What <em>genes</em> may be (positively/negatively) impacted by a <em>chemical</em>?
            </li>
          </ul>
        </li>
        <li>
          Enter a <strong>search term</strong> (either a disease, gene, or chemical) and select the closest match from
          the search suggestions.
        </li>
        <li>
          Click the <strong>submit</strong> button to run the query and view the corresponding drug, chemical, or gene
          results.
        </li>
      </ul>

      <p>
        Based on the queries above, entering a disease search term will return a list of drugs. For gene or chemical
        search terms, the results will be a list of chemicals or genes, respectively.
      </p>

      <h2 className="h6">Pathfinder Queries</h2>

      <p>Pathfinder Queries allow you to explore how two biomedical entities might be connected.</p>

      <ul>
        <li>
          Enter <strong>two search terms</strong> (such as a gene and a disease, or two chemicals).
        </li>
        <li>
          Optionally, add a <strong>middle node</strong> type (such as a gene or chemical) that must appear in all
          resulting paths.
        </li>
        <li>
          Click the <strong>submit</strong> button and view all possible paths through which your selected terms are
          connected.
        </li>
      </ul>

      <h2 className="h6">Tips for Entering Search Terms</h2>

      <p>
        <strong>Diseases &amp; Phenotypes</strong><br />
        If you see multiple versions of a disease while entering a search term, it is likely due to Translator’s use of
        the{" "}
        <a href="http://obofoundry.org/ontology/mondo.html" target="_blank" rel="noreferrer">Mondo Disease Ontology</a> and{" "}
        <a href="https://hpo.jax.org/" target="_blank" rel="noreferrer">Human Phenotype Ontology</a> hierarchical structures to provide possible matches
        to disease and phenotype names as they are entered. Multiple versions of the same disease mean there are likely
        similarly named variations of the disease, and it is generally a safe bet to choose the most general of entries
        provided.
      </p>

      <p>
        If you are unable to find a particular disease while trying to submit a query, first double check the spelling
        of the disease. Then, consider exploring the{" "}
        <a href="https://monarchinitiative.org/" target="_blank" rel="noreferrer">Monarch Initiative</a> website to find alternate names for diseases;
        it’s possible that a{" "}
        <a href="http://obofoundry.org/ontology/mondo.html" target="_blank" rel="noreferrer">Mondo Disease Ontology</a> identifier might not exist for
        the disease or that it may have an alias unknown to Translator.
      </p>

      <p>
        <strong>Genes</strong><br />
        Search by gene symbol or alias for the best results. Most available data is human-specific, but some
        relationships may connect human gene terms to other species via natural language processing. If a gene does not
        seem to be associated with a particular species, assume that it is a human gene.
      </p>

      <p>
        <strong>Chemicals</strong><br />
        Search for drug brand names or chemical names. If you don’t see a match with one format, try the other. To
        enable the discovery of new usages of chemicals, Translator does not constrain the chemical space to drugs or
        commercialized compounds.
      </p>

      <p>
        Because Translator strives to include results based on all available evidence, you may also encounter illicit
        drugs while entering search terms or while viewing your results.
      </p>
    </>
  );
};

