# Código Completo HomePage.tsx

```tsx
import { useState, useMemo, useEffect } from 'react';
import { ItemGrid } from '../components/ItemGrid';
import { ItemTable } from '../components/ItemTable';
import { ItemDetail } from '../components/ItemDetail';
import { AddItemEvent } from '../components/AddItemEvent';
import { ViewToggle } from '../components/ViewToggle';
import { ItemFilter } from '../components/ItemFilter';
import { RecentCategories } from '../components/RecentCategories';
import { Sidebar } from '../components/Sidebar';
import DebugPanel from '../components/DebugPanel';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { 
  PlusIcon, 
  DocumentIcon,
  LinkIcon,
  CodeBracketIcon as CodeIcon,
  LightBulbIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

/**
 * NOTA DE CORREÇÃO (10/05/2024):
 * 
 * Problema encontrado: A filtragem por categoria não estava funcionando devido a:
 * 1. Inconsistência nos tipos de dados (string vs object)
 * 2. Comparação estrita sem normalização adequada entre strings
 * 3. Possíveis problemas com case-sensitivity
 * 
 * A solução implementada garante que tanto o tipo do item quanto a categoria ativa
 * são convertidos para string antes da comparação, permitindo que a filtragem
 * funcione corretamente independente da forma como os dados são armazenados.
 */

interface HomePageProps {
  activeCategory?: string | null;
  setActiveCategory?: (category: string | null) => void;
}

export const HomePage = ({ 
  activeCategory = null, 
  setActiveCategory = () => {} 
}: HomePageProps) => {
  const { 
    currentItem,
    currentCollection, 
    collections,
    items, 
    viewMode, 
    setViewMode, 
    setCurrentItem,
    updateItem,
    tags
  } = useApp();
  const { logout } = useAuth();
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showItemTypeSelector, setShowItemTypeSelector] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useDarkMode();

  const handleToggleAddItemForm = () => {
    if (window.innerWidth <= 768) {
      // No mobile, mostrar seletor de tipo de item primeiro
      setShowItemTypeSelector(true);
    } else {
      // No desktop, abrir o formulário diretamente
      setShowAddItemForm(true);
    }
  };
  
  const handleSelectItemType = (type: string) => {
    setSelectedItemType(type);
    setShowItemTypeSelector(false);
    setShowAddItemForm(true);
  };
  
  const handleCloseAddItemForm = () => {
    setShowAddItemForm(false);
    setSelectedItemType(null);
  };

  const handleToggleFavorite = (id: string, favorite: boolean) => {
    updateItem(id, { favorite });
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Encontrar a coleção atual
  const currentCollectionObj = useMemo(() => {
    return currentCollection 
      ? collections.find(c => c.id === currentCollection) || null
      : null;
  }, [currentCollection, collections]);

  // Filtrar itens baseado na categoria selecionada e termo de busca
  const filteredItems = useMemo(() => {
    console.log('🔄 FILTRAGEM: Iniciando com', items.length, 'itens');
    console.log('🔄 FILTRAGEM: Categoria atual =', activeCategory);
    console.log('🔄 FILTRAGEM: Coleção atual =', currentCollection);
    
    // Criar uma nova lista para manter os itens filtrados
    let filtered = [...items];
    
    // Função auxiliar para identificar se um item é do tipo específico
    const isItemOfType = (item: any, type: string) => {
      // Verificação explícita usando múltiplas abordagens
      if (!item) return false;
      
      console.log(`Verificando item "${item.title}" - tipo="${item.type}" contra tipo="${type}"`);
      
      // 1. Verificação direta do atributo type
      if (String(item.type).toLowerCase() === String(type).toLowerCase()) {
        return true;
      }
      
      // 2. Para casos especiais, verificar outros indicadores
      if (type === 'note' && (
        String(item.type).toLowerCase() === 'note' ||
        String(item.type).toLowerCase() === 'nota'
      )) {
        return true;
      }
      
      if (type === 'link' && (
        String(item.type).toLowerCase() === 'link' ||
        String(item.type).toLowerCase() === 'url' ||
        (item.url && !item.content) // Se tem URL mas não conteúdo, provavelmente é um link
      )) {
        return true;
      }
      
      if (type === 'code' && (
        String(item.type).toLowerCase() === 'code' ||
        String(item.type).toLowerCase() === 'codigo' ||
        String(item.type).toLowerCase() === 'código'
      )) {
        return true;
      }
      
      if (type === 'prompt' && (
        String(item.type).toLowerCase() === 'prompt' ||
        String(item.type).toLowerCase() === 'ai' ||
        String(item.type).toLowerCase() === 'ia'
      )) {
        return true;
      }
      
      return false;
    };
    
    // Filtrar por categoria
    if (activeCategory) {
      console.log(`🔍 Filtrando por categoria: "${activeCategory}"`);
      
      if (activeCategory.startsWith('tag:')) {
        // Filtrar por tag
        const tagId = activeCategory.split(':')[1];
        console.log(`🏷️ Filtrando pela tag ID: ${tagId}`);
        filtered = filtered.filter(item => 
          item.tags && item.tags.includes(tagId)
        );
      } else {
        // NOVA ABORDAGEM: Usar nossa função isItemOfType para filtragem mais inteligente
        console.log(`📝 Filtrando pelo tipo: "${activeCategory}" usando função especializada`);
        
        // Listar todos os itens para diagnóstico
        console.log('Lista de todos os itens:');
        items.forEach(item => console.log(`- "${item.title}": tipo=${item.type}`));
        
        // Aplicar nossa função de filtragem
        filtered = filtered.filter(item => isItemOfType(item, activeCategory));
        
        console.log(`Após filtragem por tipo "${activeCategory}": ${filtered.length} itens correspondem`);
      }
    }
    
    // Filtrar pela coleção atual
    if (currentCollection) {
      console.log(`📁 Filtrando pela coleção ID: ${currentCollection}`);
      filtered = filtered.filter(item => item.collection === currentCollection);
      console.log(`✅ Após filtro por coleção: ${filtered.length} itens restantes`);
    }
    
    // Filtrar por termo de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        (item.title?.toLowerCase() || '').includes(query) || 
        (item.content?.toLowerCase() || '').includes(query)
      );
      console.log(`✅ Após filtro por termo: ${filtered.length} itens restantes`);
    }
    
    console.log(`🏁 FILTRAGEM FINAL: ${filtered.length} itens serão exibidos`);
    console.log('Itens resultantes:', filtered.map(item => `${item.title} (tipo: ${item.type})`));
    
    return filtered;
  }, [items, activeCategory, currentCollection, searchQuery]);

  // Define o título da página baseado na seleção atual
  const pageTitle = useMemo(() => {
    if (activeCategory) {
      // Verifica se é uma tag
      if (activeCategory.startsWith('tag:')) {
        const tagId = activeCategory.split(':')[1];
        const tagObj = tags.find((tag: {id: string; name: string}) => tag.id === tagId);
        return tagObj ? `Tag: ${tagObj.name}` : 'Tag';
      }
      
      // Ou se é um tipo de item
      switch (activeCategory) {
        case 'note': return 'Notas';
        case 'link': return 'Links';
        case 'code': return 'Códigos';
        case 'prompt': return 'Prompts';
        default: return 'Todos os itens';
      }
    }
    return currentCollectionObj ? currentCollectionObj.name : 'Todos os itens';
  }, [currentCollectionObj, activeCategory, tags]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        onAddItem={handleToggleAddItemForm} 
        onCategorySelect={setActiveCategory}
        activeCategory={activeCategory}
      />
      <div className="flex-1 flex flex-col overflow-hidden border-none">
        <div className="flex-1 flex overflow-hidden border-none">
          {currentItem ? (
            <ItemDetail />
          ) : (
            <div className="flex-1 overflow-y-auto border-none">
              <div className="p-3 flex flex-col gap-3 border-none">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 md:mb-0">
                  <h1 className="text-xl font-bold mb-2 md:mb-0 text-white">
                    {pageTitle}
                  </h1>
                  <div className="flex items-center gap-3">
                    <ViewToggle mode={viewMode} onChange={setViewMode} className="hidden md:block" />
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
                
                {/* Lista de categorias recentes para mobile */}
                <RecentCategories onCategorySelect={setActiveCategory} />
                
                <ItemFilter onFilter={setSearchQuery} />
              </div>
              
              {viewMode === 'grid' ? (
                <ItemGrid 
                  onAddItem={handleToggleAddItemForm} 
                  items={filteredItems}
                  onSelect={setCurrentItem}
                  onToggleFavorite={handleToggleFavorite}
                />
              ) : (
                <div className="px-3 pb-3 overflow-x-auto border-none">
                  <ItemTable 
                    items={filteredItems}
                    onSelect={setCurrentItem}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Botão flutuante para adicionar item */}
        <button
          onClick={handleToggleAddItemForm}
          className="fixed z-10 bottom-6 right-6 p-4 rounded-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 shadow-lg"
          title="Adicionar novo item"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
        
        {/* Botão flutuante para logout (apenas no mobile) */}
        <button
          onClick={handleLogout}
          className="fixed md:hidden z-10 bottom-6 left-6 p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
          title="Fazer logout"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
        </button>

        {/* Seletor de tipo de item para mobile */}
        {showItemTypeSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#373739] dark:bg-[#191919] rounded-lg p-6 w-full max-w-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Selecionar tipo</h2>
                <button 
                  onClick={() => setShowItemTypeSelector(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleSelectItemType('note')}
                  className="flex flex-col items-center justify-center p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg"
                >
                  <DocumentIcon className="h-10 w-10 text-blue-500 mb-2" />
                  <span className="text-blue-500 font-medium">Nota</span>
                </button>
                <button 
                  onClick={() => handleSelectItemType('link')}
                  className="flex flex-col items-center justify-center p-4 bg-green-500/10 hover:bg-green-500/20 rounded-lg"
                >
                  <LinkIcon className="h-10 w-10 text-green-500 mb-2" />
                  <span className="text-green-500 font-medium">Link</span>
                </button>
                <button 
                  onClick={() => handleSelectItemType('code')}
                  className="flex flex-col items-center justify-center p-4 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg"
                >
                  <CodeIcon className="h-10 w-10 text-orange-500 mb-2" />
                  <span className="text-orange-500 font-medium">Código</span>
                </button>
                <button 
                  onClick={() => handleSelectItemType('prompt')}
                  className="flex flex-col items-center justify-center p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg"
                >
                  <LightBulbIcon className="h-10 w-10 text-purple-500 mb-2" />
                  <span className="text-purple-500 font-medium">Prompt</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de adicionar item */}
        {showAddItemForm && (
          <AddItemEvent 
            onClose={handleCloseAddItemForm} 
            initialType={selectedItemType || undefined}
          />
        )}
        
        {/* Painel de depuração */}
        <DebugPanel />
      </div>
    </div>
  );
}; 
```

