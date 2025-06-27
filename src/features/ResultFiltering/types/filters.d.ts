export type FilterType = 'p' | 'r' | 'g';
export type FilterFamily = 'cc' | 'di' | 'pc' | 'pt' | 'role' | 'ara' | 'otc' | 'tdl' | 'str';

export type Filter = {
  count?: number
  name: string;
  negated?: boolean;
  id?: string;
  value?: string;
}

export type Filters =  {[key: string]: Filter};

export type GroupedFilters = {
  [key in FilterFamily]?: {[key: string]: Filter};
}