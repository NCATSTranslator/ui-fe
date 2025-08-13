import { useState, ReactNode } from 'react';
import Footer from '@/features/Page/components/Footer/Footer';
import Header from '@/features/Page/components/Header/Header';
import SmallScreenOverlay from '@/features/Common/components/SmallScreenOverlay/SmallScreenOverlay';
import SendFeedbackModal from "@/features/Common/components/SendFeedbackModal/SendFeedbackModal";
import { useGoogleAnalytics, useGoogleTagManager, useWindowSize, useScrollToHash } from '@/features/Common/hooks/customHooks';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import './App.scss';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';
import { useFetchConfigAndPrefs, useGetSessionStatus } from '@/features/UserAuth/utils/userApi';
import { AppToastContainer } from '@/features/Common/components/AppToastContainer/AppToastContainer';

const App = ({children}: {children?: ReactNode}) => {

  const location = useLocation();
  const minScreenWidth = 1024;
  const {width} = useWindowSize();

  const [gaID, setGaID] = useState<string | null>(null);
  useGoogleAnalytics(gaID ?? undefined);
  const [gtmID, setGtmID] = useState<string | null>(null);
  useGoogleTagManager(gtmID ?? undefined);

  let pathnameClass = location.pathname.replace('/', '');
  pathnameClass = (pathnameClass.includes('/')) ? pathnameClass.replace(/\//g, '-') : pathnameClass;
  pathnameClass = (pathnameClass === "") ? "home" : pathnameClass;

  let additionalClasses = '';
  if(location.pathname.includes('/projects/'))
    additionalClasses += 'project-detail';

  const initFeedbackModalOpen = getDataFromQueryVar("fm") === "true";
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(initFeedbackModalOpen);
  const handleModalClose = () => {
    setFeedbackModalOpen(false);
  }

  const [sessionStatus] = useGetSessionStatus();
  useFetchConfigAndPrefs(sessionStatus ? !!sessionStatus.user : undefined, setGaID, setGtmID);
  useScrollToHash();

  return (
    <div className={`app ${pathnameClass} ${additionalClasses}`}>
      <AppToastContainer />
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
          (width && width < minScreenWidth) && <SmallScreenOverlay /> 
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
          <NavLink to={`/terms-of-use`}
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
