import { FC } from "react";
import styles from './ResultsItemName.module.scss';
import { ResultItem } from "../../Types/results";
import { getIcon } from "../../Utilities/utilities";
import Highlighter from "react-highlight-words";
import ArrowIcon from "../../Icons/Directional/Arrows/Arrow Right.svg?react";
import { getFormattedPathfinderName } from "../../Utilities/resultsFormattingFunctions";

type ResultsItemNameProps = {
  isPathfinder?: boolean;
  item: ResultItem;
  activeEntityFilters: string[];
  nameString: string;
  resultsItemStyles: { [key: string]: string;};
}

const ResultsItemName: FC<ResultsItemNameProps> = ( {isPathfinder = false, item, activeEntityFilters, nameString, resultsItemStyles }) => {

  const icon: JSX.Element = getIcon(item.type);
  const pathfinderNameArray = (isPathfinder) ? item.name.split("/") : null; 
  const subjectIcon: JSX.Element | null = item.subjectNode?.types.length > 0 ? getIcon(item.subjectNode.types[0]) : null;
  const objectIcon: JSX.Element | null = item.objectNode?.types.length > 0 ? getIcon(item.objectNode.types[0]) : null;

  return (
    <>
      {
        isPathfinder 
        ?
          <>
            {
              pathfinderNameArray?.map( (name, i) => {
                const isNotLastItem = (i < pathfinderNameArray.length - 1);
                const pfNameString = (i!== 0 && isNotLastItem) ? getFormattedPathfinderName(name) : name;
                const originalBiolinkName = `biolink:${pfNameString.replaceAll(" ", "_")}`;
                return (
                  <span className={styles.nameContainer}>
                    {
                      i === 0 &&
                      subjectIcon
                    }
                    {
                      !isNotLastItem &&
                      objectIcon
                    }
                    {
                      i !== 0 && isNotLastItem &&
                      getIcon(originalBiolinkName)
                    }
                    <Highlighter
                      highlightClassName="highlight"
                      searchWords={activeEntityFilters}
                      autoEscape={true}
                      textToHighlight={pfNameString}
                      className={`${styles.name} ${resultsItemStyles.name}`}
                    /> 
                    {
                      (isNotLastItem) &&
                      <ArrowIcon className={styles.arrow}/>
                    }
                  </span>
                )
              })
            }
          </>
        :
          <>
            <span className={resultsItemStyles.icon}>{icon}</span>
            <span className={resultsItemStyles.name} >
              <Highlighter
                highlightClassName="highlight"
                searchWords={activeEntityFilters}
                autoEscape={true}
                textToHighlight={nameString}
              />
            </span>
          </>
      }
    </>
  )
}

export default ResultsItemName;