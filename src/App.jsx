import { useState, useEffect } from 'react';
import Footer from './Components/Footer/Footer';
import Header from './Components/Header/Header';
import SmallScreenOverlay from './Components/SmallScreenOverlay/SmallScreenOverlay';
import SendFeedbackModal from "./Components/Modals/SendFeedbackModal";
import { useGoogleAnalytics, useGoogleTagManager, useWindowSize } from './Utilities/customHooks';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './App.scss';
import { handleFetchErrors, getDataFromQueryVar } from './Utilities/utilities';
import { setCurrentRoot, setCurrentUser, setCurrentPrefs, setCurrentConfig } from './Redux/rootSlice';
import { getUserProfile, getUserPreferences, defaultPrefs } from './Utilities/userApi';

const App = ({children}) => {

  const location = useLocation();
  const minScreenWidth = 1024;
  const {width} = useWindowSize();

  const [gaID, setGaID] = useState(null);
  useGoogleAnalytics(gaID);
  const [gtmID, setGtmID] = useState(null);
  useGoogleTagManager(gtmID);

  const dispatch = useDispatch();
  const root = location.pathname.includes("main") ? "main" : "demo";
  dispatch(setCurrentRoot(root))

  let pathnameClass = location.pathname.replace('/', '');
  pathnameClass = (pathnameClass.includes('/')) ? pathnameClass.replace(/\//g, '-') : pathnameClass;
  pathnameClass = (pathnameClass === "") ? "home" : pathnameClass;

  const initFeedbackModalOpen = getDataFromQueryVar("fm");
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(initFeedbackModalOpen);
  const handleModalClose = () => {
    setFeedbackModalOpen(false);
  }

  useEffect(()=>{

    const fetchUser = async () => {
      let currentUser = null;
      try {
        currentUser = await getUserProfile();
      } catch (err) {
        console.log(err);
      }
      dispatch(setCurrentUser(currentUser));
    };

    const fetchPrefs = async () => {
      let prefs = await getUserPreferences(()=>{console.warn("no prefs found for this user, setting to default prefs.")});
      console.log("initial fetch of user prefs: ", prefs.preferences);
      if(prefs === undefined)
        prefs = defaultPrefs;

      dispatch(setCurrentPrefs(prefs.preferences));
    };

    const fetchConfig = async () => {
      const requestOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      };
      let config = await fetch(`/${root}/api/v1/pub/config`, requestOptions)
        .then(response => handleFetchErrors(response))
        .then(response => response.json());

      if(config?.gaID)
        setGaID(config.gaID);
      if(config?.gtmID)
        setGtmID(config.gtmID);

      dispatch(setCurrentConfig(config));
    }

    fetchConfig();

    if(root !== "main")
      return;
    fetchUser();
    fetchPrefs();
  },[dispatch, root]);

  return (
    <div className={`app ${pathnameClass}`}>
      <SendFeedbackModal isOpen={feedbackModalOpen} onClose={()=>handleModalClose()} />
      <div className='header-disclaimer'>
        <p>This system is for research purposes and is not meant to be used by clinical service providers in the course of treating patients.</p>
      </div>
      <Header />
      <div className='body'>
        {
          children && children
        }
        {
          (width < minScreenWidth) && <SmallScreenOverlay /> 
        }
        <Outlet context={setFeedbackModalOpen}/>
      </div>
      <Footer>
        <nav>
          <a
            href="https://ncats.nih.gov/translator/about"
            rel="noreferrer"
            target="_blank"
          >About Translator</a>
          <NavLink to={`/${root}/terms-of-use`}
            className={({isActive}) => {return (isActive) ? 'active' : '' }}
          >Terms of Use</NavLink>
          <a
            href="https://ncats.nih.gov/privacy"
            rel="noreferrer"
            target="_blank"
          >Privacy Policy</a>
        </nav>
      </Footer>
    </div>
  );
}

export default App;
