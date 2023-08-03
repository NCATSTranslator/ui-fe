import { useEffect, useState } from 'react';
import { getAllUserSaves } from '../../Utilities/userApi';
import styles from './UserSaves.module.scss';

const UserSaves = () => {

  const [userSaves, setUserSaves] = useState(null);
  // const prefsSavedToast = () => toast.success("Preferences saved!");

  useEffect(() => {
    getSaves();
  },[]);

  const getSaves = async ()=>{
    let saves = await getAllUserSaves();

    console.log(saves)

    setUserSaves(saves);
  }

  return(
    <div>
      <h4>Workspace</h4>
    </div>
  )
}

export default UserSaves;