## Solução da Filtragem por Categorias

O problema de filtragem por categorias foi resolvido com duas correções principais:

1. **No AppContext.tsx**: Normalização dos tipos dos itens
   - Ao carregar os itens do localStorage, normalizamos os tipos para valores válidos ('note', 'link', 'code', 'prompt')
   - Ao criar novos itens, garantimos que o tipo seja padronizado (minúsculas, sem espaços)

```tsx
// Ao carregar do localStorage
const normalizedItems = storedItems.map((item: Item) => {
  // Garantir que o tipo seja um dos valores válidos
  let normalizedType = (item.type || 'note').toLowerCase().trim();
  
  // Forçar para ser um dos tipos válidos
  if (!['note', 'link', 'code', 'prompt'].includes(normalizedType)) {
    // Tentar fazer correspondência aproximada ou usar 'note' como padrão
    if (normalizedType.includes('not') || normalizedType.includes('nota')) {
      normalizedType = 'note';
    } else if (normalizedType.includes('lin') || normalizedType.includes('url')) {
      normalizedType = 'link';
    } else if (normalizedType.includes('cod') || normalizedType.includes('program')) {
      normalizedType = 'code';
    } else if (normalizedType.includes('pro') || normalizedType.includes('ai')) {
      normalizedType = 'prompt';
    } else {
      normalizedType = 'note'; // Tipo padrão
    }
  }
  
  return {
    ...item,
    type: normalizedType as 'note' | 'link' | 'code' | 'prompt'
  };
});
```

2. **No HomePage.tsx**: Função auxiliar para identificar itens por tipo
   - Implementamos uma função `isItemOfType` que usa múltiplas abordagens para verificar o tipo
   - Esta função aceita variações comuns ('note'/'nota', 'code'/'código', etc.)
   - Usa estratégias adaptativas para maximizar a compatibilidade

Desta forma, a filtragem por categorias agora funciona corretamente, mesmo com dados inconsistentes ou malformatados. 