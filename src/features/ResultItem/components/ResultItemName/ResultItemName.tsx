import { FC } from "react";
import styles from './ResultItemName.module.scss';
import { Result, ResultNode } from "@/features/ResultList/types/results.d";
import { formatBiolinkNode, getIcon, getFormattedPathfinderName } from "@/features/Common/utils/utilities";
import Highlighter from "react-highlight-words";
import ArrowIcon from "@/assets/icons/Directional/Arrows/Arrow Right.svg?react";

type ResultItemNameProps = {
  isPathfinder?: boolean;
  subjectNode?: ResultNode;
  objectNode?: ResultNode;
  item: Result;
  activeEntityFilters: string[];
  nameString: string;
  ResultItemStyles: { [key: string]: string;};
}

const ResultItemName: FC<ResultItemNameProps> = ( {isPathfinder = false, subjectNode, objectNode, item, activeEntityFilters, nameString, ResultItemStyles }) => {

  if(!subjectNode || !objectNode) {
    console.warn("Cannot generate result item name, subject or object node prop is missing."); 
    return null;
  }

  const icon: JSX.Element = getIcon(subjectNode.types[0]);
  const pathfinderNameArray = (isPathfinder) ? item.drug_name.split("/") : null;
  const subjectIcon: JSX.Element | null = subjectNode?.types.length > 0 ? icon : null;
  const objectIcon: JSX.Element | null = objectNode?.types.length > 0 ? getIcon(objectNode.types[0]) : null;

  const getPFNameString = (index: number, isNotLastItem: boolean, name: string, subject: ResultNode, object: ResultNode ) => {
    let pfNameString = "";
    if(index === 0 || !isNotLastItem) {
      let type = (index === 0) ? subject.types[0]: object.types[0];
      pfNameString = formatBiolinkNode(name, type, null);
    } else {
      pfNameString = getFormattedPathfinderName(name);
    }
    return pfNameString;
  }

  return (
    <>
      {
        isPathfinder
        ?
          <>
            {
              pathfinderNameArray?.map( (name, i) => {
                const isNotLastItem = (i < pathfinderNameArray.length - 1);
                const pfNameString = getPFNameString(i, isNotLastItem, name, subjectNode, objectNode);
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
                      className={`${styles.name} ${ResultItemStyles.name}`}
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
            <span className={ResultItemStyles.icon}>{icon}</span>
            <span className={ResultItemStyles.name} >
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

export default ResultItemName;