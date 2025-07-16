
export const Kps = () => {
  return (
    <>
      <p className="caption">Last updated on July 16th, 2025</p>
      <p>Knowledge Providers (KPs) supply domain-specific information found from over 250 various knowledge sources, including curated biomedical databases, electronic health records, and machine learning predictions extracted from clinical data. There are eight primary knowledge service providers responsible for exposing several other KPs.</p>
      <h2 className="h6">Clinical Data Provider</h2>
      <p>The Clinical Data Provider team provides access to clinical associations mined from observational EHR data, "drug impacts disease" associations predicted from embeddings generated from clinical data, and clinical drug indications claims.</p>
      <h2 className="h6">Connection Hypotheses Provider</h2>
      <p>The Connections Hypothesis Provider (CHP) aims to leverage clinical data and structured biochemical knowledge to derive a computational representation of pathway structures and molecular components. The goal of creating this representation is to support human and machine-driven interpretation, enable pathway-based biomarker discovery, and aid in the drug development process.</p>
      <h2 className="h6">Exposures Provider</h2>
      <p>The Exposures Provider equips Translator with a framework and evidence to support research on gene x phenotype x environment interactions. The KPs developed by this service provider support open access to clinical data integrated with environmental exposure data. They also provide knowledge on causal mechanistic relationships between genes and biological processes within cells or between chemical exposures and adverse outcomes within humans or other organisms.</p>
      <h2 className="h6">Genetics Data Provider</h2>
      <p>The Genetics Data Provider mines genetic associations to produce relationships between human phenotypes and genes or pathways. These relationships are identified via genes nearby a genome-wide association study (GWAS), genes with an enhancer overlapping a GWAS, and predictive methods that link a GWAS association to a gene. The Genetics Data Provider also leverages APIs that produce gene-pathway relationships.</p>
      <h2 className="h6">Molecular Data Provider</h2>
      <p>The Molecular Data Provider, also known as MolePro, is a knowledge-centric data provider for systems chemical biology. MolePro aims to integrate data sources without bias and provide a curated, unified framework for chemical entities to deepen the understanding of target biology.</p>
      <h2 className="h6">Multiomics Data Provider</h2>
      <p>The Multiomics Provider is focused on using the multi-omics data from Cancer and Healthy samples to understand the gene-gene interactions, gene regulatory network, and molecular feature-dependent drug response from various levels of data. This provider uses the Wellness data to determine significant associations between clinical labs, proteins, and metabolites in a cohort of largely well individuals and uses electronic health records data to understand risk factors for different types of disease.</p>
      <h2 className="h6">Service Data Provider</h2>
      <p>The Service Provider team provides a set of knowledge source APIs and a software stack to quickly turn any newly-identified knowledge source into a KP. They focus on knowledge source ingestion and keep KPs up-to-date.</p>
      <h2 className="h6">Text Mining Provider</h2>
      <p>The Text Mining Provider aims to provide up-to-date, Biolink-compatible, knowledge graphs (KGs) composed of assertions mined from the available biomedical literature. They are responsible for a KG that displays the co-occurrence of ontology concepts and the links between them, such as in the same sentence or abstract. This provider also creates a KG composed of text-mined assertions where ontology concepts and explicit BioLink relations between the two.</p>
    </>
  );
}