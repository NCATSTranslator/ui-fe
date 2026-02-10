export type FilterType = 'p' | 'r' | 'g';
export type FilterFamily = 'cc' | 'di' | 'pc' | 'pt' | 'role' | 'ara' | 'otc' | 'tdl' | 'str' | 'sv' | 'ev' | 'txt';

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

