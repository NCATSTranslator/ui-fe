export const Evidence = () => {
  return (
    <>
      <p>Evidence is collected from over 250 diverse knowledge sources. Some examples of these types of sources are:</p> 
      <ul>
        <li>Electronic health records</li>
        <li>Publications</li>
        <li>Prescription data</li>
        <li>Health insurance claims data</li>
        <li>Diagnostic labs</li>
        <li>Biomedical imaging data</li>
        <li>Orthologs/Animal models</li>
        <li>Clinical trial data</li>
      </ul>
      <h5>Evidence Types</h5>
      <p>The most common evidence types encountered in Translator are publications, clinical trials, P values, and database references.</p>
      <p><strong>Publications</strong><br />
        Publications are sourced from various databases, journals, and biomedical literature. One of the most common sources you may see is PubMed, a biomedical literature database developed and maintained by the <a href="https://www.ncbi.nlm.nih.gov/">National Center for Biotechnology Information</a>. PubMed is a collection of over 34 million citations and abstracts and is a valuable tool for translational researchers.</p>
      <p><strong>Clinical Trials</strong><br />
        A clinical trial is a research study where one or more human subjects are assigned one or more therapeutic interventions, including placebos or other controls. These trials evaluate the effects of interventions on health-related biomedical or behavioral outcomes.</p>
      <p><strong><i>P</i> Values</strong><br />
        <i>P</i> values demonstrate inconsistencies between statistical models and observed data sets. A smaller <i>P</i> value means a higher chance of an incorrect null hypothesis or the presumption that differences between data sets are insubstantial. <i>P</i> values indicate only the probability of the null hypothesis and are not related to any study hypotheses.</p>
      <p><strong>Database References</strong><br />
        Database references are documents stored in multiple collections or databases. This evidence format provides a standardized language for identifying the relationships between documents and databases with a large ecosystem of frameworks and tools. Database references can include the name of the collection, database name, etc.</p>
      <h5>Viewing Evidence</h5>
      <p>When using Translator, you can choose to view all evidence supporting a result or just the evidence that supports a single relationship. To view all supporting evidence, click “View All (#)” under the Evidence column to the right of each result row.</p>
      <p style={{textAlign:'center'}}><img src="https://media.istockphoto.com/vectors/thumbnail-image-vector-graphic-vector-id1147544807?k=20&m=1147544807&s=612x612&w=0&h=pBhz1dkwsCMq37Udtp9sfxbjaMl27JUapoyYpQm0anc=" alt="Placeholder" width="50%" /></p>
      <p>To view all available evidence that supports a relationship, expand a result row to view all paths through which the result treats the selected disease. Click the arrow between two objects to view the evidence. Not all relationships may have associated evidence.</p>
      <p style={{textAlign:'center'}}><img src="https://media.istockphoto.com/vectors/thumbnail-image-vector-graphic-vector-id1147544807?k=20&m=1147544807&s=612x612&w=0&h=pBhz1dkwsCMq37Udtp9sfxbjaMl27JUapoyYpQm0anc=" alt="Placeholder" width="50%" /></p>
      <p>Clicking “View All” or a relationship arrow will open the Evidence module. This popup window displays the date(s), source, title, abstract (if available), supported relationship or claim, and the format type for each piece of evidence.</p>
      <p style={{textAlign:'center'}}><img src="https://media.istockphoto.com/vectors/thumbnail-image-vector-graphic-vector-id1147544807?k=20&m=1147544807&s=612x612&w=0&h=pBhz1dkwsCMq37Udtp9sfxbjaMl27JUapoyYpQm0anc=" alt="Placeholder" width="50%" /></p>
    </>
  )
}