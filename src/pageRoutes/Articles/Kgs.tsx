
export const Kgs = () => {
  return (
    <>
      <p className="caption">Last updated on September 6th, 2022</p>
      <p>Within clinical, biomedical, and translational science, an increasing number of projects are adopting graphs for knowledge representation. Graph-based data models such as knowledge graphs (KGs) elucidate the interconnectedness between core biomedical concepts, enable data structures to be easily updated, and support intuitive queries, visualizations, and inference algorithms. In a KG, entities or data types are represented as nodes and connected to each other by edges with predicates that describe the relationship between entities. A “schema” is used to constrain the KG by specifying how knowledge can be represented; as such, it provides a framework for validating specific instances of knowledge representation through rules that dictate the syntax and semantics. KGs allow users to pose questions that can then be translated into query graphs and applied to identify subgraphs within the KG that match the general structure of the query graph, thereby producing answers to user queries and generating new knowledge.</p>
      <h2 className="h6">Why does Translator use knowledge graphs?</h2>
      <p>The Translator Consortium has adopted a federated KG-based approach for biomedical knowledge representation and discovery. Using KGs enables Translator to integrate a wide range of heterogeneous data sets and translate them into insights intended to augment human reasoning and accelerate translational science.</p>
      <h2 className="h6">What is the Biolink Model?</h2>
      <p>Within clinical, biomedical, and translational science, an increasing number of projects are adopting graphs for knowledge representation. Graph-based data models elucidate the interconnectedness among core biomedical concepts, enable data structures to be easily updated, and support intuitive queries, visualizations, and inference algorithms. However, knowledge discovery across these “knowledge graphs” (KGs) has remained difficult. The lack of a universally accepted, open-access model for standardization across biomedical KGs has left the task of reconciling data sources to downstream consumers.</p>
      <p>Biolink Model is an open-source data model that can be used to formalize the relationships between data structures in translational science. It incorporates object-oriented classification and graph-oriented features. The core of the model is a set of hierarchical, interconnected classes (or categories) and relationships between them (or predicates) representing biomedical entities such as genes, diseases, chemicals, anatomic structures, and phenotypes. The model provides class and edge attributes and associations that guide how entities should relate to one another.</p>
      <p>The Biolink Model was built with the aim of being:</p>
      <ul>
        <li>A bridge between labeled property graphs and edge labeled graphs</li>
        <li>A formal representation where the semantics are well-defined within the model</li>
        <li>Focused on schemas and their semantics instead of the limitations of technology</li>
        <li>Extensible, self-documenting, and unambiguous</li>
        <li>A map to external ontologies, thesauri, controlled vocabularies, and taxonomies</li>
      </ul>
      <p>Biolink Model uses <a href="https://github.com/linkml" target="_blank" rel="noreferrer">linkML</a> to facilitate the authoring of schemas that describe data structure in the data-serialization language YAML. It is also used for working with and validating data in a variety of formats, such as JSON, RDF, and TSV.</p>
      <p>You can learn more about the Biolink Model <a href="https://ascpt.onlinelibrary.wiley.com/doi/10.1111/cts.13302" target="_blank" rel="noreferrer">here</a>.</p>
      <h2 className="h6">What role does the Biolink Model play in Translator?</h2>
      <p>The Translator Consortium uses the Biolink Model as an upper-level graph-oriented universal schema that supports semantic harmonization and reasoning across diverse Translator knowledge sources. In order to interoperate between knowledge sources and reason across KGs, the Biolink Model was adopted by Translator as the common dialect to provide rich annotation metadata to the nodes and edges in disparate graphs, thus enabling queries over the entire Translator KG ecosystem, despite incompatibilities in the underlying data sources. The result is a federated, harmonized ecosystem that supports advanced reasoning and inference to derive biomedical insights based on user queries.</p>
      <h2 className="h6">Translator Reasoner API (TRAPI)</h2>
      <p>The Translator Reasoner API (TRAPI) defines a standard HTTP API for communicating biomedical questions and answers. It leverages the <a href="https://github.com/biolink/biolink-model/" target="_blank" rel="noreferrer">Biolink model</a> to precisely describe the semantics of biological entities and relationships. TRAPI's graph-based query-knowledge-binding structure enables expressive yet concise description of biomedical questions and answers. </p>
    </>
  );
}