import { useState } from 'react';
import { 
  FolderIcon, 
  StarIcon, 
  ArchiveBoxIcon as ArchiveIcon, 
  TagIcon, 
  PlusIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  Squares2X2Icon as DashboardIcon,
  DocumentIcon,
  LinkIcon,
  CodeBracketIcon as CodeIcon,
  LightBulbIcon,
  CogIcon as SettingsIcon,
  QuestionMarkCircleIcon as HelpIcon,
  BookOpenIcon,
  BookmarkIcon,
  BeakerIcon,
  BriefcaseIcon,
  CalculatorIcon,
  CalendarIcon,
  GlobeAltIcon,
  MapIcon,
  MusicalNoteIcon,
  PencilIcon,
  PhotoIcon,
  PuzzlePieceIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import { AddCollectionForm } from './AddCollectionForm';
import { useDarkMode } from '../hooks/useDarkMode';

interface SidebarProps {
  onAddItem: () => void;
  onCategorySelect?: (category: string | null) => void;
  activeCategory?: string | null;
}

// Array de cores diversas para os ícones
const iconColors = [
  'text-purple-500',
  'text-blue-500',
  'text-green-500',
  'text-yellow-500',
  'text-red-500',
  'text-pink-500',
  'text-indigo-500',
  'text-teal-500',
  'text-orange-500',
  'text-cyan-500',
];

export const Sidebar = ({ onAddItem, onCategorySelect, activeCategory }: SidebarProps) => {
  const { collections, tags, setCurrentCollection } = useApp();
  const { isDarkMode } = useDarkMode();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    collections: false,
    tags: true,
  });
  const [showAddCollectionForm, setShowAddCollectionForm] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleToggleAddCollectionForm = () => {
    setShowAddCollectionForm(prev => !prev);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(prev => !prev);
  };

  // Função para obter uma cor com base no tipo de ícone
  const getIconColor = (iconName: string) => {
    const hash = iconName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return iconColors[hash % iconColors.length];
  };

  // Função para lidar com a seleção de categoria
  const handleCategorySelect = (category: string | null) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  return (
    <>
      {/* Botão de menu para mobile */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button 
          onClick={toggleMobileMenu}
          className="p-2 rounded-full bg-yellow-400 text-gray-900 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden ${showMobileMenu ? 'block' : 'hidden'}`} onClick={toggleMobileMenu}></div>

      <div className={`sidebar w-64 h-screen ${isDarkMode ? 'bg-black' : 'bg-black'} overflow-y-auto flex flex-col md:w-64 sm:w-full fixed md:static z-50 transition-all duration-300 ${showMobileMenu ? 'left-0' : '-left-full md:left-0'} border-none`}>
        {/* Botões de controle da janela (decorativo) */}
        <div className="px-4 pt-3 flex items-center space-x-2 invisible">
          <div className="editor-button editor-red"></div>
          <div className="editor-button editor-yellow"></div>
          <div className="editor-button editor-green"></div>
        </div>
        
        {/* Logo */}
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 mr-2 flex items-center justify-center rounded-md bg-purple-DEFAULT">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12L19 10V19C19 20.1046 18.1046 21 17 21Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V10H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-semibold">
              <span className="text-purple-DEFAULT dark:text-white">Prompt</span>
              <span className="text-yellow-500">Note</span>
            </span>
          </div>
          
          {/* Botão de fechar para mobile */}
          <button 
            className="md:hidden text-gray-500 dark:text-white"
            onClick={toggleMobileMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Seletor de espaço de trabalho */}
        <div className="my-4 px-4">
          <div className={`w-full ${isDarkMode ? 'bg-[#121212] border-[#333333]' : 'bg-gray-100 border-gray-200'} border rounded-md py-2 px-3 flex items-center justify-between cursor-pointer hover:bg-opacity-80 transition-colors`}>
            <div className="text-sm font-medium flex items-center">
              <span className={`uppercase text-xs ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-gray-200'} ${isDarkMode ? 'text-white' : 'text-gray-700'} px-1.5 py-0.5 rounded mr-2 font-bold tracking-wide`}>PROJETO</span>
              <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>Personal</span>
            </div>
            <div className="flex">
              <ChevronDownIcon className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-gray-600'}`} />
            </div>
          </div>
        </div>
        
        {/* Navegação principal */}
        <nav className="px-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <a 
                href="#" 
                className={`sidebar-item ${activeCategory === null ? 'active' : ''}`} 
                onClick={() => {
                  setCurrentCollection(null);
                  handleCategorySelect(null);
                }}
              >
                <div className="w-8 flex justify-center">
                  <DashboardIcon className={`h-5 w-5 ${getIconColor('dashboard')}`} />
                </div>
                <span className="ml-3 text-sm font-semibold text-white">Minhas Notas</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={`sidebar-item ${activeCategory === 'note' ? 'active' : ''}`} 
                onClick={() => {
                  setCurrentCollection(null);
                  handleCategorySelect('note');
                }}
              >
                <div className="w-8 flex justify-center">
                  <DocumentIcon className={`h-5 w-5 ${getIconColor('document')}`} />
                </div>
                <span className="ml-3 text-sm font-semibold text-white">Notas</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={`sidebar-item ${activeCategory === 'link' ? 'active' : ''}`} 
                onClick={() => {
                  setCurrentCollection(null);
                  handleCategorySelect('link');
                }}
              >
                <div className="w-8 flex justify-center">
                  <LinkIcon className={`h-5 w-5 ${getIconColor('link')}`} />
                </div>
                <span className="ml-3 text-sm font-semibold text-white">Links</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={`sidebar-item ${activeCategory === 'code' ? 'active' : ''}`} 
                onClick={() => {
                  setCurrentCollection(null);
                  handleCategorySelect('code');
                }}
              >
                <div className="w-8 flex justify-center">
                  <CodeIcon className={`h-5 w-5 ${getIconColor('code')}`} />
                </div>
                <span className="ml-3 text-sm font-semibold text-white">Códigos</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={`sidebar-item ${activeCategory === 'prompt' ? 'active' : ''}`} 
                onClick={() => {
                  setCurrentCollection(null);
                  handleCategorySelect('prompt');
                }}
              >
                <div className="w-8 flex justify-center">
                  <LightBulbIcon className={`h-5 w-5 ${getIconColor('lightbulb')}`} />
                </div>
                <span className="ml-3 text-sm font-semibold text-white">Prompts</span>
              </a>
            </li>
          </ul>

          {/* Seção de coleções */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-xs font-semibold uppercase sidebar-section-title text-white`}>
                Coleções
              </h3>
              <button 
                onClick={handleToggleAddCollectionForm}
                className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-800 text-white hover:text-white' : 'hover:bg-gray-200 text-white hover:text-purple-600'}`}
                title="Adicionar coleção"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-1">
              {collections.map(collection => (
                <li key={collection.id}>
                  <a 
                    href="#" 
                    className="sidebar-item"
                    onClick={() => {
                      setCurrentCollection(collection.id);
                      handleCategorySelect(null);
                    }}
                  >
                    <div className="w-8 flex justify-center">
                      {collection.icon ? (
                        <>
                          {collection.icon === 'folder' && <FolderIcon className={`h-5 w-5 ${getIconColor('folder')}`} />}
                          {collection.icon === 'document' && <DocumentIcon className={`h-5 w-5 ${getIconColor('document')}`} />}
                          {collection.icon === 'book' && <BookOpenIcon className={`h-5 w-5 ${getIconColor('book')}`} />}
                          {collection.icon === 'bookmark' && <BookmarkIcon className={`h-5 w-5 ${getIconColor('bookmark')}`} />}
                          {collection.icon === 'archive' && <ArchiveIcon className={`h-5 w-5 ${getIconColor('archive')}`} />}
                          {collection.icon === 'beaker' && <BeakerIcon className={`h-5 w-5 ${getIconColor('beaker')}`} />}
                          {collection.icon === 'briefcase' && <BriefcaseIcon className={`h-5 w-5 ${getIconColor('briefcase')}`} />}
                          {collection.icon === 'calculator' && <CalculatorIcon className={`h-5 w-5 ${getIconColor('calculator')}`} />}
                          {collection.icon === 'calendar' && <CalendarIcon className={`h-5 w-5 ${getIconColor('calendar')}`} />}
                          {collection.icon === 'globe' && <GlobeAltIcon className={`h-5 w-5 ${getIconColor('globe')}`} />}
                          {collection.icon === 'lightbulb' && <LightBulbIcon className={`h-5 w-5 ${getIconColor('lightbulb')}`} />}
                          {collection.icon === 'map' && <MapIcon className={`h-5 w-5 ${getIconColor('map')}`} />}
                          {collection.icon === 'music' && <MusicalNoteIcon className={`h-5 w-5 ${getIconColor('music')}`} />}
                          {collection.icon === 'pencil' && <PencilIcon className={`h-5 w-5 ${getIconColor('pencil')}`} />}
                          {collection.icon === 'photo' && <PhotoIcon className={`h-5 w-5 ${getIconColor('photo')}`} />}
                          {collection.icon === 'puzzle' && <PuzzlePieceIcon className={`h-5 w-5 ${getIconColor('puzzle')}`} />}
                          {collection.icon === 'star' && <StarIcon className={`h-5 w-5 ${getIconColor('star')}`} />}
                          {collection.icon === 'video' && <VideoCameraIcon className={`h-5 w-5 ${getIconColor('video')}`} />}
                        </>
                      ) : (
                        <FolderIcon className={`h-5 w-5 ${getIconColor('default')}`} />
                      )}
                    </div>
                    <span className="ml-3 text-sm font-semibold text-white">{collection.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Seção de Tags */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2" onClick={() => toggleSection('tags')}>
              <h3 className={`text-xs font-semibold uppercase sidebar-section-title text-white`}>
                Tags
              </h3>
              <button 
                className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-800 text-white hover:text-white' : 'hover:bg-gray-200 text-white hover:text-purple-600'}`}
              >
                {collapsedSections.tags ? 
                  <ChevronRightIcon className="h-4 w-4" /> : 
                  <ChevronDownIcon className="h-4 w-4" />
                }
              </button>
            </div>
            {!collapsedSections.tags && (
              <div className="max-h-56 overflow-y-auto pr-1 mt-1">
                <ul className="space-y-1">
                  {tags && tags.length > 0 ? (
                    tags.map(tag => (
                      <li key={tag.id}>
                        <a 
                          href="#" 
                          className="sidebar-item py-1.5"
                          onClick={() => {
                            setCurrentCollection(null);
                            handleCategorySelect(`tag:${tag.id}`);
                          }}
                        >
                          <div className="w-8 flex justify-center">
                            <TagIcon className={`h-4 w-4 ${tag.color || getIconColor(tag.name)}`} />
                          </div>
                          <span className="ml-3 text-sm font-medium text-white flex-1">
                            {tag.name}
                          </span>
                          {tag.count > 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                              {tag.count}
                            </span>
                          )}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm">
                      Nenhuma tag encontrada
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          {/* Divisor */}
          <div className={`my-4 border-t ${isDarkMode ? 'border-[#333333]' : 'border-gray-200'}`}></div>
          
          {/* Menu inferior */}
          <ul className="space-y-1 mt-auto">
            <li>
              <a href="#" className="sidebar-item">
                <div className="w-8 flex justify-center">
                  <SettingsIcon className={`h-5 w-5 ${getIconColor('settings')}`} />
                </div>
                <span className="ml-3 text-sm font-semibold text-white">Settings</span>
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-item">
                <div className="w-8 flex justify-center">
                  <HelpIcon className={`h-5 w-5 ${getIconColor('help')}`} />
                </div>
                <span className="ml-3 text-sm font-semibold text-white">Help</span>
              </a>
            </li>
          </ul>
        </nav>
        
        {/* Perfil do usuário */}
        <div className="mt-4 px-4 py-3 flex items-center">
          <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'} flex items-center justify-center mr-3`}>
            <span className={`text-xs font-semibold text-white`}>DK</span>
          </div>
          <span className={`text-sm font-semibold text-white`}>D's Workspace</span>
        </div>
      </div>

      {showAddCollectionForm && <AddCollectionForm onClose={handleToggleAddCollectionForm} />}
    </>
  );
};