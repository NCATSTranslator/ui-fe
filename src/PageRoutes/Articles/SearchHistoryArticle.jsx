import historyImage from "../../Assets/Images/history.png";

export const SearchHistoryArticle = () => {
  return (
    <>
      <p className="caption">Last updated on September 26th, 2024</p>
      <p>The results of the questions you have asked are stored locally in your browser's history for 30 days. Quickly return to a set of results by selecting the desired row. You can generate a shareable link to your results by clicking the share icon to the left of each row. Enter a subject in the search bar at the top of the page to find corresponding result sets.</p>
      <p style={{textAlign: 'center'}}><img src={historyImage} alt="Search History"/></p>
      <p>Remove a result set from your history by clicking the X icon to the right of the row. Clicking “Clear All” at the top of the page will delete your entire result history; please note that this action cannot be undone.</p>
    </>
  );
}
