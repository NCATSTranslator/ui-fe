
export const SmartAPI = () => {
  return (
    <>
      <p className="caption">Last updated on September 6th, 2022</p>
      <p>Translator ARAs and KPs register their TRAPI compliant endpoints in the <a href="https://smart-api.info/portal/translator?tags=translator" target="_blank" rel="noreferrer">SmartAPI registry</a>, which enables discoverability and compliance tracking for the Translator ecosystem. The SmartAPI Meta Knowledge Graph (Meta-KG) represents how biomedical concepts can be connected through APIs. Each node in the meta-KG represents a biolink entity type, e.g. Gene, SequenceVariant, ChemicalSubstance. Each edge in the meta-KG represents a unique combination of a biolink predicate, e.g. targets, treats, and an API which delivers the association.</p>
      <p>The Meta-KG is constructed using the collection of SmartAPI specifications currently registered in SmartAPI. All APIs registered with <a href="https://x-bte-extension.readthedocs.io/" target="_blank" rel="noreferrer">x-bte</a> field will be integrated into the meta-KG. In addition, all ReasonerStdAPIs registered in SmartAPI and implemented the /predicate endpoint will also be integrated.</p>
      <p>With Meta-KG, you can traverse a complex network of connected KP APIS and search APIs based on meta-kg operations (API endpoints that fetch results given a desired output, input, predicate or any combination of them). Meta-KG would then find all connections with predicate “affects” and output_type “Gene” and give you a list of APIs which can give you that type of result.</p>
    </>
  );
}