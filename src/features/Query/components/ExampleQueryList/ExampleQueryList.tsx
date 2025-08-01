import { FC, useState, useEffect } from 'react';
import styles from './ExampleQueryList.module.scss';
import { getResultsShareURLPath } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { queryTypes } from '@/features/Query/utils/queryTypes';
import AnimateHeight, { Height } from 'react-animate-height';
import Button from '@/features/Core/components/Button/Button';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import { Example } from '@/features/Query/types/querySubmission';
import QueryTypeIcon from '@/features/Query/components/QueryTypeIcon/QueryTypeIcon';

type ExampleQueryListProps = {
  examples: Example[] | null;
  setPresetURL: (url: string) => void;
  className?: string;
};

const ExampleQueryList: FC<ExampleQueryListProps> = ({
  examples,
  setPresetURL,
  className = ""
}) => {
  const minHeight = 32;
  const [height, setHeight] = useState<Height>(minHeight);
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
      <div>
        {
          (!!examples && examples?.length > 0 && examples[0].type === "drug") 
          ?
            <Button handleClick={handleToggle} className={styles.expandButton} iconLeft={<ChevDown/>}>Examples</Button>
          : 
            <p className={styles.exampleHeading}>Examples</p>
        }
        <p className={`${styles.caption} caption`}>Choose a different question for more examples. Run a new search with these terms for the most up-to-date results.</p>
      </div>
      <div className={styles.examples}>
        {examples && Array.isArray(examples) && (
          <>
            <AnimateHeight
              className={`${styles.exampleList}`}
              duration={500}
              height={height}
            >
              {examples.map((item) => {
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
                  <Button
                    className={`${styles.button} example-query`}
                    handleClick={() => setPresetURL(getResultsShareURLPath(item.name, item.id, typeID, '0', item.uuid))}
                    data-testid={item.name}
                    data-url={getResultsShareURLPath(item.name, item.id, typeID, '0', item.uuid)}
                    key={item.id}
                    iconLeft={<QueryTypeIcon type={queryTypes[typeID].searchTypeString}/>}
                    smallFont
                    variant="secondary"
                  >
                    {item.name}
                  </Button>
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
