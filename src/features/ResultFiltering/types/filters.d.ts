export type FilterType = 'p' | 'r' | 'g' | 'e';
export type FilterFamily = 'cc' | 'di' | 'pc' | 'pred' | 'pt' | 'role' | 'ara' | 'otc' | 'tdl' | 'str' | 'sv' | 'ev';

export type Filter = {
  count?: number;
  name: string;
  negated?: boolean;
  id?: string;
  value?: string;
  includeWeight?: number;
  excludeWeight?: number;
}

export type Filters =  {[key: string]: Filter};

export type GroupedFilters = {
  [key in FilterFamily]?: {[key: string]: Filter};
}
export type DynamicTag = {
  id: string;
  name: string;
  value: string;
}

