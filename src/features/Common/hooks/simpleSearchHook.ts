import { useCallback, useState } from 'react';
import { debounce } from 'lodash';

export const useSimpleSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchTerm(searchTerm);
    }, 500),
    []
  );

  const handleSearch = useCallback((value: string) => {
    if (value.length === 0) {
      debouncedSearch.cancel();
      setSearchTerm('');
    } else {
      debouncedSearch(value);
    }
  }, [debouncedSearch]);

  return {
    searchTerm,
    handleSearch
  };
};