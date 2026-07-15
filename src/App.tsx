import { useState, ReactNode, lazy, Suspense } from 'react';
import './App.scss';
import { useGoogleAnalytics } from '@/features/Core/hooks/useGoogleAnalytics';
import { useGoogleTagManager } from '@/features/Core/hooks/useGoogleTagManager';
import { useWindowSize } from '@/features/Core/hooks/useWindowSize';
import { useScrollToHash } from '@/features/Core/hooks/useScrollToHash';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { MAIN_CONTENT_ELEMENT_ID } from '@/features/Navigation/utils/navigationUtils';
import { commonQueryClientOptions } from '@/features/Core/utils/queryClientConfig';
import { useFetchConfigAndPrefs, useGetSessionStatus } from '@/features/UserAuth/utils/userApi';
import { AppToastContainer } from '@/features/Core/components/AppToastContainer/AppToastContainer';
import Footer from '@/features/Page/components/Footer/Footer';
import SmallScreenOverlay from '@/features/Core/components/SmallScreenOverlay/SmallScreenOverlay';
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
import { getPathnameClasses, joinClasses } from '@/features/Core/utils/classHelpers';
import CanvasHeaderButton from '@/features/Canvas/components/CanvasHeaderButton/CanvasHeaderButton';
import { CanvasContextMenuProvider } from '@/features/Canvas/components/CanvasContextMenu/CanvasContextMenu';

// Lazy so translator-graph-view stays out of the entry chunk.
const CanvasPane = lazy(() => import('@/features/Canvas/components/CanvasPane/CanvasPane'));

const queryClient = new QueryClient(commonQueryClientOptions);

const App = ({children}: {children?: ReactNode}) => {

  const location = useLocation();
  const minScreenWidth = 1024;
  const {width} = useWindowSize();
  const isSmallScreen = width && width < minScreenWidth;

  const [gaID, setGaID] = useState<string | null>(null);
  useGoogleAnalytics(gaID ?? undefined);
  const [gtmID, setGtmID] = useState<string | null>(null);
  useGoogleTagManager(gtmID ?? undefined);

  const { pathnameClass, additionalClasses } = getPathnameClasses(location.pathname);


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
          <CanvasContextMenuProvider>
          <div className={joinClasses('app', pathnameClass, additionalClasses)}>
            <AppToastContainer />
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="layout">
                <Sidebar className={isSmallScreen ? 'smallScreen' : ''} />
                <main id={MAIN_CONTENT_ELEMENT_ID} className='content scrollable'>
                  <Header>
                    <CanvasHeaderButton />
                  </Header>
                  {children}
                  {
                    isSmallScreen && <SmallScreenOverlay /> 
                  }
                  <Outlet />
                  <Footer>
                    <nav>
                      <a
                        href="https://ncats.nih.gov/translator/about"
                        rel="noreferrer"
                        target="_blank"
                      >About Translator</a>
                      <NavLink to={`/terms-of-use`}
                        className={({isActive}) => joinClasses(isActive && 'active')}
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
            <Suspense fallback={null}>
              <CanvasPane />
            </Suspense>
          </div>
        </CanvasContextMenuProvider>
        </ProjectModalsProvider>
      </QueryClientProvider>
    </SidebarProvider>
  );
}

export default App;
