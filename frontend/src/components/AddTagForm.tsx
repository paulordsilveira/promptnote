import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';

interface AddTagFormProps {
  onClose: () => void;
}

const colorOptions = [
  { name: 'Cinza', value: 'text-gray-400' },
  { name: 'Vermelho', value: 'text-red-500' },
  { name: 'Azul', value: 'text-blue-500' },
  { name: 'Verde', value: 'text-green-500' },
  { name: 'Amarelo', value: 'text-yellow-500' },
  { name: 'Roxo', value: 'text-purple-500' },
  { name: 'Rosa', value: 'text-pink-500' },
  { name: 'Laranja', value: 'text-orange-500' },
  { name: 'Ciano', value: 'text-cyan-500' },
  { name: 'Índigo', value: 'text-indigo-500' },
];

export const AddTagForm = ({ onClose }: AddTagFormProps) => {
  const { addTag } = useApp();
  const [name, setName] = useState('');
  const [color, setColor] = useState('text-gray-400');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('O nome da tag é obrigatório');
      return;
    }

    try {
      const id = addTag({
        name: name.trim(),
        color,
        count: 0
      });
      
      console.log('Tag adicionada com sucesso:', id);
      onClose();
    } catch (err) {
      console.error('Erro ao adicionar tag:', err);
      setError('Ocorreu um erro ao adicionar a tag. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-surface p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nova Tag</h2>
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
              placeholder="Nome da tag"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cor
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  className={`h-8 rounded-md flex items-center justify-center ${
                    color === option.value
                      ? 'ring-2 ring-offset-2 ring-purple-500'
                      : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${option.value.replace('text-', 'bg-')}`}></div>
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