import { useEffect } from 'react';
import styles from './UserPreferences.module.scss';

const UserPreferences = () => {

  useEffect(()=>{
    const requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    fetch(`/api/users/preferences`, requestOptions)
      .then(response => handleFetchErrors(response))
      .then(response => response.json())
      .then(data => {
        console.log(data);
      });

  },[]);

  const UpdatePreferences = async () => {
    const userPrefsJson = {
      user_id: '',
      preferences: {
        lang: {pref_value: "en"},
        result_sort: {pref_value: "scoreHighLow"},
        result_per_screen: {pref_value: 10},
        graph_visibility: {pref_value: "sometimes"},
        graph_layout: {pref_value: "klay"},
        path_show_count: {pref_value: 5},
        evidence_sort: {pref_value: ""},
      }
    }
    JSON.stringify(userPrefsJson);
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: userPrefsJson
    };

    let response = await fetch(`/api/users/${userID}/preferences`, requestOptions)
      .then(response => handleFetchErrors(response))
      .then(response => response.json())
      .then(data => {
        console.log(data);
      });
  }

  return(
    <div>

    </div>
  )
}

export default UserPreferences;