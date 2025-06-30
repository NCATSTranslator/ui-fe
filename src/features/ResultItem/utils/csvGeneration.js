import { getTypeFromPub, getUrlByType } from "./utilities";

const getUrlArrayFromPubIDs = (ids) => {
  let urlsFromIds = [];
  for(const id of ids) {
    let type = getTypeFromPub(id);
    let url = getUrlByType(id, type);
    if(url)
      urlsFromIds.push(url);
  }
  return urlsFromIds;
}

export const generateCsvFromItem = (item, csvSetter) => {
  return () => {
    const headers = [
      'Result Name', 'Result CURIE', 'Target Name', 'Target CURIE',
      'Subject Name', 'Subject CURIE', 'Predicate', 'Object Name', 
      'Object CURIE', 'EPC'
    ];
    const csvData = [headers];
    const resultName = item.name;
    const resultCurie = item.rawResult.subject;
    const targetName = item.object;
    const targetCurie = item.rawResult.object;
    const seen = new Set();
    item.compressedPaths.forEach((path) => {
      const subgraph = path.path.subgraph;
      for (let i = 1; i < subgraph.length; i+=2) { // Only look at edges
        const edgeGroup = subgraph[i];
        const edge = edgeGroup.edges[0];
        const edgeId = edge.id;
        if (!seen.has(edgeId)) {
          seen.add(edgeId);
          const pubs = (item?.evidence?.publications) 
            ? item.evidence.publications.filter((pub) => {
                return pub.edges[edgeId] !== undefined;
              }).map((pub) => pub.url)
            : (subgraph[i]?.publications.length > 0) 
              ? getUrlArrayFromPubIDs(subgraph[i].publications)
              : null;
          const sources = item.evidence.sources.filter((source) => {
            return source.edges[edgeId] !== undefined;
          }).map((source) => source.url);
          const epc = (pubs !== null) ? pubs.concat(sources) : sources;
          const subjectName = edge.subject.name;
          const subjectCurie = edge.subject.id;
          const predicate = edge.predicate;
          const objectName = edge.object.name;
          const objectCurie = edge.object.id;
          csvData.push([
            resultName, resultCurie, targetName, targetCurie,
            subjectName, subjectCurie, predicate, objectName,
            objectCurie, epc[0]
          ]);

          for (let j = 1; j < epc.length; j++) {
            csvData.push(['', '', '', '', '', '', '', '', '', epc[j]]);
          }
        }
      }
    });

    csvSetter(csvData);
  };
}
