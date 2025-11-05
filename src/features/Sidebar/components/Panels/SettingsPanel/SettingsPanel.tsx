import { useState, useEffect, useMemo } from 'react';
import styles from './SettingsPanel.module.scss';
import Button from "@/features/Core/components/Button/Button";
import UserIcon from '@/assets/icons/projects/user.svg?react';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import { useUser } from '@/features/UserAuth/utils/userApi';
import { PrefKey, PrefObject, PrefType } from '@/features/UserAuth/types/user';
import ChevRight from "@/assets/icons/directional/Chevron/Chevron Right.svg?react";
import ChevLeft from "@/assets/icons/directional/Chevron/Chevron Left.svg?react";
import { capitalizeFirstLetter } from '@/features/Common/utils/utilities';
import { useDispatch, useSelector } from 'react-redux';
import { currentPrefs, setCurrentPrefs } from '@/features/UserAuth/slices/userSlice';
import { Preferences} from '@/features/UserAuth/types/user';
import { toast } from 'react-toastify';
import { updateUserPreferences } from '@/features/UserAuth/utils/userApi';
import { cloneDeep } from 'lodash';

const SettingsPanel = () => {
  const [user, loading] = useUser();
  const [activePrefTypeId, setActivePrefTypeId] = useState<PrefType | null>(null);
  const [activePrefObject, setActivePrefObject] = useState<{prefObject: PrefObject, prefKey: PrefKey} | null>(null);

  const handleSetActivePrefObject = (prefId: PrefKey, prefs: Preferences) => {
    setActivePrefObject({prefObject: prefs[prefId as keyof Preferences], prefKey: prefId});
  }

  const initPrefs = useSelector(currentPrefs);
  const [userPrefs, setUserPrefs] = useState<Preferences>(initPrefs);
  const prefsSavedToast = () => toast.success("Preferences saved!");
  const dispatch = useDispatch();
  
  const resultPrefs = useMemo(()=> {
    return {
      result_sort: userPrefs.result_sort,
      result_per_screen: userPrefs.result_per_screen,
      path_show_count: userPrefs.path_show_count,
    }
  }, [userPrefs]);

  const evidencePrefs = useMemo(()=> {
    return {
      evidence_sort: userPrefs.evidence_sort,
      evidence_per_screen: userPrefs.evidence_per_screen,
    }
  }, [userPrefs]);

  const graphPrefs = useMemo(()=> {
    return {
      graph_visibility: userPrefs.graph_visibility,
      graph_layout: userPrefs.graph_layout,
    }
  }, [userPrefs]);

  const prefsToDisplay = useMemo(()=> {
    if(activePrefTypeId === "results") return resultPrefs;
    if(activePrefTypeId === "evidence") return evidencePrefs;
    if(activePrefTypeId === "graphs") return graphPrefs;
    return undefined;
  }, [activePrefTypeId, resultPrefs, evidencePrefs, graphPrefs]);

  const handleSubmitUserPrefs = async (prefs: Preferences) => {
    await updateUserPreferences(prefs);
    dispatch(setCurrentPrefs(prefs));
    prefsSavedToast();
  }

  const handlePrefValueClick = (prefKey: PrefKey, prefValue: string | number) => {
    setUserPrefs(prev => {
      let newPrefs = cloneDeep(prev);
      newPrefs[prefKey].pref_value = prefValue;
      handleSubmitUserPrefs(newPrefs);
      return newPrefs;
    });
    setActivePrefObject(null);
  }

  useEffect(() => {
    setUserPrefs(initPrefs);
  }, [initPrefs]);

  return (
    <div className={styles.settingsPanel}>
      <LoadingWrapper loading={loading}>
        <div className={styles.top}>
            {
              !user ? (
                <div className={styles.iconText}>
                  <UserIcon />
                  <p>Log in to view your query history, projects, bookmarks, and notes.<br/><Button href="/login" title="Log In" className={styles.loginButton} variant="textOnly" inline>Log In</Button></p>
                </div>
              ) : (
                <>
                  <div className={styles.iconText}>
                    <div className={styles.userIcon}><span>{user.name.charAt(0)}</span></div>
                    <p>{user.email}<br/><Button href="/logout" title="Log Out" className={styles.loginButton} variant="textOnly" inline>Log Out</Button></p>
                  </div>
                  <div className={styles.prefs}>
                    <h6 className={styles.title}>Preferences</h6>
                    <p className={styles.helpText}>These preferences are automatically applied to all of your queries and projects.</p>
                  </div>
                </>
              )
            }
        </div>
        {
          !!user &&
          <>
            <div className={styles.prefs}>
              <Button handleClick={()=>setActivePrefTypeId("results")} className={styles.prefButton} iconRight={<ChevRight />} variant="textOnly">Results</Button>
              <Button handleClick={()=>setActivePrefTypeId("evidence")} className={styles.prefButton} iconRight={<ChevRight />} variant="textOnly">Evidence</Button>
              <Button handleClick={()=>setActivePrefTypeId("graphs")} className={styles.prefButton} iconRight={<ChevRight />} variant="textOnly">Graphs</Button>
            </div>
            {
              activePrefTypeId && 
              <div className={`${styles.activePrefType} ${styles.coverPanel}`}>
                <Button
                  handleClick={()=>setActivePrefTypeId(null)}
                  className={`${styles.prefButton} ${styles.backButton}`}
                  iconLeft={<ChevLeft />}
                  variant="textOnly"
                  >
                    {activePrefTypeId && capitalizeFirstLetter(activePrefTypeId)}    
                </Button>
                <div className={styles.activePrefTypeContent}>
                  {
                    prefsToDisplay && Object.entries(prefsToDisplay).map(([key, pref]) => (
                      <div className={styles.activePref} key={key}>
                        <h6 className={styles.prefLabel}>{pref.name}</h6>
                        <Button 
                          className={styles.prefValueButton}
                          variant="secondary"
                          iconRight={<ChevRight />}
                          handleClick={()=>handleSetActivePrefObject(key as PrefKey, userPrefs)}
                        >
                          {pref.pref_value.toString()}
                        </Button>
                      </div>
                    ))
                  }
                </div>
              </div>
            }
            {
              activePrefObject && activePrefObject.prefObject.possible_values &&
              <div className={`${styles.activePref} ${styles.coverPanel}`}>
                <Button
                  handleClick={()=>setActivePrefObject(null)}
                  className={`${styles.prefButton} ${styles.backButton}`}
                  iconLeft={<ChevLeft />}
                  variant="textOnly"
                  >
                    {activePrefObject.prefObject.name} 
                  </Button>
                  <div className={styles.activePrefContent}>
                    {activePrefObject.prefObject.possible_values.map((value) => (
                      <Button
                        key={value}
                        className={styles.prefValueSelectorButton}
                        variant="secondary"
                        handleClick={()=>handlePrefValueClick(activePrefObject.prefKey, value)}
                        >
                        {value.toString()}
                      </Button>
                    ))}
                  </div>
              </div>
            }
          </>
        }
      </LoadingWrapper>
    </div>
  );
};

export default SettingsPanel;