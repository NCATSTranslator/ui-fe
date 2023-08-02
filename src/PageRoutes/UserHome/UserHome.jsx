import UserPreferences from "../../Components/UserPreferences/UserPreferences";
import UserHomePage from "../../Components/UserHomePage/UserHomePage";
import UserSaves from "../../Components/UserSaves/UserSaves";

const UserHome = () => {
  return (
    <div className={`container`}>
      <UserHomePage/>
      <UserSaves/>
      <UserPreferences/>
    </div>
  );
}

export default UserHome;