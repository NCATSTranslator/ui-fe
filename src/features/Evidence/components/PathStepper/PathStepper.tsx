import { FC } from 'react';
import StepperButtons from '@/features/Navigation/components/StepperButtons/StepperButtons';
import { usePathStepper } from '@/features/Evidence/hooks/usePathStepper';

/**
 * Arrows that open the evidence for the path before or after the one being viewed.
 * Only for a path's evidence view inside the results list, where a path sequence exists.
 */
const PathStepper: FC = () => {
  const { goToPrevious, goToNext } = usePathStepper();

  return <StepperButtons itemLabel="path" onPrevious={goToPrevious} onNext={goToNext} />;
};

export default PathStepper;
