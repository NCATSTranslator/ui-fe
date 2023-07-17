import { useRef, useState, useEffect } from 'react';
import AnimateHeight from '../AnimateHeight/AnimateHeight.tsx';

const AutoHeight = ({ children, ...props }) => {
  const [height, setHeight] = useState('auto');
  const [resizeObserverSet, setResizeObserverSet] = useState(false);
  const contentDiv = useRef(null);

  useEffect(() => {
    // if(resizeObserverSet || contentDiv.current === null)
    //   return;

    const resizeObserver = new ResizeObserver(() => {
      setHeight(contentDiv.current.clientHeight);
    });

    resizeObserver.observe(contentDiv.current);
    setResizeObserverSet(true);
    return() => {
      resizeObserver.disconnect();
    };
  });


  return (
    <AnimateHeight
      {...props}
      height={height}
      contentClassName="auto-content"
      contentRef={contentDiv}
    >
      {children}
    </AnimateHeight>
  );
};

export default AutoHeight;