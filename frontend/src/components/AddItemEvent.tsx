import { useState } from 'react';
import { 
  XMarkIcon, 
  LinkIcon, 
  DocumentTextIcon, 
  CodeBracketIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { AddItemForm } from './AddItemForm';
import { useApp } from '../contexts/AppContext';

interface AddItemEventProps {
  onClose: () => void;
  initialType?: string;
}

export const AddItemEvent: React.FC<AddItemEventProps> = ({ onClose, initialType }) => {
  const { collections } = useApp();
  const [selectedType, setSelectedType] = useState<string | null>(initialType || null);
  const [showTypeSelection, setShowTypeSelection] = useState(!initialType);

  // Função para selecionar um tipo e avançar para o formulário
  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setShowTypeSelection(false);
  };

  // Função para voltar à seleção de tipo
  const handleBackToSelection = () => {
    setShowTypeSelection(true);
  };

  // Função para fechar o modal
  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      {showTypeSelection ? (
        // Modal de seleção de tipo inspirado na tela inicial
        <div className="bg-[#111827] rounded-xl shadow-2xl w-full max-w-3xl animate-fade-in p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Qual sua
                <br />
                PromptNote hoje?
              </h1>
              <p className="text-gray-400">
                Escolha o tipo de item que deseja adicionar.
              </p>
            </div>
            <button
              className="text-gray-500 hover:text-gray-300"
              onClick={handleClose}
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Card de Nota */}
            <button
              onClick={() => handleSelectType('note')}
              className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 h-48 transition-transform hover:scale-105"
            >
              <span className="text-5xl font-bold text-white mb-2">NT</span>
              <span className="text-white text-lg">Suas Notas</span>
            </button>
            
            {/* Card de Link */}
            <button
              onClick={() => handleSelectType('link')}
              className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 h-48 transition-transform hover:scale-105"
            >
              <span className="text-5xl font-bold text-white mb-2">LK</span>
              <span className="text-white text-lg">Links</span>
            </button>
            
            {/* Card de Código */}
            <button
              onClick={() => handleSelectType('code')}
              className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 h-48 transition-transform hover:scale-105"
            >
              <span className="text-5xl font-bold text-white mb-2">CD</span>
              <span className="text-white text-lg">Códigos</span>
            </button>
            
            {/* Card de Prompt */}
            <button
              onClick={() => handleSelectType('prompt')}
              className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 h-48 transition-transform hover:scale-105"
            >
              <span className="text-5xl font-bold text-white mb-2">PP</span>
              <span className="text-white text-lg">Prompt</span>
            </button>
          </div>
        </div>
      ) : (
        // Formulário completo
        <AddItemForm 
          onClose={handleClose} 
          initialType={selectedType || undefined}
          onBack={handleBackToSelection}
          collection={collections && collections.length > 0 ? collections[0].id : ""}
        />
      )}
    </div>
  );
}; 