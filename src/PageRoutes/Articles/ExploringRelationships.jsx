import selectRelImage from "../../Assets/Images/selectRel.png";
import searchTermImage from "../../Assets/Images/searchterm.png";
import returnedImage from "../../Assets/Images/returned.png";

export const ExploringRelationships = () => {

  return (
    <>
      <p className="caption">Last updated on September 25th, 2024</p>
      <p>Translator facilitates the exploration of 3 types of questions:</p>
      <ol>
        <li>How chemicals are related to diseases and how they may treat them.</li>
        <li>Given a gene, find chemicals that impact its activity.</li>
        <li>Given a chemical, what genes' activity is affected by that chemical.</li>
      </ol>
      <p><strong>Use the dropdown to select the relationship you'd like to explore.</strong></p>
      <p style={{'text-align': 'center'}}><img src={selectRelImage} alt="select a relationship you'd like to explore example" /></p>

      <p><strong>Enter the your desired term.</strong> The search bar's autocomplete functionality will provide options for searchable terms. Select the term by clicking it, then click the submit button on the right to submit your search.</p>
      <p style={{'text-align': 'center'}}><img src={searchTermImage} alt="submitting a search term example" /></p>
      <p><strong>Optimized search:</strong></p>
      <ol>
        <li>If the term is a gene, the gene's symbol or alias is the best way to search.</li>
        <li>Human genes usually have the most results.  Some of the data resulting from natural language processing labels genes as human by default. As such, while reviewing the evidence provided for a relationship, users may find that the human gene term is connected with other species.</li>
        <li>If the term is a chemical, brand name drugs or the chemical name may be searched. Some terms are only mapped to one or the other. If the expected result is not show for one, try the other.</li>
      </ol>

      <p><strong>Results are returned.</strong> Translator has five reasoning engines that may return results. Once some of the results are ready, they will be displayed (as shown below) while the remaining reasoners continue to be developed. Once additional results are found, the process indicator will indicate 'Sync New Results.' (see below). Click the button to load the new results into the view.</p>
      <p style={{'text-align': 'center'}}><img src={returnedImage} alt="example showing results" /></p>
    </>
  );
}

      