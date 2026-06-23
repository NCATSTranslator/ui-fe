import { ReactNode, FC, SVGProps } from 'react';
import Chemical from '@/assets/icons/queries/Chemical.svg?react';
import Disease from '@/assets/icons/queries/Disease.svg?react';
import Gene from '@/assets/icons/queries/Gene.svg?react';
import Phenotype from '@/assets/icons/queries/Phenotype.svg?react';
import Protein from '@/assets/icons/queries/Gene.svg?react';
import Drug from '@/assets/icons/queries/Drug.svg?react';
import SmallMolecule from '@/assets/icons/queries/Small Molecule.svg?react';
import Taxon from '@/assets/icons/queries/Taxon.svg?react';
import PathologicalProcess from '@/assets/icons/queries/Pathological Process.svg?react';
import PhysiologicalProcess from '@/assets/icons/queries/Physiological Process.svg?react';
import BiologicalEntity from '@/assets/icons/queries/Biological Entity.svg?react';
import AnatomicalEntity from '@/assets/icons/queries/Anatomical Entity.svg?react';
import BiologicalProcess from '@/assets/icons/queries/Biological Process.svg?react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import BlankIcon from '@/assets/icons/blank.svg?react';
import { QueryType } from '@/features/Query/types/querySubmission';

const NODE_ICON_MAP: Record<string, FC<SVGProps<SVGSVGElement>>> = {
  'biolink:ChemicalEntity': Chemical,
  'biolink:ChemicalMixture': Chemical,
  'biolink:MolecularMixture': Chemical,
  'biolink:ComplexMolecularMixture': Chemical,
  'biolink:Gene': Gene,
  'phenotype': Phenotype,
  'biolink:PhenotypicFeature': Phenotype,
  'biolink:Protein': Protein,
  'biolink:Polypeptide': Protein,
  'biolink:Drug': Drug,
  'biolink:Disease': Disease,
  'biolink:SmallMolecule': SmallMolecule,
  'biolink:Small_Molecule': SmallMolecule,
  'biolink:MolecularEntity': SmallMolecule,
  'biolink:MolecularActivity': SmallMolecule,
  'biolink:OrganismTaxon': Taxon,
  'biolink:PathologicalProcess': PathologicalProcess,
  'biolink:BiologicalProcess': BiologicalProcess,
  'biolink:BiologicalProcessOrActivity': BiologicalProcess,
  'biolink:Pathway': BiologicalProcess,
  'biolink:PhysiologicalProcess': PhysiologicalProcess,
  'biolink:BiologicalEntity': BiologicalEntity,
  'biolink:CellLine': BiologicalEntity,
  'biolink:CellularComponent': BiologicalEntity,
  'biolink:Cell': BiologicalEntity,
  'biolink:AnatomicalEntity': AnatomicalEntity,
  'biolink:GrossAnatomicalStructure': AnatomicalEntity,
};

export const getNodeIcon = (category: string): ReactNode => {
  const IconComponent = NODE_ICON_MAP[category];
  return IconComponent ? <IconComponent /> : <BlankIcon />;
};

interface EntityUrlConfig {
  pattern: string;
  urlTemplate: (id: string) => string;
  org: string;
}

const ENTITY_URL_CONFIGS: EntityUrlConfig[] = [
  { pattern: 'CHEBI', urlTemplate: (id) => `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${id}`, org: 'Chemical Entities of Biological Interest' },
  { pattern: 'CHEMBL', urlTemplate: (id) => `https://www.ebi.ac.uk/chembl/compound_report_card/${id.replace(':', '')}/`, org: 'ChEMBL' },
  { pattern: 'MONDO', urlTemplate: (id) => `https://monarchinitiative.org/${id}`, org: 'Monarch Initiative' },
  { pattern: 'HP', urlTemplate: (id) => `https://hpo.jax.org/app/browse/term/${id}`, org: 'Human Phenotype Ontology' },
  { pattern: 'UMLS', urlTemplate: (id) => `https://uts.nlm.nih.gov/uts/umls/concept/${id.replace('UMLS:', '')}`, org: 'UMLS Terminology Services' },
  { pattern: 'OMIM', urlTemplate: (id) => `https://bioportal.bioontology.org/search?q=${id.replace('OMIM:', '')}`, org: 'BioPortal' },
  { pattern: 'SNOMED', urlTemplate: (id) => `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${id.replace('SNOMEDCT:', '')}`, org: 'the SNOMED CT Browser' },
  { pattern: 'MEDDRA', urlTemplate: (id) => `https://bioportal.bioontology.org/ontologies/MEDDRA?p=classes&conceptid=${id.replace('MEDDRA:', '')}`, org: 'BioPortal' },
  { pattern: 'KEGG', urlTemplate: (id) => `https://www.kegg.jp/kegg-bin/search?q=${id.replace('KEGG.DISEASE:', '')}&display=disease&from=disease`, org: 'Kyoto Encyclopedia of Genes and Genomes' },
  { pattern: 'NCIT', urlTemplate: (id) => `https://ncithesaurus.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_Thesaurus&ns=ncit&code=${id.replace('NCIT:', '')}`, org: 'NCI Thesaurus' },
  { pattern: 'NCBIGENE', urlTemplate: (id) => `https://www.ncbi.nlm.nih.gov/gene/${id.replace('NCBIGene:', '')}`, org: 'NCBI Gene' },
  { pattern: 'PUBCHEM', urlTemplate: (id) => `https://pubchem.ncbi.nlm.nih.gov/compound/${id.replace('PUBCHEM.COMPOUND:', '')}`, org: 'PubChem' },
  { pattern: 'HMDB', urlTemplate: (id) => `https://hmdb.ca/metabolites/${id.replace('HMDB:', '')}`, org: 'HMDB' },
  { pattern: 'UNII', urlTemplate: (id) => `https://precision.fda.gov/uniisearch/srs/unii/${id.replace('UNII:', '')}`, org: 'UNII' },
  { pattern: 'MESH', urlTemplate: (id) => `https://www.ncbi.nlm.nih.gov/mesh/?term=${id.replace('MESH:', '')}`, org: 'MeSH' },
  { pattern: 'GO', urlTemplate: (id) => `https://www.ebi.ac.uk/QuickGO/GTerm?id=${id}`, org: 'GO' },
];

export const getUrlAndOrg = (id: string): (string | null)[] => {
  const formattedID = id.toUpperCase();
  const config = ENTITY_URL_CONFIGS.find(c => formattedID.includes(c.pattern));
  if (config) {
    return [config.urlTemplate(id), config.org];
  }
  return [null, null];
};

export const getEntityLink = (id: string, className: string, queryType: QueryType): ReactNode | null => {
  return generateEntityLink(id, className, (org) => {
    let linkType = (queryType !== undefined && queryType.filterType) ? queryType.filterType.toLowerCase() : 'term';
    if(linkType === "smallmolecule")
      linkType = "small molecule";
    if(linkType === "diseaseorphenotypicfeature")
      linkType = (id.includes("MONDO")) ? "disease" : "phenotype";
    return `View this ${linkType} on ${org}`;
  });
};

export const getMoreInfoLink = (id: string, className: string): ReactNode | null => {
  return generateEntityLink(id, className, () => { return ' '});
};

export const generateEntityLink = (id: string, className: string, linkTextGenerator: (org: string | null) => string, useIcon = true): ReactNode | null => {
  const [url, org] = getUrlAndOrg(id);
  const linkText = linkTextGenerator(org);

  if(url && linkText)
    return(
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={className}
        >{linkText}{useIcon && <ExternalLink/>}
      </a>
    );

  return <span className={className}>{linkText}</span>;
};
