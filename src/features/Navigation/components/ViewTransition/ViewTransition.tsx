import { FC, ReactNode } from 'react';
import { Fade } from 'react-awesome-reveal';
import { useLocation } from 'react-router-dom';

interface ViewTransitionProps {
  children: ReactNode;
  effect?: 'fade' | 'none';
  duration?: number;
  transitionKey?: string;
}

const ViewTransition: FC<ViewTransitionProps> = ({
  children,
  effect = 'fade',
  duration = 250,
  transitionKey,
}) => {
  const location = useLocation();

  if (effect === 'none') return <>{children}</>;

  return (
    <Fade key={transitionKey ?? location.pathname} duration={duration} triggerOnce>
      {children}
    </Fade>
  );
};

export default ViewTransition;
