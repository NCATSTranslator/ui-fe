import { useEffect, useState } from 'react';
import { defaultPrefs, prefKeyToString, updateUserPreferences } from '../../Utilities/userApi';
import { useSelector } from 'react-redux';
import { currentPrefs } from '../../Redux/rootSlice';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Button from '../FormFields/Button';
import Select from 'react-select'
import styles from './UserPreferences.module.scss';
import { cloneDeep } from 'lodash';

const UserPreferences = () => {

  // const dispatch = useDispatch();
  const initPrefs = useSelector(currentPrefs);
  // const userPrefs = useRef(initPrefs);
  const [userPrefs, setUserPrefs] = useState(initPrefs);
  const prefsSavedToast = () => toast.success("Preferences saved!");

  const handleSubmitUserPrefs = async (e) => {
    e.preventDefault();
    
    await updateUserPreferences(userPrefs);
    console.log('new prefs sent: ', userPrefs);
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
      {
        initPrefs && 
        <>
          <h4 className={styles.heading}>Preferences:</h4>
          <form onSubmit={(e)=>handleSubmitUserPrefs(e)} name="user preferences form" className={styles.form}>
            <div className={styles.prefs}>
              {
                Object.keys(initPrefs).map((pref, i)=>{
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
                      <label htmlFor={`#${pref}`} key={`${pref}-${defaultVal.value}`}>
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
                  }
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