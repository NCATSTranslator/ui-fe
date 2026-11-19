import { FC } from 'react';
import StepperButtons from '@/features/Navigation/components/StepperButtons/StepperButtons';
import { useResultStepper } from '@/features/ResultItem/hooks/useResultStepper';

interface ResultStepperProps {
  /** The result being viewed. */
  resultId: string;
}

/** Arrows that open the result before or after the one being viewed. */
const ResultStepper: FC<ResultStepperProps> = ({ resultId }) => {
  const { goToPrevious, goToNext } = useResultStepper(resultId);

  return <StepperButtons itemLabel="result" onPrevious={goToPrevious} onNext={goToNext} />;
};

export default ResultStepper;
