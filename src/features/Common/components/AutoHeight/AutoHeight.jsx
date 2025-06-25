import { useRef, useState, useEffect } from 'react';
import AnimateHeight from '@/features/Common/components/AnimateHeight/AnimateHeight.tsx';

const AutoHeight = ({ children, ...props }) => {
  const [height, setHeight] = useState('auto');
  const contentDiv = useRef(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setHeight(contentDiv.current.clientHeight);
    });

    resizeObserver.observe(contentDiv.current);
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