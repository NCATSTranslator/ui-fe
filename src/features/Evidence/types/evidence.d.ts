export type PublicationObject = {
  id?: string;
  infores?: string[];
  journal?: string;
  knowledgeLevel?: string;
  pubdate?: string;
  source?: SourceObject;
  snippet?: string;
  support: PublicationSupport | null;
  title?: string;
  type: string;
  url: string;
}
export type PublicationsList = {
  [key: string]: PublicationObject[];
}
export type SourceObject = {
  knowledge_level: string;
  name: string;
  url: string;
}

export type RawPublicationObject = {
  id: string;
  infores: string;
  support: PublicationSupport | null;
}
export type RawPublicationList = {
  [key: string]: RawPublicationObject[];
}
export type EvidenceCountsContainer = {
  acceptedOntologyCount: number;
  clinicalTrialCount: number;
  miscCount: number;
  // DailyMed links, counted separately from the rest of the miscellaneous evidence
  drugLabelCount: number;
  publicationCount: number;
  sourceCount: number;
}

export type ProvenanceCatalogEntry = {
  knowledge_level: KnowledgeLevel;
  name: string | null;
  url: string | null;
  wiki: string | null;
}

export type Provenance = ProvenanceCatalogEntry & {
  infores: string;
}

export type EdgeProvenance = {
  infores: string;
  records: string[];
}

export type PublicationSupport = {
  object: [number, number];
  subject: [number, number];
  text: string;
}

export type KnowledgeLevel = "trusted" | "ml" | "unknown" | "";

export type TrialObject = {
  child: boolean;
  id?: string;
  phase: number;
  size: number;
  // The clinical trials source of the edge the trial is attached to, if the edge has it (see getTrialSources)
  sources?: Provenance[];
  start_date: string;
  status: string;
  title?: string;
  type?: 'enrolled' | 'anticipated';
  url: string;
}

// Fields the service has no value for come back as empty strings or are omitted entirely.
export type PubmedMetadata = {
  abstract?: string;
  article_title?: string;
  issue?: string;
  journal_abbrev?: string;
  journal_name?: string;
  pub_day?: string;
  pub_month?: string;
  pub_year?: string;
  volume?: string;
};

export type PubmedMetadataMap = {
  [id: string]: PubmedMetadata;
};


