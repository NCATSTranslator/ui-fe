import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './SettingsPanel.module.scss';
import Button from "@/features/Core/components/Button/Button";
import UserIcon from '@/assets/icons/projects/user.svg?react';
import LoadingWrapper from '@/features/Core/components/LoadingWrapper/LoadingWrapper';
import { getFormattedLoginURL, useUser } from '@/features/UserAuth/utils/userApi';
import { PrefKey, PrefObject, PrefType } from '@/features/UserAuth/types/user';
import ChevRight from "@/assets/icons/directional/Chevron/Chevron Right.svg?react";
import { capitalizeFirstLetter } from '@/features/Common/utils/utilities';
import { useDispatch, useSelector } from 'react-redux';
import { currentPrefs, setCurrentPrefs } from '@/features/UserAuth/slices/userSlice';
import { Preferences} from '@/features/UserAuth/types/user';
import { updateUserPreferences } from '@/features/UserAuth/utils/userApi';
import { cloneDeep } from 'lodash';
import { getPrettyPrefValue } from '@/features/UserAuth/utils/formatPrefs';
import { errorToast, preferencesSavedToast } from '@/features/Core/utils/toastMessages';
import InteriorPanelContainer from '@/features/Sidebar/components/InteriorPanelContainer/InteriorPanelContainer';
import SidebarTransitionButton from '@/features/Sidebar/components/SidebarTransitionButton/SidebarTransitionButton';

const SettingsPanel = () => {
  const location = useLocation();
  const [user, loading] = useUser();
  const [activePrefTypeId, setActivePrefTypeId] = useState<PrefType | null>(null);
  const [activePrefObject, setActivePrefObject] = useState<{prefObject: PrefObject, prefKey: PrefKey} | null>(null);

  const handleSetActivePrefObject = (prefId: PrefKey, prefs: Preferences) => {
    setActivePrefObject({prefObject: prefs[prefId as keyof Preferences], prefKey: prefId});
  }

  const initPrefs = useSelector(currentPrefs);
  const [userPrefs, setUserPrefs] = useState<Preferences>(initPrefs);
  const dispatch = useDispatch();
  
  const resultPrefs = useMemo(()=> {
    return {
      result_sort: userPrefs.result_sort,
      results_per_page: userPrefs.results_per_page,
      path_show_count: userPrefs.path_show_count,
    }
  }, [userPrefs]);

  const evidencePrefs = useMemo(()=> {
    return {
      evidence_sort: userPrefs.evidence_sort,
      evidence_per_page: userPrefs.evidence_per_page,
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
    try {
      await updateUserPreferences(prefs);
      dispatch(setCurrentPrefs(prefs));
      preferencesSavedToast();
    } catch (error) {
      console.error("Failed to update preferences:", error);
      errorToast("Failed to update preferences. Please try again.");
    }
  }

  const handlePrefValueClick = async (prefKey: PrefKey, prefValue: string | number) => {
    const newPrefs = cloneDeep(userPrefs);
    newPrefs[prefKey].pref_value = prefValue;
    setUserPrefs(newPrefs);
    setActivePrefObject(null);
    await handleSubmitUserPrefs(newPrefs);
  };

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
                  <p>Log in to view your query history, projects, bookmarks, and notes.<br/><Button href={getFormattedLoginURL(location)} title="Log In" className={styles.loginButton} variant="textOnly" inline>Log In</Button></p>
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
              <SidebarTransitionButton 
                handleClick={() => setActivePrefTypeId("results")}
                label="Results"
              />
              <SidebarTransitionButton 
                handleClick={() => setActivePrefTypeId("evidence")}
                label="Evidence"
              />
              <SidebarTransitionButton 
                handleClick={() => setActivePrefTypeId("graphs")}
                label="Graphs"
              />
            </div>
            {
              activePrefTypeId && 
              <InteriorPanelContainer
                handleBack={() => setActivePrefTypeId(null)}
                backButtonLabel={capitalizeFirstLetter(activePrefTypeId)}
              >
                <div className={styles.activePrefTypeContent}>
                  {
                    prefsToDisplay && Object.entries(prefsToDisplay).map(([key, pref]) => (
                      <div className={styles.activePref} key={key}>
                        <h6 className={styles.prefLabel}>{pref.name}</h6>
                        <Button 
                          className={styles.prefValueButton}
                          variant="secondary"
                          iconRight={<ChevRight />}
                          handleClick={() => handleSetActivePrefObject(key as PrefKey, userPrefs)}
                        >
                          {getPrettyPrefValue(pref.pref_value)}
                        </Button>
                      </div>
                    ))
                  }
                </div>
              </InteriorPanelContainer>
            }
            {
              activePrefObject && activePrefObject.prefObject.possible_values &&
              <InteriorPanelContainer
                handleBack={() => setActivePrefObject(null)}
                backButtonLabel={activePrefObject.prefObject.name}
              >
                <div className={styles.activePrefContent}>
                  {activePrefObject.prefObject.possible_values.map((value) => (
                    <Button
                      key={value}
                      className={`${styles.prefValueSelectorButton} ${userPrefs[activePrefObject.prefKey].pref_value === value ? styles.active : ''}`}
                      variant="secondary"
                      handleClick={() => handlePrefValueClick(activePrefObject.prefKey, value)}
                      >
                      {getPrettyPrefValue(value)}
                    </Button>
                  ))}
                </div>
              </InteriorPanelContainer>
            }
          </>
        }
      </LoadingWrapper>
    </div>
  );
};

export default SettingsPanel;