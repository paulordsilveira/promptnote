import { useEffect, useState } from 'react';
import { PlusIcon, GridIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { useApp } from "../contexts/AppContext";
import { ItemGrid } from "./ItemGrid";
import { EmptyState } from "./EmptyState";
import { AddItemForm } from "./AddItemForm";
import { ItemDetail } from "./ItemDetail";
import { Header } from './Header';

export const HomePage = () => {
  const { currentCollection, selectedItem, items, setSelectedItem, getCollectionById, filteredItems } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const collection = currentCollection ? getCollectionById(currentCollection) : null;
  
  const displayItems = filteredItems || items;
  
  // Efeito para resetar o item selecionado quando mudar de coleção
  useEffect(() => {
    setSelectedItem(null);
  }, [currentCollection, setSelectedItem]);

  // Funções para lidar com a exibição do formulário
  const handleAddItem = () => {
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
  };

  // Função para alternar o tipo de visualização
  const toggleViewType = () => {
    setViewType(prev => prev === 'grid' ? 'list' : 'grid');
  };

  // Abrir o detalhe do item ao clicar
  const handleItemClick = (itemId: string) => {
    setSelectedItem(itemId);
  };

  // Fechar o detalhe do item
  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col main-content">
      {/* Header com título da coleção ou "Todos os itens" */}
      <Header 
        title={collection?.name || "Todos os itens"} 
        onAddItem={handleAddItem}
        onToggleView={toggleViewType}
        viewType={viewType}
      />
      
      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        {displayItems.length === 0 ? (
          <EmptyState onAddItem={handleAddItem} />
        ) : (
          <ItemGrid items={displayItems} onItemClick={handleItemClick} viewType={viewType} />
        )}
      </div>
      
      {/* Modal de adição de item */}
      {showAddForm && (
        <AddItemForm onClose={handleCloseForm} />
      )}
      
      {/* Modal de detalhe do item */}
      {selectedItem && (
        <ItemDetail itemId={selectedItem} onClose={handleCloseDetail} />
      )}
    </div>
  );
}; 