import { FC, SVGProps } from 'react';
import PubIcon from '@/assets/icons/status/HasPub.svg?react';
import CTIcon from '@/assets/icons/status/HasCT.svg?react';
import DrugLabelIcon from '@/assets/icons/status/HasDrugLabel.svg?react';
import AcceptedOntologyIcon from '@/assets/icons/queries/Accepted Ontology.svg?react';
import { EvidenceTypeKey } from '@/features/Evidence/utils/evidenceLabels';

/**
 * The icon for each evidence type, shared by the evidence view's section headings and the result
 * evidence bar. Miscellaneous evidence and databases have no icon.
 */
export const EVIDENCE_TYPE_ICONS: Partial<Record<EvidenceTypeKey, FC<SVGProps<SVGSVGElement>>>> = {
  publications: PubIcon,
  clinicalTrials: CTIcon,
  drugLabels: DrugLabelIcon,
  acceptedOntologies: AcceptedOntologyIcon,
};
