export const Evidence = () => {
  return (
    <>
      <p className="caption">Last updated on September 6th, 2022</p>
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
      <h2 className="h6">Evidence Types</h2>
      <p>The most common evidence types encountered in Translator are publications, clinical trials, <i>P</i> values, and database references.</p>
      <p><strong>Publications</strong><br />
        Publications are sourced from various databases, journals, and biomedical literature. One of the most common sources you may see is PubMed, a biomedical literature database developed and maintained by the <a href="https://www.ncbi.nlm.nih.gov/" target="_blank" rel="noreferrer">National Center for Biotechnology Information</a>. PubMed is a collection of over 34 million citations and abstracts and is a valuable tool for translational researchers.</p>
      <p><strong>Clinical Trials</strong><br />
        A clinical trial is a research study where one or more human subjects are assigned one or more therapeutic interventions, including placebos or other controls. These trials evaluate the effects of interventions on health-related biomedical or behavioral outcomes.</p>
      <p><strong><i>P</i> Values</strong><br />
        <i>P</i> values demonstrate inconsistencies between statistical models and observed data sets. A smaller <i>P</i> value means a higher chance of an incorrect null hypothesis or the presumption that differences between data sets are insubstantial. <i>P</i> values indicate only the probability of the null hypothesis and are not related to any study hypotheses.</p>
      <p><strong>Database References</strong><br />
        Database references are documents stored in multiple collections or databases. This evidence format provides a standardized language for identifying the relationships between documents and databases with a large ecosystem of frameworks and tools. Database references can include the name of the collection, database name, etc.</p>
      <h2 className="h6">Viewing Evidence</h2>
      <p>When using Translator, you can choose to view all evidence supporting a result or just the evidence that supports a single relationship. To view all supporting evidence, click “View All (#)” under the Evidence column to the right of each result row.</p>
      <p style={{textAlign: 'center'}}><img referrerPolicy="no-referrer" src="https://lh5.googleusercontent.com/MyzHO9wK-jSdylOokRmsZ7-W82xUL03YnHe33CFFEqMf9iyQ6HatlIiREyB55ThChPU=w2400" alt="View Evidence"/></p>
      <p>To view all available evidence that supports a relationship, expand a result row to view all paths through which the result impacts the selected disease. Click the arrow between two objects to view the evidence. Not all relationships may have associated evidence.</p>
      <p style={{textAlign: 'center'}}><img referrerPolicy="no-referrer" src="https://lh6.googleusercontent.com/Y8CTwcUl14kltHuEBneTZsuIVFFZdBV40iRz1bnq1mqJ167e_XXKpoCWfHjygVJtlqc=w2400" alt="Relationship Evidence"/></p>
      <p>Clicking “View All” or a relationship arrow will open the Evidence module. This popup window displays the date(s), source, title, abstract (if available), supported relationship or claim, and the format type for each piece of evidence.</p>
      <p style={{textAlign: 'center'}}><img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/06i2yz8BU63u_v1_e6IZBqr2lqJHkrFa8ANd0b2e7z4gydVpnJepyMe24b48X0W7n_M=w2400" alt="All Evidence"/></p>
    </>
  )
}