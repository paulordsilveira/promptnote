import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import { Collection } from '../types';

interface CollectionSelectorProps {
  selectedCollection: string;
  onChange: (collectionId: string) => void;
  existingCollections?: Collection[];
  maxHeight?: number;
}

export const CollectionSelector = ({ selectedCollection, onChange, existingCollections, maxHeight = 60 }: CollectionSelectorProps) => {
  const { collections: appCollections } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Usar existingCollections se fornecido, caso contrário usar collections do contexto
  const collections = existingCollections || appCollections;

  // Filtrar as coleções baseado no que está digitado
  const filteredCollections = collections
    .filter(collection => 
      collection.name.toLowerCase().includes(inputValue.toLowerCase()) && 
      collection.id !== selectedCollection
    )
    .slice(0, 5); // Limita o número de sugestões

  // Configura a coleção selecionada
  const selectCollection = (collectionId: string) => {
    onChange(collectionId);
    setInputValue('');
    setIsDropdownOpen(false);
  };

  // Obtém o nome da coleção selecionada
  const getSelectedCollectionName = () => {
    if (!selectedCollection) return '';
    const collection = collections.find(c => c.id === selectedCollection);
    return collection ? collection.name : '';
  };

  // Fecha o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex flex-wrap gap-2 p-2 bg-gray-700 dark:bg-gray-700 rounded-md border border-gray-600 min-h-[50px]">
        {selectedCollection ? (
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-800 text-green-400 rounded-full text-sm">
            <FolderIcon className="h-3 w-3" />
            <span>{getSelectedCollectionName()}</span>
            <button 
              onClick={() => onChange('')}
              className="text-gray-400 hover:text-white p-1"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </div>
        ) : null}
        
        <div className="flex-1 min-w-[100px]">
          <input
            type="text"
            className="w-full bg-transparent border-none outline-none text-white"
            placeholder={selectedCollection ? "Alterar coleção..." : "Selecionar coleção..."}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue && filteredCollections.length > 0) {
                e.preventDefault();
                selectCollection(filteredCollections[0].id);
              }
            }}
            onFocus={() => setIsDropdownOpen(true)}
          />
        </div>
      </div>
      
      {isDropdownOpen && (inputValue || filteredCollections.length > 0) && (
        <div className={`absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-${maxHeight} overflow-auto`}>
          {filteredCollections.length > 0 ? (
            <ul>
              {filteredCollections.map(collection => (
                <li 
                  key={collection.id}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-center space-x-2"
                  onClick={() => selectCollection(collection.id)}
                >
                  <FolderIcon 
                    className="h-4 w-4 flex-shrink-0 text-green-400" 
                  />
                  <span className="text-white">{collection.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            inputValue && (
              <div 
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-center"
                onClick={() => {
                  // Aqui poderia criar uma nova coleção no futuro
                  alert('Funcionalidade para criar nova coleção não implementada ainda');
                }}
              >
                <PlusIcon className="h-4 w-4 mr-2 text-green-400" />
                <span className="text-white">Criar coleção "{inputValue}"</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}; 