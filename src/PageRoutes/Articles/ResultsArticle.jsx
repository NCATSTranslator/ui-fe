
export const ResultsArticle = () => {
  return (
    <>
      <p className="caption">Last updated on September 6th, 2022</p>
      <p>Once you have submitted your question, your results will begin loading. Your results will be shown as soon as they are found, and you'll be prompted to refresh the page as they continue to load. Please note that you will not be able to access results if you navigate away from the loading page. Navigating away from the loading page will cancel your search.</p>
      <p style={{textAlign: 'center'}}><img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/eXEdDN0WctCmEa8lVuzO6FNrTAGz6I-UjRe9xE2iP6qckdhhaopaE7Lmbk4YjtekJ9E=w2400" alt="Calculating Results"/></p>
      <h2 className="h6">Results Table</h2>
      <p>The results table lists all drugs or chemicals that may treat the disease you specified in your search. Each row contains the result's name, a check mark indicating its FDA approval status, and the amount of evidence that led to its inclusion in the list of responses.</p>
      <p><strong>Please note: check marks in the FDA approval column indicate drugs that have been approved by the FDA for the use of treating a specific disease or condition. This does not mean that the FDA has approved these drugs to treat the disease(s) you specified in your search.</strong></p>
      <p>Below each result name, you will see the number of paths through which the drug may treat your specified disease. Paths are interactive graphs that connect potential therapeutics to the disease that they may treat. Some paths contain only the result, the disease, and the relationship(s) between the two. Other paths can be more complicated, such as a path showing how the result, the disease, another chemical, and a protein may interact.</p>
      <p style={{textAlign: 'center'}}><img referrerPolicy="no-referrer" src="https://lh4.googleusercontent.com/nwWpwVzGi3mfcH1hg1Lda5jPT4TqIbMafVBUXZH7VnImVI30nYuvYUeCXETd7Azq-LI=w2400" alt="FDA Approval and Paths"/></p>
      <h2 className="h6">Sorting and Filtering</h2>
      <p>Click on the first row of any column to sort your results by name, FDA approval status, or amount of evidence. If the arrow that appears after clicking on a column's title is pointing up, then that column will be sorted from A-Z or highest to lowest, while a down arrow means that the column will be sorted from Z-A or lowest to highest.</p>
      <p style={{textAlign: 'center'}}><img referrerPolicy="no-referrer" src="https://lh6.googleusercontent.com/YLOUaBHaXhyufAvSYMJBFrWK66NcwefaiIGjgUHq5ysLCRx-2s8ll7Ibl89Hf-LAhKI=w2400" alt="Sort and Filter"/></p>
      <p>To filter results, refer to the sidebar on the left side of the screen. You can drag the slider to set the minimum amount of evidence required for a result to appear in the table, or click the box next to “Approved” under FDA Status to view only FDA-approved drugs.</p>
      <p><strong>Please note that an “Approved” status does not mean that the FDA has approved these drugs to treat the disease(s) you specified in your search, but rather that they have been approved to treat a specific disease or condition.</strong></p>
    </>
  );
}
