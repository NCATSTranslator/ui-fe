import headerImage from "../../Assets/Images/header.png";
import login2Image from "../../Assets/Images/login2.png";

export const LoggingIn = () => {

  return (
    <>
      <p className="caption">Last updated on September 8th, 2023</p>
      <p>The full suite of tools for Translator can be accessed after logging in.  This includes selecting targets for the available queries and access to the workspace for saved results. </p>
      <p style={{'text-align': 'center'}}><img src={headerImage} alt="header with login button" /></p>
      <p>The top navigation bar includes a login button.  This takes the user to the login page where there are multiple options for logging in.</p>
      <p style={{'text-align': 'center', 'margin': '0 auto', 'max-width': '400px'}}><img src={login2Image} alt="list of login options" /></p>
      <p>Select the account to log in with and follow the instructions.  Once completed, it will redirect you back to the Translator page.</p>    
    </>
  );
}