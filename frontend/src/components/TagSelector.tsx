import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import { Tag } from '../types';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  existingTags?: Tag[];
  maxHeight?: number;
}

export const TagSelector = ({ selectedTags, onChange, existingTags, maxHeight = 60 }: TagSelectorProps) => {
  const { tags: appTags } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Usar existingTags se fornecido, caso contrário usar tags do contexto
  const tags = existingTags || appTags;

  // Filtrar as tags baseado no que está digitado
  const filteredTags = tags
    .filter(tag => 
      tag.name.toLowerCase().includes(inputValue.toLowerCase()) && 
      !selectedTags.includes(tag.name)
    )
    .slice(0, 5); // Limita o número de sugestões

  // Remove uma tag da seleção
  const removeTag = (tagToRemove: string) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Adiciona uma tag nova ou existente
  const addTag = (tagName: string) => {
    if (tagName.trim() && !selectedTags.includes(tagName.trim())) {
      onChange([...selectedTags, tagName.trim()]);
    }
    setInputValue('');
    setIsDropdownOpen(false);
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
        {selectedTags.map(tag => (
          <div 
            key={tag} 
            className="flex items-center space-x-1 px-2 py-1 bg-gray-800 text-blue-400 rounded-full text-sm"
          >
            <TagIcon className="h-3 w-3" />
            <span>{tag}</span>
            <button 
              onClick={() => removeTag(tag)}
              className="text-gray-400 hover:text-white p-1"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        <div className="flex-1 min-w-[100px]">
          <input
            type="text"
            className="w-full bg-transparent border-none outline-none text-white"
            placeholder={selectedTags.length > 0 ? "Adicionar mais tags..." : "Adicionar tags..."}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue) {
                e.preventDefault();
                addTag(inputValue);
              } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
                removeTag(selectedTags[selectedTags.length - 1]);
              }
            }}
            onFocus={() => setIsDropdownOpen(true)}
          />
        </div>
      </div>
      
      {isDropdownOpen && (inputValue || filteredTags.length > 0) && (
        <div className={`absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-${maxHeight} overflow-auto`}>
          {filteredTags.length > 0 ? (
            <ul>
              {filteredTags.map(tag => (
                <li 
                  key={tag.id}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-center space-x-2"
                  onClick={() => addTag(tag.name)}
                >
                  <TagIcon 
                    className="h-4 w-4 flex-shrink-0" 
                    style={{ color: tag.color }} 
                  />
                  <span className="text-white">{tag.name}</span>
                  <span className="text-gray-400 text-xs">({tag.count})</span>
                </li>
              ))}
            </ul>
          ) : (
            inputValue && (
              <div 
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-center"
                onClick={() => addTag(inputValue)}
              >
                <PlusIcon className="h-4 w-4 mr-2 text-blue-400" />
                <span className="text-white">Criar tag "{inputValue}"</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}; 