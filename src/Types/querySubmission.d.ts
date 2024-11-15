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
  functions: QueryTypeFunctions;
  pathString: string;
  searchTypeString: string;
  iconString: string;
}

export type AutocompleteItem = {
  id:string,
  label: string,
  match: string,
  types: Array<string>
}

export type AutocompleteFunctions = {
  annotate: (nodes: any[]) => Promise<any[]>;
  format: (nodes: any[], formatData: any) => any[];
}