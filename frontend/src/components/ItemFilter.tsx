import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ItemFilterProps {
  onFilter: (query: string) => void;
  placeholder?: string;
}

export const ItemFilter = ({ onFilter, placeholder = 'Buscar itens...' }: ItemFilterProps) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      onFilter(query);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [query, onFilter]);

  const handleClear = () => {
    setQuery('');
    onFilter('');
  };

  return (
    <div className="bg-gray-800 dark:bg-gray-900 rounded-md p-2 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
      <div className="flex w-full relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-300 dark:text-gray-500" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          className="pl-9 pr-10 py-2 w-full rounded-md bg-[#373739] dark:bg-[#191919] border-0 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-light"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}; 