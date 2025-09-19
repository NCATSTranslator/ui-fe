import { useCallback, useState } from 'react';
import { debounce } from 'lodash';

export const useSimpleSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchTerm(searchTerm);
    }, 500),
    [setSearchTerm]
  );

  const handleSearch = (value: string) => {
    if (value.length === 0) {
      debouncedSearch.cancel();
      setSearchTerm('');
    } else {
      debouncedSearch(value);
    }
  };

  return {
    searchTerm,
    handleSearch
  };
};