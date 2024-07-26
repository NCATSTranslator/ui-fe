import { useEffect, useState, FormEvent } from 'react';
import { defaultPrefs, prefKeyToString, updateUserPreferences } from '../../Utilities/userApi';
import { useSelector, useDispatch } from 'react-redux';
import { currentPrefs, setCurrentPrefs } from '../../Redux/rootSlice';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Button from '../Core/Button';
import Select from 'react-select';
import styles from './UserPreferences.module.scss';
import { cloneDeep } from 'lodash';
import { PreferencesContainer } from '../../Types/global';
import LoginWarning from '../LoginWarning/LoginWarning';
import { useUser } from '../../Utilities/userApi';
import LoadingWrapper from '../LoadingWrapper/LoadingWrapper';

const UserPreferences = () => {

  const initPrefs = useSelector(currentPrefs);
  const [user, loading] = useUser();
  const [userPrefs, setUserPrefs] = useState<PreferencesContainer>(initPrefs);
  const prefsSavedToast = () => toast.success("Preferences saved!");
  const dispatch = useDispatch();

  const handleSubmitUserPrefs = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    await updateUserPreferences(userPrefs);
    console.log('new prefs sent: ', userPrefs);
    dispatch(setCurrentPrefs(userPrefs));
    prefsSavedToast();
  }

  useEffect(() => {
    setUserPrefs(initPrefs);
  }, [initPrefs]);

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
      <LoadingWrapper loading={loading}>
        {
          !!user
          ? 
            initPrefs && 
            <>
              <h4 className={styles.heading}>Preferences:</h4>
              <form onSubmit={(e)=>handleSubmitUserPrefs(e)} name="user preferences form" className={styles.form}>
                <div className={styles.prefs}>
                  {
                    Object.keys(initPrefs).map((pref) => {
                      const prefLabel = prefKeyToString(pref);
                      const prefValue = initPrefs[pref].pref_value;
                      let prefOptions = null;
                      if(initPrefs[pref]?.possible_values) {
                        prefOptions = initPrefs[pref].possible_values.map((val)=>{
                          const label = (val === -1) ? "All" : val;
                          return({value: val, label: label})
                        });
                      } else {
                        prefOptions = defaultPrefs[pref].possible_values.map((val)=>{
                          const label = (val === -1) ? "All" : val;
                          return({value: val, label: label})
                        });
                      }
                      const defaultVal = prefOptions?.find(pref => pref.value.toString() === prefValue.toString());
                      if(prefOptions === null) {
                        return(<></>);
                      } else {
                        return(
                          <label htmlFor={`#${pref}`} key={`${pref}-${(!!defaultVal) ? defaultVal.value : ''}`}>
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
                                    if(!!e)
                                      newPrefs[pref].pref_value = e.value;
                                    return newPrefs;
                                  })
                                }
                              }}
                            />
                          </label>
                        ) 
                      }
                    })
                  }
                </div>
                <Button size="s" className={styles.submit}>Save</Button>
              </form>
            </>
          :
            <LoginWarning text="Use the Log In link above in order to view and manage your preferences." />
        }
      </LoadingWrapper>
    </div>
  )
}

export default UserPreferences;