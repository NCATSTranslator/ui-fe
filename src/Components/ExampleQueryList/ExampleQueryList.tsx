import { FC, useState, useEffect } from 'react';
import styles from './ExampleQueryList.module.scss';
import { getResultsShareURLPath } from '../../Utilities/resultsInteractionFunctions';
import { queryTypes } from '../../Utilities/queryTypes';
import AnimateHeight from 'react-animate-height';
import Button from '../Core/Button';
import ChevDown from '../../Icons/Directional/Chevron/Chevron Down.svg?react';

type Example = {
  id: string;
  name: string;
  type: string;
  direction: string;
  uuid: string;
};

type ExampleQueryListProps = {
  examples: Example[];
  setPresetURL: (url: string) => void;
  className?: string;
};

const ExampleQueryList: FC<ExampleQueryListProps> = ({
  examples,
  setPresetURL,
  className = ""
}) => {
  const minHeight = 32;
  const [height, setHeight] = useState<number | string>(minHeight);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  }

  useEffect(() => {
    if(isExpanded === false)
      setHeight(minHeight);
    else
      setHeight('auto');
  }, [isExpanded])

  return (
    <div className={`${styles.examplesContainer} ${className} ${isExpanded && styles.expanded}`}>
      {
        (examples?.length > 0 && examples[0].type === "drug") &&
        <Button handleClick={handleToggle} className={styles.expandButton} iconOnly><ChevDown/></Button>
      }
      <div className="top">
        <p className={`${styles.subTwo} sub-two`}>Examples</p>
        <p className={`caption`}>Choose a different question for more options.</p>
      </div>
      <div className={styles.examples}>
        {examples && Array.isArray(examples) && (
          <>
            <AnimateHeight
              className={`${styles.exampleList}`}
              duration={500}
              height={height}
            >
              {examples.map((item, i) => {
                const typeID =
                  item.type === "drug"
                    ? 0
                    : queryTypes.findIndex(
                        (el) =>
                          el.direction &&
                          el.direction.toLowerCase() === item.direction.toLowerCase() &&
                          el.targetType.toLowerCase() === item.type.toLowerCase()
                      );
                return (
                  <button
                    className={`${styles.button} example-query`}
                    onClick={() => setPresetURL(getResultsShareURLPath(item.name, item.id, typeID, '0', item.uuid))}
                    data-testid={item.name}
                    data-url={getResultsShareURLPath(item.name, item.id, typeID, '0', item.uuid)}
                    key={item.id}
                  >
                    {item.name}
                  </button>
                );
              })}
            </AnimateHeight>
          </>
        )}
      </div>
    </div>
  );
};

export default ExampleQueryList;
