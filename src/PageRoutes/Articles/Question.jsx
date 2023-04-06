
export const Question = () => {
  return (
    <>
      <p className="caption">Last updated on September 6th, 2022</p>
      <p>To form a question, enter a disease into the search bar on the Translator home page or at the top of the results page. We source our disease names from the <a href="https://mondo.monarchinitiative.org/" target="_blank" rel="noreferrer">Mondo Disease Ontology</a> developed and maintained by the Monarch Initiative. As you type, suggestions for various diseases will appear below the search field.</p>
      <p style={{textAlign: 'center'}}><img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/u9S281jenj07isGuI1c1ptAoiqDGJ_sq1_RjhcHXkKPxz9pie8Qwu4PfiYxtLFamkhE=w2400" alt="Search Suggestion Dropdown"/></p>
      <p>Click on the desired term to select that disease, then press the “Search” button. We will start showing you results as soon as they are loaded. Navigating away from the loading page will cancel your search. You'll be prompted to refresh the page as we load more results, which <strong>may cause the order of answers to change</strong>.</p>
      <p style={{textAlign: 'center'}}><img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/eXEdDN0WctCmEa8lVuzO6FNrTAGz6I-UjRe9xE2iP6qckdhhaopaE7Lmbk4YjtekJ9E=w2400" alt="Calculating Results"/></p>
      <p>While you can only search for drugs that may treat diseases right now, we’re actively working to expand our repository of questions in future Translator updates!</p>
    </>
  );
}
