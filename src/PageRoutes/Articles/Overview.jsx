import howItWorksImage from "../../Assets/Images/howitworks.png";

export const Overview = () => {

  return (
    <>
      <p className="caption">Last updated on September 8th, 2023</p>
      <p style={{'text-align': 'center'}}><img src={howItWorksImage} alt="shows how translator works in three steps" /></p>
      <p>The process of exploring Translator knowledge can be summarized as three steps:</p>
      <ol>
        <li><strong>Explore relationships.</strong> Select a search term to return results based on the type of query selected.</li>
        <li><strong>Review and identify favorite results.</strong> Translator can return hundreds or thousands of results. The interface provides tools to determine the results that best fit the needs of a user.</li>
        <li><strong>Focused analysis of the top results.</strong> The interface provides a workspace for indepth review of results.</li>
      </ol>
    </>
  );
}

      