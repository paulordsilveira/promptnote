import React, { createContext, useContext, useState, useEffect } from 'react';
import { Item, User } from './types';
import { fetchOGData } from './utils/ogFetcher';
import { AUTH_API, ITEMS_API } from './utils/config';

interface AppContextType {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  user: User | null;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  addItem: (itemData: Partial<Item>) => Promise<string | null>;
  saveItemsToLocalStorage: (items: Item[]) => void;
}

const defaultContextValue: AppContextType = {
  items: [],
  setItems: () => {},
  user: null,
  isLoading: false,
  setIsLoading: () => {},
  login: async () => {},
  addItem: async () => null,
  saveItemsToLocalStorage: () => {}
};

const AppContext = createContext<AppContextType>(defaultContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Carregar itens do localStorage ao iniciar
    const loadItemsFromLocalStorage = () => {
      const savedItems = localStorage.getItem('items');
      if (savedItems) {
        try {
          setItems(JSON.parse(savedItems));
        } catch (error) {
          console.error('Erro ao carregar itens do localStorage:', error);
        }
      }
    };

    loadItemsFromLocalStorage();
  }, []);

  const saveItemsToLocalStorage = (itemsToSave: Item[]) => {
    localStorage.setItem('items', JSON.stringify(itemsToSave));
  };

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch(AUTH_API.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        return userData;
      } else {
        throw new Error(`Erro ao fazer login: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro de login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (itemData: Partial<Item>): Promise<string | null> => {
    try {
      // Criar objeto de item com valores padrão
      const collection = itemData.collection || 'default';
      const now = new Date();
      
      const newItem: Item = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: itemData.title || 'Sem título',
        description: itemData.description || '',
        content: itemData.content || '',
        collection: collection,
        type: itemData.type || 'note',
        url: itemData.url || '',
        tags: itemData.tags || [],
        createdAt: now,
        updatedAt: now,
        relationships: [],
        favorite: false,
        ...itemData
      };

      // Se for um link, tentar obter dados do OpenGraph
      if (newItem.type === 'link' && newItem.url) {
        try {
          setIsLoading(true);
          console.log('Obtendo preview para:', newItem.url);
          const ogData = await fetchOGData(newItem.url);
          
          if (ogData) {
            newItem.title = newItem.title === 'Sem título' ? (ogData.title || newItem.title) : newItem.title;
            newItem.description = newItem.description || ogData.description || '';
            if (ogData.image) {
              newItem.preview = { 
                ...newItem.preview,
                image: ogData.image 
              };
            }
          }
        } catch (error) {
          console.error('Erro ao obter dados de OpenGraph:', error);
        } finally {
          setIsLoading(false);
        }
      }

      // Salvar localmente primeiro para garantir que o item não seja perdido
      console.log('Salvando item no localStorage primeiro como backup');
      const newItems = [...items, newItem];
      setItems(newItems);
      saveItemsToLocalStorage(newItems);
      
      // Tentar salvar no servidor, mas continuar mesmo que falhe
      console.log('Tentando salvar item diretamente no banco de dados');
      try {
        // Tentativa principal - endpoint primário
        console.log('Enviando dados para o servidor: ');
        console.log(newItem);
        
        const response = await fetch(ITEMS_API.CREATE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            ...newItem,
            collectionId: newItem.collection
          })
        });

        if (response.ok) {
          const savedItem = await response.json();
          console.log('Item salvo com sucesso no servidor:', savedItem);
          
          // Atualizar o item na lista local com o ID permanente do servidor
          const updatedItems = items.map(item => 
            item.id === newItem.id ? { ...item, id: savedItem.id } : item
          );
          
          setItems(updatedItems);
          saveItemsToLocalStorage(updatedItems);
          
          return savedItem.id;
        } else {
          console.log('\n Servidor retornou erro:', response.status);
          throw new Error(`Erro do servidor: ${response.status}`);
        }
      } catch (error) {
        console.error('\n Erro ao salvar no endpoint principal, tentando rota alternativa', error);
        
        try {
          console.log('Tentando rota alternativa para coleção específica');
          const alternativeResponse = await fetch(ITEMS_API.GET_COLLECTION_ITEMS(newItem.collection), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(newItem)
          });
          
          if (alternativeResponse.ok) {
            const savedItemData = await alternativeResponse.json();
            console.log('Item salvo com sucesso via rota alternativa:', savedItemData);
            
            // Atualizar o item na lista local com o ID permanente
            const updatedItems = items.map(item => 
              item.id === newItem.id ? { ...item, id: savedItemData.item.id } : item
            );
            
            setItems(updatedItems);
            saveItemsToLocalStorage(updatedItems);
            
            return savedItemData.item.id;
          } else {
            console.log('\n Rota alternativa também falhou:', alternativeResponse.status);
            throw new Error(`Erro na rota alternativa: ${alternativeResponse.status}`);
          }
        } catch (alternativeError) {
          console.error('\n Todas as tentativas de salvar no servidor falharam:', alternativeError);
          
          // Continuar com o ID temporário sem mostrar erro na UI
          console.log('Item salvo apenas localmente com ID temporário:', newItem.id);
          return newItem.id;
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      return null;
    }
  };

  return (
    <AppContext.Provider value={{ 
      items, 
      setItems, 
      user, 
      isLoading, 
      setIsLoading,
      login,
      addItem,
      saveItemsToLocalStorage
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext; 