import howItWorksImage from "../../Assets/Images/howitworks.png";
import selectRelImage from "../../Assets/Images/selectRel.png";
import geneQueryImage from "../../Assets/Images/genequery.png";
import searchTermImage from "../../Assets/Images/searchterm.png";
import returnedImage from "../../Assets/Images/returned.png";
import reviewImage from "../../Assets/Images/review.png";
import pathsImage from "../../Assets/Images/paths.png";
import filterImage from "../../Assets/Images/filter.png";
import bookmarkImage from "../../Assets/Images/bookmark.png";
import workspaceImage from "../../Assets/Images/workspace.png";
import pubsImage from "../../Assets/Images/pubs.png";
import sourcesImage from "../../Assets/Images/sources.png";

export const LoggingIn = () => {

  return (
    <>
      <p className="caption">Last updated on September 1th, 2023</p>
      
      <h2 className="h6">Overview</h2>
      <p>The process of exploring Translator knowledge can be summarized as three steps:</p>
      <p style={{'text-align': 'center'}}><img src={howItWorksImage} alt="shows how translator works in three steps" /></p>
      <ol>
        <li><strong>Explore relationships.</strong> Select a search term to return results based on the type of query selected.</li>
        <li><strong>Review and identify favorite results.</strong> Translator can return hundreds or thousands of results. The interface provides tools to determine the results that best fit the needs of a user.</li>
        <li><strong>Focused analysis of the top results.</strong> The interface provides a workspace for indepth review of results.</li>
      </ol>

      <h2 className="h6">Exploring relationships</h2>
      <p>Translator facilitates the explorations of 3 types of questions:</p>
      <ol>
        <li>How chemical are related to diseases and how they may treat them.</li>
        <li>Given a gene, find drugs that impact its activity.</li>
        <li>Given a chemical, what genes' activity is affected.</li>
      </ol>
      <p><strong>Step 1: select the relationship to expose the search bar.</strong></p>
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

      <p><strong>Step 5: Review the result network.</strong> The knowledge graph representing the connections between a result and the search term are displayed with tools to explore.</p>
      <p style={{'text-align': 'center'}}><img src={reviewImage} alt="example showing a results graph" /></p>
      
      <p><strong>Step 6: Explore the paths.</strong> Each network is broken out into every path through the network to explore individually. Each concept is displayed with its relationship to another concept.  Selecting the connecting relationships (affects, treats, or contributes to below) will display the evidence supporting that relationship.</p>
      <p style={{'text-align': 'center'}}><img src={pathsImage} alt="example showing the paths from a result" /></p>

      <p><strong>Step 7: Filtering results.</strong> Results can be filtered to identify the most valuable to users.</p>
      <p>
        <ol>
          <li>The left panel provides facets to search and filter result sets.</li>  
          <li>The text filter will filter results that contain specific text.</li>  
          <li>The chebi roles for each result are shown (when the results are chemicals) for each result. Selecting a role will filter all of the results to display only those with the same role.</li>  
        </ol>
      </p>
      <p style={{'text-align': 'center'}}><img src={filterImage} alt="results page with filter bar on left" /></p>

      <p><strong>Step 8: Select the results that are worth further study.</strong> The bookmark icon indicates if a result has been identified as a favorite. Either selecting the bookmark or utilizing the notes function (automatically activating the bookmark) will identify results for further study.</p> 
      <p>Selecting the bookmark icon or creating a note about a result saves it for further review in the workspace.</p>
      <p style={{'text-align': 'center'}}><img src={bookmarkImage} alt="single result showing bookmark and notes icons" /></p>

      <p><strong>Step 9: Evaluate the evidence supporting a relationship.</strong> Each relationship has evidence. This includes publications as well as other sources.</p>
      <p>Support from publications are summarized in a table. Each relationship is capture in the table with information about and links to the publication. </p>
      <p style={{'text-align': 'center'}}><img src={pubsImage} alt="list of publications for a result" /></p>
      <p>Other sources are cited in the 'Sources' tab. The specific relationship is displayed with a link to a description of how the support was generated.</p>
      <p style={{'text-align': 'center'}}><img src={sourcesImage} alt="source for a result" /></p>
      
      <h2 className="h6">Focused analysis of the top results</h2>
      <p>The workspace retains all results that have been bookmarked. Other results are removed to allow focused review.</p>
      <p style={{'text-align': 'center'}}><img src={workspaceImage} alt="bookmarks displayed on the workspace page" /></p>
    </>
  );
}