import { useState } from 'react';
import { HomePage } from '../pages/HomePage';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

/**
 * Componente que renderiza o conteúdo principal da aplicação
 */
export const MainContent = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Função para lidar com a adição de itens (será passada para Sidebar e Header)
  const handleAddItem = () => {
    // Esta função está vazia porque a lógica real está na HomePage
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      <Sidebar 
        onAddItem={handleAddItem}
        onCategorySelect={setActiveCategory}
        activeCategory={activeCategory}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onAddItem={handleAddItem}
          onCategorySelect={setActiveCategory}
          activeCategory={activeCategory}
        />
        <main className="flex-1 overflow-hidden">
          <HomePage activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        </main>
      </div>
    </div>
  );
}; 