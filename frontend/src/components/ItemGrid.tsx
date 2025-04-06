import { PlusIcon } from '@heroicons/react/24/outline';
import { EmptyState } from './EmptyState';
import { ItemCard } from './ItemCard';
import { Item } from '../types';
import { DocumentIcon } from '@heroicons/react/24/outline';

interface ItemGridProps {
  items?: Item[];
  onAddItem: () => void;
  onSelect?: (id: string) => void;
  onToggleFavorite?: (id: string, favorite: boolean) => void;
  categoryFilter?: string;
}

export const ItemGrid = ({ 
  items: propItems, 
  onAddItem, 
  onSelect,
  onToggleFavorite,
  categoryFilter
}: ItemGridProps) => {
  // Removendo a filtragem adicional pois já está sendo feita no componente HomePage
  const filteredItems = propItems;
  
  // Se não forem fornecidos itens via props ou não há itens após filtro, 
  // renderizamos o estado vazio
  if (!filteredItems || filteredItems.length === 0) {
    return (
      <EmptyState
        title="Nenhum item encontrado"
        description="Nenhum item corresponde aos seus critérios de busca ou esta categoria está vazia."
        buttonText="Adicionar Item"
        onAction={onAddItem}
      />
    );
  }

  const handleSelectItem = (id: string) => {
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleToggleFavorite = (id: string, favorite: boolean) => {
    if (onToggleFavorite) {
      onToggleFavorite(id, favorite);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3 auto-rows-[320px]">
      {/* Card para adicionar um novo item - visível apenas em desktop */}
      <div 
        onClick={onAddItem}
        className="hidden md:flex bg-[#373739] dark:bg-[#191919] rounded-xl overflow-hidden border border-gray-700 dark:border-gray-800 hover:border-purple-light shadow-sm hover:shadow-md transition-all cursor-pointer flex-col justify-center items-center h-full"
      >
        <div className="flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors">
          <div className="p-3 rounded-full bg-gray-800 mb-3">
            <PlusIcon className="h-8 w-8" />
          </div>
          <p className="text-sm font-medium">Adicionar Item</p>
        </div>
      </div>

      {filteredItems.map(item => (
        <ItemCard 
          key={item.id} 
          item={item} 
          onSelect={handleSelectItem}
          onToggleFavorite={handleToggleFavorite}
        />
      ))}
    </div>
  );
}; 