import { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  Squares2X2Icon as ViewGridIcon, 
  ListBulletIcon as ViewListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
  LinkIcon,
  CodeBracketIcon as CodeIcon,
  LightBulbIcon,
  Squares2X2Icon as DashboardIcon,
  ArrowRightOnRectangleIcon as LogoutIcon
} from '@heroicons/react/24/outline';
import { ThemeToggle } from './ThemeToggle';
import { ViewToggle } from './ViewToggle';
import { AddItemEvent } from './AddItemEvent';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onAddItem?: () => void;
  onCategorySelect?: (category: string | null) => void;
  activeCategory?: string | null;
}

export const Header = ({ onAddItem, onCategorySelect, activeCategory }: HeaderProps = {}) => {
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const { currentCollection, viewMode, setViewMode, databaseStatus } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleToggleAddItemForm = () => {
    if (onAddItem) {
      onAddItem();
    } else {
      setShowAddItemForm(prev => !prev);
    }
  };

  const handleCategorySelect = (category: string | null) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  return (
    <header className="p-2 flex items-center justify-between bg-[#373739] dark:bg-black border-none">
      {/* Barra de pesquisa principal (visível apenas em desktop) */}
      <div className="hidden md:flex items-center flex-1">
        <div className="flex space-x-2 mr-2">
          <button className="p-2 rounded-md text-gray-400 hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="p-2 rounded-md text-gray-400 hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar..."
            className="pl-10 pr-4 py-2 w-full rounded-md bg-surface-dark border-0 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-light"
          />
        </div>
        
        {/* Indicador de status do banco de dados */}
        <div className="ml-3 flex-shrink-0">
          <div className={`flex items-center px-3 py-1.5 rounded-md ${
            databaseStatus === 'online' 
              ? 'bg-green-900/30 border border-green-700' 
              : 'bg-red-900/30 border border-red-700'
          } font-medium`}>
            <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
              databaseStatus === 'online' 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500'
            }`}></div>
            <span className={`text-sm ${
              databaseStatus === 'online' 
                ? 'text-green-400' 
                : 'text-red-400'
            }`}>
              MySQL: {databaseStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Espaço vazio para empurrar os elementos para a direita (apenas no mobile) */}
      <div className="w-12 md:hidden"></div>
      
      {/* Indicador de status do banco de dados em dispositivos móveis */}
      <div className="md:hidden flex items-center mr-2">
        <div className={`flex items-center px-2 py-1 rounded-md ${
          databaseStatus === 'online' 
            ? 'bg-green-900/30 border border-green-700' 
            : 'bg-red-900/30 border border-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${
            databaseStatus === 'online' 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-red-500'
          }`}></div>
          <span className={`text-xs ${
            databaseStatus === 'online' 
              ? 'text-green-400' 
              : 'text-red-400'
          }`}>
            BD
          </span>
        </div>
      </div>
      
      {/* Categorias em modo móvel - centralizado e mais próximo do botão de tema */}
      <div className="flex md:hidden items-center justify-end space-x-5 ml-auto mr-4">
        <button 
          className={`p-1.5 rounded-md ${activeCategory === null ? 'bg-purple-DEFAULT text-white' : 'text-purple-500'}`}
          onClick={() => handleCategorySelect(null)}
        >
          <DashboardIcon className="h-4 w-4" />
        </button>
        <button 
          className={`p-1.5 rounded-md ${activeCategory === 'note' ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
          onClick={() => handleCategorySelect('note')}
        >
          <DocumentIcon className="h-4 w-4" />
        </button>
        <button 
          className={`p-1.5 rounded-md ${activeCategory === 'link' ? 'bg-green-500 text-white' : 'text-green-500'}`}
          onClick={() => handleCategorySelect('link')}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button 
          className={`p-1.5 rounded-md ${activeCategory === 'code' ? 'bg-orange-500 text-white' : 'text-orange-500'}`}
          onClick={() => handleCategorySelect('code')}
        >
          <CodeIcon className="h-4 w-4" />
        </button>
        <button 
          className={`p-1.5 rounded-md ${activeCategory === 'prompt' ? 'bg-purple-600 text-white' : 'text-purple-600'}`}
          onClick={() => handleCategorySelect('prompt')}
        >
          <LightBulbIcon className="h-4 w-4" />
        </button>
      </div>
      
      {/* Controles à direita */}
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <ViewToggle mode={viewMode} onChange={setViewMode} className="hidden md:flex" />
        <button 
          onClick={handleLogout}
          className="p-2 rounded-full text-white hover:bg-red-600/20 transition-colors flex items-center justify-center"
          title="Sair"
        >
          <LogoutIcon className="h-5 w-5 text-red-500" />
        </button>
      </div>

      {/* Modal de adicionar item */}
      {!onAddItem && showAddItemForm && <AddItemEvent onClose={handleToggleAddItemForm} />}
    </header>
  );
}; 