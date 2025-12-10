import styles from './BackNavButton.module.scss';
import { useState, useEffect } from 'react';
import Button from "@/features/Core/components/Button/Button";
import ChevLeftIcon from '@/assets/icons/directional/Chevron/Chevron Left.svg?react';
import { useNavigate, useLocation} from 'react-router-dom';
import { usePageTitle } from '@/features/Page/hooks/usePageTitle';
import { getFullPathname } from '@/features/Common/utils/utilities';

type HistoryItem = {
  pathname: string;
  title: string;
};

const BackNavButton = () => {

  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const location = useLocation();
  const { finalTitle } = usePageTitle();

  useEffect(() => {
    // if the last item in the history is the same as the current location, 
    // but the title is different, update the title of the last item
    if(history[history.length - 1]?.pathname === getFullPathname(location) && history[history.length - 1]?.title !== finalTitle) {
      setHistory(prevHistory => 
        prevHistory.map(item => item.pathname === getFullPathname(location) ? { ...item, title: finalTitle } : item)
      );
    } else if(history.length === 0 || history[history.length - 1]?.pathname !== getFullPathname(location)) {
      // if the last item in the history is different from the current location, 
      // add a new item to the history
      setHistory(prevHistory => [...prevHistory, { pathname: getFullPathname(location), title: finalTitle }]);
    }
  }, [location.pathname, finalTitle]);

  const handleBack = () => {
    navigate(history[history.length - 2]?.pathname || '/', { replace: true });
    setHistory(prevHistory => prevHistory.slice(0, -1));
  };

  return (
    history.length > 1 
    ? (
        <Button
          variant="textOnly"
          iconLeft={<ChevLeftIcon />}
          className={styles.backNavButton}
          handleClick={handleBack}
        >
          {history[history.length - 2]?.title}
        </Button>
      ) 
    : null
  );
};

export default BackNavButton;