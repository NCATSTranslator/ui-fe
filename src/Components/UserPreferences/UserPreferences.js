import { useEffect, useState } from 'react';
import { getUserPreferences, defaultPrefs, prefKeyToString, updateUserPreferences } from '../../Utilities/userApi';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Button from '../FormFields/Button';
import Select from 'react-select'
import styles from './UserPreferences.module.scss';

const UserPreferences = () => {

  const [userPrefs, setUserPrefs] = useState(null);
  const prefsSavedToast = () => toast.success("Preferences saved!");

  useEffect(() => {
    getPrefs();
  },[]);

  const getPrefs = async ()=>{
    let prefs = await getUserPreferences(()=>{console.warn("no prefs found for this user, setting to default prefs.")});
    if(prefs === undefined)
    prefs = defaultPrefs;
    setUserPrefs(prefs);
  }

  const handleSubmitUserPrefs = async (e) => {
    e.preventDefault();
    let response = await updateUserPreferences(userPrefs);
    console.log(response);
    prefsSavedToast();
  }

  return(
    <div>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        closeOnClick
        theme="light"
        transition={Slide}
        pauseOnFocusLoss={false}
        closeButton={false}
        hideProgressBar
      />
      {
        userPrefs && 
        <>
          <h4 className={styles.heading}>Preferences:</h4>
          <form onSubmit={(e)=>handleSubmitUserPrefs(e)} name="user preferences form" className={styles.form}>
            <div className={styles.prefs}>
              {
                Object.keys(userPrefs).map((pref, i)=>{
                  const prefLabel = prefKeyToString(pref);
                  const prefValue = userPrefs[pref].pref_value;
                  const prefOptions = userPrefs[pref].possible_values.map((val)=>{
                    return({value: val, label: val})
                  })
                  const defaultVal = prefOptions.find(pref=> pref.value === prefValue)
                  return(
                    <label htmlFor={`#${pref}`} key={pref}>
                      {prefLabel}
                      <Select 
                        id={pref}
                        name={prefLabel}
                        defaultValue={defaultVal}
                        options={prefOptions}
                        onChange={(e)=>{
                          if(userPrefs[pref]) {
                            setUserPrefs(prev => {
                              let newPrefs = {...prev};
                              newPrefs[pref].pref_value = e.value;
                              return newPrefs;
                            })
                          }
                        }}
                      />
                    </label>
                  ) 
                })
              }
            </div>
            <Button size="s" className={styles.submit}>Save</Button>
          </form>
        </>
      }
    </div>
  )
}

export default UserPreferences;