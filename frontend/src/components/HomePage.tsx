import { useEffect, useState } from 'react';
import { PlusIcon, TableCellsIcon, ListBulletIcon, DocumentIcon, LinkIcon, CodeBracketIcon as CodeIcon, LightBulbIcon, XMarkIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useApp } from "../contexts/AppContext";
import { ItemGrid } from "./ItemGrid";
import { EmptyState } from "./EmptyState";
import { AddItemForm } from "./AddItemForm";
import { ItemDetail } from "./ItemDetail";
import { Header } from './Header';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { AddItemEvent } from '../components/AddItemEvent';
import { ViewToggle } from '../components/ViewToggle';
import { ItemFilter } from '../components/ItemFilter';
import { RecentCategories } from '../components/RecentCategories';
import DebugPanel from '../components/DebugPanel';

interface HomePageProps {
  activeCategory?: string | null;
  setActiveCategory?: (category: string | null) => void;
}

export const HomePage = ({ 
  activeCategory = null, 
  setActiveCategory = () => {} 
}: HomePageProps) => {
  const { currentCollection, items, currentItem, setCurrentItem, collections, updateItem } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const collection = currentCollection ? 
    collections.find(c => c.id === currentCollection) : null;
  
  const displayItems = items; // usamos items diretamente se não há filteredItems
  
  // Efeito para resetar o item selecionado quando mudar de coleção
  useEffect(() => {
    setCurrentItem(null);
  }, [currentCollection, setCurrentItem]);

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
    setCurrentItem(itemId);
  };

  // Fechar o detalhe do item
  const handleCloseDetail = () => {
    setCurrentItem(null);
  };

  const { logout } = useAuth();
  
  const handleLogout = () => {
    if (logout) {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        onAddItem={handleAddItem} 
        onCategorySelect={setActiveCategory}
        activeCategory={activeCategory}
      />
      <div className="flex-1 flex flex-col overflow-hidden border-none">
        {/* Header com título da coleção ou "Todos os itens" */}
        <div className="p-3 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold mb-2 md:mb-0">
            {collection?.name || "Todos os itens"}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddItem}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-yellow-400 hover:bg-yellow-300 text-gray-900"
              title="Adicionar item"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Adicionar</span>
            </button>
            <ViewToggle mode={viewType === 'grid' ? 'grid' : 'table'} onChange={toggleViewType} className="hidden md:block" />
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white"
              title="Fazer logout"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
        
        {/* Conteúdo principal */}
        <div className="flex-1 overflow-auto">
          {displayItems.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-2">Nenhum item encontrado</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Adicione seu primeiro item para começar a organizar suas notas, links, códigos e prompts.
                  </p>
                  <button
                    onClick={handleAddItem}
                    className="w-full py-2 px-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-md flex items-center justify-center gap-1"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Adicionar Item</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayItems.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className="cursor-pointer"
                  >
                    <div className="bg-[#373739] dark:bg-[#191919] rounded-xl overflow-hidden border border-gray-700 dark:border-gray-800 hover:border-purple-light dark:hover:border-purple-light shadow-sm hover:shadow-md transition-all flex flex-col h-[320px]">
                      {/* Preview da imagem para links */}
                      {item.type === 'link' && item.preview?.image && (
                        <div className="h-40 overflow-hidden bg-gray-800">
                          <img 
                            src={item.preview.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Se a imagem falhar, esconder o container da imagem
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Cabeçalho com tipo e título */}
                      <div className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full 
                              ${item.type === 'note' ? 'bg-blue-900 text-blue-300' : ''}
                              ${item.type === 'link' ? 'bg-green-900 text-green-300' : ''}
                              ${item.type === 'code' ? 'bg-amber-900 text-amber-300' : ''}
                              ${item.type === 'prompt' ? 'bg-purple-900 text-purple-300' : ''}
                            `}>
                              {item.type}
                            </span>
                            {item.type === 'link' && item.url && (
                              <span className="text-xs text-gray-400 truncate">
                                {(() => {
                                  try {
                                    return new URL(item.url).hostname.replace('www.', '');
                                  } catch {
                                    return '';
                                  }
                                })()}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItem(item.id, { favorite: !item.favorite });
                            }}
                            className={`p-1 rounded-full ${item.favorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-400 hover:text-gray-500'}`}
                          >
                            {item.favorite ? (
                              <span title="Remover dos favoritos">★</span>
                            ) : (
                              <span title="Adicionar aos favoritos">☆</span>
                            )}
                          </button>
                        </div>
                        
                        {/* Título */}
                        <h3 className="font-medium text-white mt-2 truncate">{item.title || "[Sem título]"}</h3>
                        
                        {/* Descrição (se existir) */}
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      
                      {/* Rodapé com data e status */}
                      <div className="mt-auto p-3 text-xs text-gray-500 border-t border-gray-700 flex justify-between items-center">
                        <div>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                        {/* Indicador de compartilhamento */}
                        {item.share && (
                          <span className="text-xs text-blue-400">
                            {item.share.status === 'public' ? '🔗 Temporário' : '🔒 Privado'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Modal de adição de item */}
        {showAddForm && (
          <AddItemForm onClose={handleCloseForm} />
        )}
        
        {/* Modal de detalhe do item */}
        {currentItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-bold">Detalhes do Item</h2>
                <button 
                  onClick={handleCloseDetail}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <h3 className="text-xl font-bold">{currentItem.title}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {currentItem.description || "Sem descrição"}
                </p>
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="whitespace-pre-wrap">
                    {currentItem.content || "Sem conteúdo"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Botão flutuante para adicionar item */}
        <button
          onClick={handleAddItem}
          className="fixed z-10 bottom-6 right-6 p-4 rounded-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 shadow-lg"
          title="Adicionar novo item"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
        
        {/* Componente de Depuração */}
        <DebugPanel />
        
        {/* Botão flutuante para logout (apenas no mobile) */}
        <button
          onClick={handleLogout}
          className="fixed md:hidden z-10 bottom-6 left-6 p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
          title="Fazer logout"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}; 