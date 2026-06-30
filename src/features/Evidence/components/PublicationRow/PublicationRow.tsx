import { FC, ReactNode, useCallback } from "react";
import { PublicationObject, PublicationSupport } from "@/features/Evidence/types/evidence";
import { ResultEdge, ResultSet } from "@/features/ResultList/types/results";
import { getNodeById } from "@/features/ResultList/slices/resultsSlice";
import styles from "@/features/Evidence/components/PublicationsTable/PublicationsTable.module.scss";
import EmphasizeWord from "@/features/Core/components/EmphasizeWord/EmphasizeWord";
import { joinClasses } from "@/features/Core/utils/classHelpers";
import { findPublicationOnEdge } from "@/features/Evidence/utils/utilities";

const buildSupportSnippet = (resultSet: ResultSet, selectedEdge: ResultEdge | null, support: PublicationSupport): ReactNode => {
  const objectNode = getNodeById(resultSet, selectedEdge?.object);
  const subjectNode = getNodeById(resultSet, selectedEdge?.subject);
  return (
    <EmphasizeWord
      text={support.text}
      objectName={objectNode?.names[0] || ""}
      objectPos={support.object || null}
      subjectName={subjectNode?.names[0] || ""}
      subjectPos={support.subject || null}
    />
  );
};

const PublicationRow: FC<{
  pub: PublicationObject;
  resultSet: ResultSet;
  selectedEdge: ResultEdge | null;
}> = ({ pub, resultSet, selectedEdge }) => {
  const getSupportTextOrSnippet = useCallback((): ReactNode | string => {
    const matchingEdgePub = pub?.id && selectedEdge ? findPublicationOnEdge(pub.id, selectedEdge) : false;

    if(!matchingEdgePub || matchingEdgePub.support === null)
      return pub.snippet ?? 'No snippet available.';

    // Just log a warning if no object or subject positions are found for the publication, 
    // we still want to use the provided support text if it's available.
    if(matchingEdgePub.support.object === null || matchingEdgePub.support.subject === null)
      console.warn('No object or subject positions found for publication:', pub, 'on edge:', selectedEdge, 'support:', matchingEdgePub.support);

    return buildSupportSnippet(resultSet, selectedEdge, matchingEdgePub.support);
  }, [pub, resultSet, selectedEdge]);

  return (
    <tr className="table-item" key={pub.id}>
      <td className={joinClasses('table-cell', styles.tableCell, styles.title, 'title')}>
        {
          pub.url && (
            <a href={pub.url} target="_blank" rel="noreferrer">
              {pub.title ?? 'No Title Available'}
            </a>
          )
        }
      </td>
      <td className={joinClasses('table-cell', styles.tableCell, styles.pubdate, 'pubdate')}>
        {pub.pubdate || 'N/A'}
      </td>
      <td className={joinClasses('table-cell', styles.tableCell, styles.source, 'source')}>
        <span>{pub.journal || "N/A"}</span>
      </td>
      <td className={joinClasses('table-cell', styles.tableCell, styles.snippet, 'snippet')}>
        <span>{getSupportTextOrSnippet()}</span>
        {pub.url && (
          <a href={pub.url} className={joinClasses('url', styles.url)} target="_blank" rel="noreferrer">
            Read More
          </a>
        )}
      </td>
      <td className={joinClasses('table-cell', styles.tableCell, styles.knowledgeLevel, 'knowledgeLevel')}>
        {pub.source?.url ? (
          <a className={styles.sourceName} href={pub.source.url} target="_blank" rel='noreferrer'>
            <span>{pub.source.name}</span>
          </a>
        ) : (
          <span className={joinClasses(styles.noLink, styles.sourceName)}>
            {pub.source?.name || "Unknown"}
          </span>
        )}
      </td>
    </tr>
  );
};

export default PublicationRow;