import selectRelImage from "../../Assets/Images/selectRel.png";
import geneQueryImage from "../../Assets/Images/genequery.png";
import searchTermImage from "../../Assets/Images/searchterm.png";
import returnedImage from "../../Assets/Images/returned.png";

export const ExploringRelationships = () => {

  return (
    <>
      <p className="caption">Last updated on September 8th, 2023</p>
      <p>Translator facilitates the exploration of 3 types of questions:</p>
      <ol>
        <li>How chemical are related to diseases and how they may treat them.</li>
        <li>Given a gene, find drugs that impact its activity.</li>
        <li>Given a chemical, what genes' activity is affected.</li>
      </ol>
      <p><strong>Step 1: select a relationship to expose the search bar.</strong></p>
      <p style={{'text-align': 'center'}}><img src={selectRelImage} alt="select a relationship you'd like to explore example" /></p>

      <p><strong>Step 2: If the Gene - Chemical relationship is selected, this will expose options to further specify the type of relationship and which direction the gene activity will be impacted.</strong></p>
      <p style={{'text-align': 'center'}}><img src={geneQueryImage} alt="chemical gene query example" /></p>

      <p><strong>Step 3: Enter the desired term to explore.</strong> The search bar's autocomplete function will provide options for searchable terms. Select the term by clicking it and the search will run.</p>
      <p style={{'text-align': 'center'}}><img src={searchTermImage} alt="submitting a search term example" /></p>
      <p><strong>Optimized search:</strong></p>
      <ol>
        <li>If the term is a gene, the gene's symbol or alias is the best way to search.</li>
        <li>Human genes usually have the most results.  Some of the data resulting from natural language processing labels genes as human by default. As such, while reviewing the evidence provided for a relationship, users may find that the human gene term is connected with other species.</li>
        <li>If the term is a chemical, brand name drugs or the chemical name may be searched. Some terms are only mapped to one or the other. If the expected result is not show for one, try the other.</li>
      </ol>

      <p><strong>Step 4: Results are returned.</strong> Translator has five reasoning engines that may return results. Once some of the results are ready, they will be displayed (as shown below) while the remaining reasoners continue to be developed. Once additional results are found, the process indicator will indicate 'Load New Results.' (see below). Click the link to load the new results in the view.</p>
      <p style={{'text-align': 'center'}}><img src={returnedImage} alt="example showing results" /></p>
    </>
  );
}

      