import { useState } from 'react';
import { 
  XMarkIcon,
  FolderIcon,
  DocumentIcon,
  BookOpenIcon,
  BookmarkIcon,
  ArchiveBoxIcon,
  BeakerIcon,
  BriefcaseIcon,
  CalculatorIcon,
  CalendarIcon,
  GlobeAltIcon,
  LightBulbIcon,
  MapIcon,
  MusicalNoteIcon,
  PencilIcon,
  PhotoIcon,
  PuzzlePieceIcon,
  StarIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';

interface AddCollectionFormProps {
  onClose: () => void;
}

type IconType = 'folder' | 'document' | 'book' | 'bookmark' | 'archive' | 'beaker' | 
  'briefcase' | 'calculator' | 'calendar' | 'globe' | 'lightbulb' | 'map' | 
  'music' | 'pencil' | 'photo' | 'puzzle' | 'star' | 'video';

// Mapeamento de tipos de ícone para componentes
const iconComponents: Record<IconType, React.ReactNode> = {
  folder: <FolderIcon className="h-6 w-6" />,
  document: <DocumentIcon className="h-6 w-6" />,
  book: <BookOpenIcon className="h-6 w-6" />,
  bookmark: <BookmarkIcon className="h-6 w-6" />,
  archive: <ArchiveBoxIcon className="h-6 w-6" />,
  beaker: <BeakerIcon className="h-6 w-6" />,
  briefcase: <BriefcaseIcon className="h-6 w-6" />,
  calculator: <CalculatorIcon className="h-6 w-6" />,
  calendar: <CalendarIcon className="h-6 w-6" />,
  globe: <GlobeAltIcon className="h-6 w-6" />,
  lightbulb: <LightBulbIcon className="h-6 w-6" />,
  map: <MapIcon className="h-6 w-6" />,
  music: <MusicalNoteIcon className="h-6 w-6" />,
  pencil: <PencilIcon className="h-6 w-6" />,
  photo: <PhotoIcon className="h-6 w-6" />,
  puzzle: <PuzzlePieceIcon className="h-6 w-6" />,
  star: <StarIcon className="h-6 w-6" />,
  video: <VideoCameraIcon className="h-6 w-6" />
};

export const AddCollectionForm = ({ onClose }: AddCollectionFormProps) => {
  const { addCollection } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<IconType>('folder');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('O nome da coleção é obrigatório');
      return;
    }

    try {
      const id = addCollection({
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Coleção adicionada com sucesso:', id);
      onClose();
    } catch (err) {
      console.error('Erro ao adicionar coleção:', err);
      setError('Ocorreu um erro ao adicionar a coleção. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-surface p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nova Coleção</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Nome da coleção"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Descreva brevemente esta coleção"
            ></textarea>
          </div>

          {/* Seletor de ícones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ícone
            </label>
            <div className="grid grid-cols-6 gap-2">
              {Object.entries(iconComponents).map(([type, icon]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedIcon(type as IconType)}
                  className={`flex items-center justify-center p-2 rounded-md ${
                    selectedIcon === type
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-2 border-purple-500'
                      : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 