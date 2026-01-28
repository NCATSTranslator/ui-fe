import { useState, ReactNode } from 'react';
import './App.scss';
import { useGoogleAnalytics, useGoogleTagManager, useWindowSize, useScrollToHash } from '@/features/Common/hooks/customHooks';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { commonQueryClientOptions, getDataFromQueryVar } from '@/features/Common/utils/utilities';
import { useFetchConfigAndPrefs, useGetSessionStatus } from '@/features/UserAuth/utils/userApi';
import { AppToastContainer } from '@/features/Core/components/AppToastContainer/AppToastContainer';
import Footer from '@/features/Page/components/Footer/Footer';
import SmallScreenOverlay from '@/features/Common/components/SmallScreenOverlay/SmallScreenOverlay';
import SendFeedbackModal from "@/features/Common/components/SendFeedbackModal/SendFeedbackModal";
import SidebarProvider from '@/features/Sidebar/components/SidebarProvider/SidebarProvider';
import Sidebar from '@/features/Sidebar/components/Sidebar/Sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { UserQueryObject } from '@/features/Projects/types/projects.d';
import SidebarQueryCard from '@/features/Sidebar/components/SidebarQueryCard/SidebarQueryCard';
import { createPortal } from 'react-dom';
import Header from '@/features/Page/components/Header/Header';
import { ProjectModalsProvider } from '@/features/Projects/components/ProjectModalsProvider/ProjectModalsProvider';
import DraggableQueryCardWrapper from '@/features/Projects/components/DraggableQueryCardWrapper/DraggableQueryCardWrapper';

const queryClient = new QueryClient(commonQueryClientOptions);

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

  const initFeedbackModalOpen = getDataFromQueryVar("fm", window.location.search) === "true";
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(initFeedbackModalOpen);
  const handleModalClose = () => {
    setFeedbackModalOpen(false);
  }

  const [sessionStatus] = useGetSessionStatus();
  useFetchConfigAndPrefs(sessionStatus ? !!sessionStatus.user : undefined, setGaID, setGtmID);
  useScrollToHash();

  // Drag and drop state
  const [activeQuery, setActiveQuery] = useState<UserQueryObject | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Require 8px movement before drag starts
    })
  );
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'query') {
      const query = active.data.current?.data as UserQueryObject;
      setActiveQuery(query);
    }
  }
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveQuery(null);
    
    if (over?.data.current?.onDrop) {
      try {
        over.data.current.onDrop(active.data.current);
      } catch (error) {
        console.error('Drop failed:', error);
        // Show toast/error message
      }
    }
  }

  return (
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <ProjectModalsProvider>
          <div className={`app ${pathnameClass} ${additionalClasses}`}>
            <AppToastContainer />
            <SendFeedbackModal isOpen={feedbackModalOpen} onClose={()=>handleModalClose()} />
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className='layout'>
                <Sidebar />
                <main className='content scrollable'>
                  <Header />
                  {
                    children && children
                  }
                  {
                    (width && width < minScreenWidth) && <SmallScreenOverlay /> 
                  }
                  <Outlet context={setFeedbackModalOpen}/>
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
                </main>
              </div>
              {createPortal(
                <DragOverlay>
                  {activeQuery && <DraggableQueryCardWrapper><SidebarQueryCard query={activeQuery} className="dragOverlayQueryCard" /></DraggableQueryCardWrapper>}
                </DragOverlay>,
                document.body,
              )}
            </DndContext>
          </div>
        </ProjectModalsProvider>
      </QueryClientProvider>
    </SidebarProvider>
  );
}

export default App;
