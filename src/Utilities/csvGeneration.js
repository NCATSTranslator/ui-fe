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
    item.paths.forEach((path) => {
      const subgraph = path.path.subgraph;
      for (let i = 1; i < subgraph.length; i+=2) { // Only look at edges
        const edgeGroup = subgraph[i];
        const edge = edgeGroup.edges[0];
        const edgeId = edge.id;
        if (!seen.has(edgeId)) {
          seen.add(edgeId);
          const pubs = item.evidence.publications.filter((pub) => {
            return pub.edges[edgeId] !== undefined;
          }).map((pub) => pub.url);
          const sources = item.evidence.sources.filter((source) => {
            return source.edges[edgeId] !== undefined;
          }).map((source) => source.url);
          const epc = pubs.concat(sources);
          const subjectName = edge.subject.names[0];
          const subjectCurie = edge.subject.id;
          const predicate = edge.predicate;
          const objectName = edge.object.names[0];
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
