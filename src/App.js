import { useState, useEffect } from 'react';
import Footer from './Components/Footer/Footer';
import Header from './Components/Header/Header';
import SmallScreenOverlay from './Components/SmallScreenOverlay/SmallScreenOverlay';
import SendFeedbackModal from "./Components/Modals/SendFeedbackModal";
import { useWindowSize } from './Utilities/customHooks';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux'
import './App.scss';
import { setCurrentRoot, setCurrentUser, setCurrentPrefs } from './Redux/rootSlice';
import { getUserProfile, getUserPreferences, defaultPrefs } from './Utilities/userApi';

const App = ({children}) => {

  const location = useLocation();
  const minScreenWidth = 1024;
  const {width} = useWindowSize();

  const dispatch = useDispatch();
  const root = location.pathname.includes("main") ? "main" : "demo";
  dispatch(setCurrentRoot(root))

  let pathnameClass = location.pathname.replace('/', '');
  pathnameClass = (pathnameClass.includes('/')) ? pathnameClass.replace(/\//g, '-') : pathnameClass;
  pathnameClass = (pathnameClass === "") ? "home" : pathnameClass;

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const handleModalClose = () => {
    setFeedbackModalOpen(false);
  }

  useEffect(()=>{
    if(root !== "main")
      return;

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
  
    fetchUser();
    fetchPrefs();
  },[dispatch, root]);

  return (
    <div className={`app ${pathnameClass}`}>
      <SendFeedbackModal isOpen={feedbackModalOpen} onClose={()=>handleModalClose()} />
      <div className='header-disclaimer'>
        <p>This system is for research purposes and is not meant to be used by clinical service providers in the course of treating patients.</p>
      </div>
      <Header handleFeedbackModalOpen={()=>setFeedbackModalOpen(true)} />
      <div className='body'>
        {
          children 
            ? 
              children
            :
              (width < minScreenWidth)
              ? <SmallScreenOverlay />
              : <Outlet context={setFeedbackModalOpen}/>
        }
      </div>
      <Footer>
        <nav>
          <a 
            href="https://ncats.nih.gov/translator/about"
            rel="noreferrer"
            target="_blank"
          >About Translator</a>
          <NavLink to="/terms-of-use" 
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
