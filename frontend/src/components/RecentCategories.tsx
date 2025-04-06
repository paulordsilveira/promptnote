import { useEffect, useState } from 'react';
import { 
  DocumentIcon,
  LinkIcon,
  CodeBracketIcon as CodeIcon,
  LightBulbIcon,
  Squares2X2Icon as DashboardIcon,
  FolderIcon,
  BookOpenIcon,
  StarIcon,
  ArchiveBoxIcon as ArchiveIcon
} from '@heroicons/react/24/outline';

interface RecentCategoriesProps {
  onCategorySelect?: (category: string | null) => void;
}

// Tipo que representa tanto categorias quanto coleções
type RecentItem = {
  id: string;
  type: 'category' | 'collection';
  name: string;
  icon: string;
  color: string;
};

export const RecentCategories = ({ onCategorySelect }: RecentCategoriesProps) => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  
  // Simulação de itens recentes (em uma aplicação real, isso viria do localStorage ou banco de dados)
  useEffect(() => {
    // Exemplos de itens recentes acessados
    const mockRecentItems: RecentItem[] = [
      { id: 'all', type: 'category', name: 'Todos', icon: 'dashboard', color: 'purple-500' },
      { id: 'note', type: 'category', name: 'Notas', icon: 'document', color: 'blue-500' },
      { id: 'link', type: 'category', name: 'Links', icon: 'link', color: 'green-500' },
      { id: 'collection_1', type: 'collection', name: 'Trabalho', icon: 'briefcase', color: 'pink-500' },
      { id: 'collection_2', type: 'collection', name: 'Pessoal', icon: 'star', color: 'yellow-500' },
    ];
    
    setRecentItems(mockRecentItems);
  }, []);
  
  const handleItemSelect = (item: RecentItem) => {
    if (onCategorySelect) {
      if (item.type === 'category') {
        onCategorySelect(item.id === 'all' ? null : item.id);
      } else {
        // Lógica para selecionar coleção (seria implementada em uma versão real)
        console.log(`Selecionada coleção: ${item.name}`);
        onCategorySelect(null);
      }
      
      // Em uma implementação real, aqui atualizaríamos o histórico de itens acessados
      // Para este exemplo, a simulação apenas reordena o item selecionado para o início
      setRecentItems(prev => {
        const newItems = [...prev];
        const index = newItems.findIndex(i => i.id === item.id);
        if (index > 0) {
          const [removed] = newItems.splice(index, 1);
          newItems.unshift(removed);
        }
        return newItems;
      });
    }
  };
  
  // Renderiza o ícone correto com base no tipo
  const renderIcon = (item: RecentItem) => {
    switch (item.icon) {
      case 'dashboard': return <DashboardIcon className="h-5 w-5" />;
      case 'document': return <DocumentIcon className="h-5 w-5" />;
      case 'link': return <LinkIcon className="h-5 w-5" />;
      case 'code': return <CodeIcon className="h-5 w-5" />;
      case 'lightbulb': return <LightBulbIcon className="h-5 w-5" />;
      case 'folder': return <FolderIcon className="h-5 w-5" />;
      case 'book': return <BookOpenIcon className="h-5 w-5" />;
      case 'star': return <StarIcon className="h-5 w-5" />;
      case 'archive': return <ArchiveIcon className="h-5 w-5" />;
      case 'briefcase': return <ArchiveIcon className="h-5 w-5" />;
      default: return <FolderIcon className="h-5 w-5" />;
    }
  };
  
  // Renderiza o botão com as cores corretas
  const renderButton = (item: RecentItem) => {
    let textColorClass = '';
    
    switch (item.color) {
      case 'purple-500':
        textColorClass = 'text-purple-500';
        break;
      case 'blue-500':
        textColorClass = 'text-blue-500';
        break;
      case 'green-500':
        textColorClass = 'text-green-500';
        break;
      case 'pink-500':
        textColorClass = 'text-pink-500';
        break;
      case 'yellow-500':
        textColorClass = 'text-yellow-500';
        break;
      default:
        textColorClass = 'text-gray-500';
    }
    
    return (
      <button 
        key={item.id}
        className={`flex flex-col items-center ${textColorClass}`}
        onClick={() => handleItemSelect(item)}
        title={item.name}
      >
        {renderIcon(item)}
        <span className="text-xs font-medium mt-1">{item.name}</span>
      </button>
    );
  };
  
  return (
    <div className="md:hidden flex flex-col px-3 py-2">
      <div className="flex items-center justify-around py-1">
        {recentItems.map(item => renderButton(item))}
      </div>
    </div>
  );
}; 