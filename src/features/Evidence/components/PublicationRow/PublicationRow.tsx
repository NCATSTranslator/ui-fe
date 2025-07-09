import { FC, ReactNode, useCallback } from "react";
import { PublicationObject, PublicationSupport } from "@/features/Evidence/types/evidence";
import { ResultEdge, ResultSet } from "@/features/ResultList/types/results";
import { getNodeById } from "@/features/ResultList/slices/resultsSlice";
import styles from "@/features/Evidence/components/PublicationsTable/PublicationsTable.module.scss";
import EmphasizeWord from "@/features/Common/components/EmphasizeWord/EmphasizeWord";
import ExternalLink from "@/assets/icons/buttons/External Link.svg?react";

const PublicationRow: FC<{
  pub: PublicationObject;
  resultSet: ResultSet;
  selectedEdge: ResultEdge | null;
}> = ({ pub, resultSet, selectedEdge }) => {
  const getSupportTextOrSnippet = useCallback((): ReactNode | string => {
    const checkEdgeForPub = (pubID: string, edge: ResultEdge): {id: string; support: PublicationSupport;} | false => {
      for (const pubTypeArr of Object.values(edge.publications)) {
        const match = pubTypeArr.find(publication => publication.id === pubID);
        if (match) return match;
      }
      return false;
    };

    const matchingEdgePub = pub?.id && selectedEdge ? checkEdgeForPub(pub.id, selectedEdge) : false;
    
    if (matchingEdgePub && matchingEdgePub.support !== null) {
      const objectNode = getNodeById(resultSet, selectedEdge?.object);
      const objectName = objectNode?.names[0] || "";
      const subjectNode = getNodeById(resultSet, selectedEdge?.subject);
      const subjectName = subjectNode?.names[0] || "";
      
      return (
        <EmphasizeWord
          text={matchingEdgePub.support.text}
          objectName={objectName}
          objectPos={matchingEdgePub.support.object}
          subjectName={subjectName}
          subjectPos={matchingEdgePub.support.subject}
        />
      );
    }
    
    return pub.snippet ?? 'No snippet available.';
  }, [pub, resultSet, selectedEdge]);

  return (
    <tr className="table-item" key={pub.id}>
      <td className={`table-cell ${styles.tableCell} ${styles.title} title`}>
        {pub.title && pub.url ? (
          <a href={pub.url} target="_blank" rel="noreferrer">{pub.title}</a>
        ) : pub.url ? (
          <a href={pub.url} target="_blank" rel="noreferrer">No Title Available</a>
        ) : null}
      </td>
      <td className={`table-cell ${styles.tableCell} ${styles.pubdate} pubdate`}>
        {pub.pubdate || 'N/A'}
      </td>
      <td className={`table-cell ${styles.tableCell} ${styles.source} source`}>
        <span>{pub.journal || "N/A"}</span>
      </td>
      <td className={`table-cell ${styles.tableCell} ${styles.snippet}`}>
        <span>{getSupportTextOrSnippet()}</span>
        {pub.url && (
          <a href={pub.url} className={`url ${styles.url}`} target="_blank" rel="noreferrer">
            Read More <ExternalLink/>
          </a>
        )}
      </td>
      <td className={`table-cell ${styles.tableCell} ${styles.knowledgeLevel}`}>
        {pub.source?.url ? (
          <a className={styles.sourceName} href={pub.source.url} target="_blank" rel='noreferrer'>
            <span>{pub.source.name}</span>
          </a>
        ) : (
          <span className={`${styles.noLink} ${styles.sourceName}`}>
            {pub.source?.name || "Unknown"}
          </span>
        )}
      </td>
    </tr>
  );
};

export default PublicationRow;