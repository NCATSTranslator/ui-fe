import userprefsImage from "../../Assets/Images/userprefs.png";

export const UserPreferences = () => {

  return (
    <>
      <p className="caption">Last updated on September 8th, 2023</p>
      <p>The interface has a number of settings that can be adjusted based on a user's preferences.  The defaults for those settings can be accessed here on the 'User Preferences' page. This page is accessed by clicking the user icon to the left of the 'Log Out' button.</p>
      <p style={{'text-align': 'center'}}><img src={userprefsImage} alt="list of user preferences" /></p>
    </>
  );
}

      