import reviewImage from "../../Assets/Images/review.png";
import pathsImage from "../../Assets/Images/paths.png";
import filterImage from "../../Assets/Images/filter.png";
import bookmarkImage from "../../Assets/Images/bookmark.png";
import pubsImage from "../../Assets/Images/pubs.png";
import sourcesImage from "../../Assets/Images/sources.png";

import {ReactComponent as Bookmark } from "../../Icons/Navigation/Bookmark.svg"

export const ReviewIdentify = () => {

  return (
    <>
      <p className="caption">Last updated on September 8th, 2023</p>
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
      <p>Selecting the bookmark icon (<Bookmark style={{"display":"inline", "width":"20px", "margin-bottom": "-4px"}} />) or creating a note about a result saves it for further review in the workspace.</p>
      <p style={{'text-align': 'center'}}><img src={bookmarkImage} alt="single result showing bookmark and notes icons" /></p>

      <p><strong>Step 9: Evaluate the evidence supporting a relationship.</strong> Each relationship has evidence. This includes publications as well as other sources.</p>
      <p>Support from publications are summarized in a table. Each relationship is capture in the table with information about and links to the publication. </p>
      <p style={{'text-align': 'center'}}><img src={pubsImage} alt="list of publications for a result" /></p>
      <p>Other sources are cited in the 'Sources' tab. The specific relationship is displayed with a link to a description of how the support was generated.</p>
      <p style={{'text-align': 'center'}}><img src={sourcesImage} alt="source for a result" /></p>
    </>
  );
}

      