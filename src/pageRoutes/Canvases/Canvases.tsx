import { Navigate } from 'react-router-dom';
import CanvasList from '@/features/Canvas/components/CanvasList/CanvasList';
import useCanvasEnabled from '@/features/Canvas/hooks/useCanvasEnabled';

const Canvases = () => {
  const [canvasEnabled] = useCanvasEnabled();

  if (!canvasEnabled) {
    return <Navigate to="/" replace />;
  }

  return <CanvasList />;
};

export default Canvases;
