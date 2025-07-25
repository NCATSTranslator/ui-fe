export type Example = {
  id: string;
  name: string;
  type: string;
  direction: string;
  uuid: string;
};

export type QueryType = {
  id: number;
  label: string;
  placeholder: string;
  targetType: string;
  direction: string | null;
  filterType: string;
  limitPrefixes: string[];
  excludePrefixes?: string[];
  functions: AutocompleteFunctions;
  pathString: string;
  searchTypeString: string;
  iconString: string;
}

export type QueryItem = {
  type: QueryType;
  node: AutocompleteItem | null;
}

export type AutocompleteItem = {
  id:string,
  label: string,
  match?: string,
  isExact: boolean,
  score: number,
  types?: string[]
}

export type AutocompleteFunctions = {
  filter: (type: any) => (item: any) => any;
  annotate: (normalizedNodes: any) => Promise<any>;
  format: (items: any, formatData: any) => Promise<any[]>;
}

export type GeneAnnotation = {
  _id: string;
  symbol: string;
  taxid: number;
}

export type NormalizedNode = {
  curie: string;
  [key: string]: any;
}

export type FormatData = {
  input: string;
  resolved: Record<string, string[]>;
}

export type GeneItem = GenericItem & {
  symbol: string;
  species?: string;
}

export type GenericItem = {
  curie: string;
  label: string;
  types: string[];
}

export type ExampleQueries = {
  exampleDiseases: Example[];
  exampleChemsUp: Example[];
  exampleChemsDown: Example[];
  exampleGenesUp: Example[];
  exampleGenesDown: Example[];
}
