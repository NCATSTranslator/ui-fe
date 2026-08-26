import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CanvasList from '@/features/Canvas/components/CanvasList/CanvasList';
import { currentConfig, selectCanvasEnabled } from '@/features/UserAuth/slices/userSlice';

const Canvases = () => {
  const config = useSelector(currentConfig);
  const canvasEnabled = useSelector(selectCanvasEnabled);

  // Wait for config so we don't redirect away before include_canvas is known.
  if (!config) return null;
  if (!canvasEnabled) return <Navigate to="/" replace />;

  return <CanvasList />;
};

export default Canvases;
