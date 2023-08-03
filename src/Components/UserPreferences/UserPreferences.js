import { useEffect, useState } from 'react';
import { getUserPreferences, defaultPrefs, prefKeyToString, updateUserPreferences } from '../../Utilities/userApi';
import { useDispatch, useSelector } from 'react-redux';
import { currentPrefs, setCurrentPrefs } from '../../Redux/rootSlice';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Button from '../FormFields/Button';
import Select from 'react-select'
import styles from './UserPreferences.module.scss';
import { cloneDeep } from 'lodash';

const UserPreferences = () => {

  const dispatch = useDispatch();
  const initPrefs = useSelector(currentPrefs);
  const [userPrefs, setUserPrefs] = useState(initPrefs);
  const prefsSavedToast = () => toast.success("Preferences saved!");

  const updatePrefs = async () => {
    let prefs = await getUserPreferences(()=>{console.warn("no prefs found for this user, setting to default prefs.")});
    if(prefs === undefined)
      prefs = defaultPrefs;

    setUserPrefs(prefs);
    dispatch(setCurrentPrefs(prefs));
  }

  const handleSubmitUserPrefs = async (e) => {
    e.preventDefault();
    let response = await updateUserPreferences(userPrefs);
    console.log(response);
    prefsSavedToast();
    updatePrefs();
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
                  const defaultVal = prefOptions.find(pref => pref.value === prefValue)
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
                              let newPrefs = cloneDeep(prev);
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