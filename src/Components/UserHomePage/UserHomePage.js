import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { currentUser } from '../../Redux/rootSlice';
import styles from './UserHomePage.module.scss';

const UserHomePage = () => {

  const userProfile = useSelector(currentUser);

  return(
    <div>
      {
        userProfile?.name &&
        <h3>(Temp) Welcome back {userProfile.name}!</h3>
      }
    </div>
  )
}

export default UserHomePage;