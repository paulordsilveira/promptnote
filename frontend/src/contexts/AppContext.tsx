import React, { createContext, useContext, useState, useEffect } from 'react';
import { Item, Collection, Tag, ShareConfig, ShareStatus } from '../types';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { fetchOGData } from '../utils/ogFetcher';
import { checkDatabaseConnection } from '../utils/database';

type ViewMode = 'grid' | 'table';

interface AppContextType {
  items: Item[];
  collections: Collection[];
  tags: Tag[];
  currentItem: Item | null;
  currentCollection: string | null;
  viewMode: ViewMode;
  databaseStatus: 'online' | 'offline';
  setCurrentItem: (itemId: string | null) => void;
  setCurrentCollection: (collectionId: string | null) => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateItem: (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteItem: (id: string) => void;
  addCollection: (collection: Omit<Collection, 'id'>) => string;
  updateCollection: (id: string, updates: Partial<Omit<Collection, 'id'>>) => void;
  deleteCollection: (id: string) => void;
  addTag: (tag: Omit<Tag, 'id'>) => string;
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id'>>) => void;
  deleteTag: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  shareItem: (id: string, status: ShareStatus, config?: Partial<ShareConfig>) => string;
  unshareItem: (id: string) => void;
  getSharedItem: (shareId: string) => Item | null;
  startEditing: (itemId: string) => void;
}

// Criação do contexto
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
}

// Provider do contexto
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentItem, setCurrentItemState] = useState<Item | null>(null);
  const [currentCollection, setCurrentCollectionState] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [databaseStatus, setDatabaseStatus] = useState<'online' | 'offline'>('offline');

  // Verificar a conexão com o banco de dados periodicamente
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('🔄 Verificando conexão com o banco de dados...');
        
        // Tentar a rota de verificação de status
        const response = await fetch('/api/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache',
          credentials: 'include'
        });
        
        if (response.ok) {
          try {
            const status = await response.json();
            console.log('📊 Status do banco de dados:', status);
            
            // Se o servidor retornou um status, considere online independente do valor
            setDatabaseStatus('online');
            console.log('✅ Banco de dados está online. Dados serão salvos de forma persistente.');
            return;
          } catch (parseError) {
            // Mesmo com erro de parse, se recebemos resposta 200, consideramos online
            console.log('✅ Servidor respondeu, considerando banco online mesmo com erro de parse');
            setDatabaseStatus('online');
            return;
          }
        } else {
          // Apenas log, sem mostrar alerta (será mostrado apenas na primeira falha)
          console.error('⚠️ Servidor está offline. Status:', response.status);
          setDatabaseStatus('offline');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar conexão:', error);
        
        // Avisar ao usuário que estamos offline (apenas log)
        console.warn('⚠️ Aplicação em modo offline! Os dados serão salvos localmente.');
        setDatabaseStatus('offline');
      }
    };
    
    // Verificar imediatamente ao iniciar
    checkConnection();
    
    // E então a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Carregar dados do localStorage ao iniciar (apenas se não tivermos dados)
  useEffect(() => {
    const storedCollections = getFromStorage<Collection[]>(STORAGE_KEYS.COLLECTIONS, []);
    const storedItems = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS, []);
    const storedTags = getFromStorage<Tag[]>(STORAGE_KEYS.TAGS, []);
    const storedViewMode = getFromStorage<ViewMode>(STORAGE_KEYS.VIEW_MODE, 'grid');
    
    if (storedCollections.length > 0) {
      setCollections(storedCollections);
    }
    if (storedItems.length > 0) {
      setItems(storedItems);
    }
    if (storedTags.length > 0) {
      setTags(storedTags);
    }
    setViewMode(storedViewMode);
  }, []);
  
  // Tentar conectar ao banco ao iniciar
  useEffect(() => {
    // Iniciar o servidor de backend se não estiver rodando
    const startBackendServer = async () => {
      try {
        // Verificar se o servidor já está rodando tentando fazer uma requisição simples
        const isServerRunning = await fetch('/api/status', { 
          method: 'GET',
          cache: 'no-cache'
        })
        .then(res => {
          if (res.ok) {
            setDatabaseStatus('online');
            console.log('✅ Servidor já está rodando. Nenhuma ação necessária.');
            return true;
          }
          return false;
        })
        .catch(() => false);
        
        if (isServerRunning) {
          return;
        }
        
        console.log('🔄 Tentando iniciar o servidor...');
        
        // Aqui poderíamos ter um código para iniciar o servidor, mas como estamos 
        // em um ambiente web, apenas informamos o usuário que o servidor precisa ser iniciado
        console.warn('⚠️ O servidor backend não está rodando. Por favor, inicie o servidor para persistência de dados.');
        
        // Mostrar alerta apenas uma vez no início
        if (localStorage.getItem('server_alert_shown') !== 'true') {
          alert('O servidor backend parece não estar rodando. Os dados serão salvos apenas localmente.');
          localStorage.setItem('server_alert_shown', 'true');
        }
        
      } catch (error) {
        console.error('❌ Erro ao verificar/iniciar servidor:', error);
      }
    };
    
    startBackendServer();
  }, []);

  // Carregar itens do servidor quando estiver online
  useEffect(() => {
    const fetchItemsFromServer = async () => {
      if (databaseStatus === 'online') {
        try {
          console.log('🔄 Carregando itens do servidor...');
          
          // Verificar autenticação antes de tentar obter itens
          const authCheckResponse = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include'
          }).catch(() => null);
          
          if (!authCheckResponse || !authCheckResponse.ok) {
            console.warn('⚠️ Usuário não autenticado ou sessão expirada, usando dados locais');
            return;
          }
          
          // Tentar obter itens do usuário
          const response = await fetch('/api/items', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          // Se o endpoint principal falhar, tentar endpoint alternativo
          if (response.status === 404) {
            console.log('⚠️ Endpoint /api/items não encontrado, tentando alternativa...');
            
            // Verificar se temos uma coleção selecionada
            if (currentCollection) {
              // Tentar obter itens da coleção atual
              const altResponse = await fetch(`/api/collections/${currentCollection}/items`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json'
                }
              }).catch(e => {
                console.error('Erro no endpoint alternativo:', e);
                return null;
              });
              
              if (altResponse && altResponse.ok) {
                const altData = await altResponse.json();
                console.log(`✅ Itens carregados com sucesso (alternativo): ${altData.items?.length || 0} itens encontrados`);
                
                if (altData.items && Array.isArray(altData.items)) {
                  // Atualizar o estado com os itens do servidor
                  setItems(altData.items);
                  return;
                }
              }
            }
            
            // Se não conseguir carregar itens, não lançar erro, apenas usar os dados locais
            console.warn('⚠️ Não foi possível carregar itens remotos, usando dados locais');
            return;
          }
          
          if (!response.ok) {
            // Registrar erro sem interromper a execução
            console.error(`❌ Erro ao carregar itens (Status: ${response.status})`);
            const errorData = await response.json().catch(() => ({}));
            console.error('Detalhes do erro:', errorData);
            return;
          }
          
          // Processar resposta bem-sucedida
          const data = await response.json();
          console.log(`✅ Itens carregados com sucesso: ${data.items?.length || 0} itens encontrados`);
          
          if (data.items && Array.isArray(data.items)) {
            // Atualizar o estado com os itens do servidor
            setItems(data.items);
          }
        } catch (error) {
          // Capturar e registrar o erro, mas não interromper o fluxo da aplicação
          console.error('❌ Erro ao carregar itens do servidor:', error);
          console.log('⚠️ Usando itens salvos localmente');
        }
      } else {
        console.log('⚠️ Servidor offline. Usando itens salvos localmente');
      }
    };
    
    fetchItemsFromServer();
  }, [databaseStatus, currentCollection]);

  // Salvar dados no localStorage quando mudam
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.COLLECTIONS, collections);
  }, [collections]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ITEMS, items);
  }, [items]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TAGS, tags);
  }, [tags]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  // Funções auxiliares
  const setCurrentItem = (itemId: string | null) => {
    if (itemId === null) {
      setCurrentItemState(null);
      return;
    }
    
    const item = items.find(item => item.id === itemId) || null;
    setCurrentItemState(item);
  };

  const setCurrentCollection = (collectionId: string | null) => {
    setCurrentCollectionState(collectionId);
  };

  // Item CRUD
  const addItem = async (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      // Gerar ID único para controle local
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date();
      
      // Obter Open Graph data para links, se aplicável
      let preview = undefined;
      if (item.type === 'link' && item.url) {
        try {
          console.log('Obtendo preview para:', item.url);
          preview = await fetchOGData(item.url);
        } catch (error) {
          console.error('Erro ao buscar metadata de OG:', error);
        }
      }
      
      // Criar objeto completo do item
      const newItem: Item = {
        ...item,
        id: tempId,
        createdAt: now,
        updatedAt: now,
        preview
      };
      
      // Sempre salvar localmente primeiro para garantir que não perdemos o item
      console.log('Salvando item no localStorage primeiro como backup');
      setItems(prev => [newItem, ...prev]);
      
      // Tentar salvar no servidor - abordagem simplificada e direta
      console.log('Tentando salvar item diretamente no banco de dados');
      
      // Garantir que temos uma coleção (usar default se não tiver)
      const collectionId = item.collection || 'default_collection';
      
      // Preparar payload para envio
      const payload = {
        title: item.title,
        description: item.description || '',
        content: item.content || '',
        type: item.type,
        url: item.url || '',
        tags: item.tags || [],
        collectionId
      };
      
      console.log('Enviando dados para o servidor:', payload);
      
      // Tentar salvar usando o endpoint principal
      try {
        const response = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Item salvo com sucesso no banco de dados:', result);
          
          // Mostrar confirmação ao usuário
          alert(`✅ Item "${item.title}" salvo com sucesso no banco de dados!`);
          
          // Atualizar o ID na lista local se o servidor retornou um ID
          if (result.id) {
            setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: result.id } : i));
            return result.id;
          }
          
          return tempId;
        } 
        
        console.error('Servidor retornou erro:', response.status);
        throw new Error(`Erro do servidor: ${response.status}`);
      } catch (error) {
        console.error('Erro ao salvar no endpoint principal, tentando rota alternativa', error);
        
        // Tentar endpoint alternativo
        try {
          console.log('Tentando rota alternativa para coleção específica');
          
          const altResponse = await fetch(`/api/collections/${collectionId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: item.title,
              description: item.description || '',
              content: item.content || '',
              type: item.type,
              url: item.url || '',
              tags: item.tags || []
            }),
            credentials: 'include'
          });
          
          if (altResponse.ok) {
            const altResult = await altResponse.json();
            console.log('Item salvo com sucesso via rota alternativa:', altResult);
            
            // Mostrar confirmação ao usuário
            alert(`✅ Item "${item.title}" salvo com sucesso no banco de dados!`);
            
            // Atualizar o ID na lista se o servidor retornou um ID
            if (altResult.item && altResult.item.id) {
              setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: altResult.item.id } : i));
              return altResult.item.id;
            }
            
            return tempId;
          }
          
          console.error('Rota alternativa também falhou:', altResponse.status);
          throw new Error(`Erro na rota alternativa: ${altResponse.status}`);
        } catch (finalError) {
          console.error('Todas as tentativas de salvar no servidor falharam:', finalError);
          
          // Mostrar mensagem de erro ao usuário
          alert(`❌ ERRO: Não foi possível salvar o item "${item.title}" no banco de dados.\nEle foi salvo apenas localmente.`);
          
          // Retornar o ID temporário, já que o item está salvo localmente
          return tempId;
        }
      }
    } catch (error) {
      console.error('Erro geral ao adicionar item:', error);
      alert('Erro ao salvar item. Verifique o console para mais detalhes.');
      return 'error';
    }
  };

  const updateItem = (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>) => {
    // Atualizar localmente primeiro para feedback imediato
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        // Atualizar o currentItem se estiver sendo editado
        const updatedItem = {
          ...item,
          ...updates,
          updatedAt: new Date()
        };
        
        if (currentItem?.id === id) {
          setCurrentItemState(updatedItem);
        }
        
        return updatedItem;
      }
      return item;
    }));
    
    // Tentar atualizar no servidor se estiver online
    if (databaseStatus === 'online') {
      // Executar de forma assíncrona sem bloquear a UI
      (async () => {
        try {
          console.log('🔄 Atualizando item no servidor...');
          const response = await fetch(`/api/items/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...updates,
              // Se houver uma coleção para atualizar, use collectionId em vez de collection
              ...(updates.collection ? { collectionId: updates.collection } : {})
            }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Resposta do servidor:', response.status, errorData);
            throw new Error('Falha ao atualizar item no servidor');
          }
          
          const result = await response.json();
          console.log('✅ Item atualizado no servidor com sucesso:', result);
        } catch (error) {
          console.error('❌ Erro ao atualizar item no servidor:', error);
          console.log('⚠️ Item atualizado apenas localmente');
        }
      })();
    } else {
      console.log('⚠️ Servidor offline. Item atualizado apenas localmente');
    }
  };

  const deleteItem = (id: string) => {
    // Remover localmente primeiro para feedback imediato
    setItems(prev => prev.filter(item => item.id !== id));
    if (currentItem?.id === id) {
      setCurrentItemState(null);
    }
    
    // Tentar remover no servidor se estiver online
    if (databaseStatus === 'online') {
      // Executar de forma assíncrona sem bloquear a UI
      (async () => {
        try {
          console.log('🔄 Removendo item no servidor...');
          const response = await fetch(`/api/items/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Resposta do servidor:', response.status, errorData);
            throw new Error('Falha ao remover item no servidor');
          }
          
          console.log('✅ Item removido no servidor com sucesso');
        } catch (error) {
          console.error('❌ Erro ao remover item no servidor:', error);
          console.log('⚠️ Item removido apenas localmente');
        }
      })();
    } else {
      console.log('⚠️ Servidor offline. Item removido apenas localmente');
    }
  };

  // Funções de compartilhamento
  const shareItem = (id: string, status: ShareStatus, config?: Partial<ShareConfig>): string => {
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('##### NOVO ID DE COMPARTILHAMENTO GERADO:', shareId);
    console.log('##### USE ESTE LINK:', `${window.location.origin}/shared/${shareId}`);
    
    const shareConfig: ShareConfig = {
      status,
      shareId,
      expiresAt: config?.expiresAt,
      password: config?.password,
      viewCount: 0,
      maxViews: config?.maxViews
    };
    
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = {
          ...item,
          share: shareConfig,
          updatedAt: new Date()
        };
        
        if (currentItem?.id === id) {
          setCurrentItemState(updatedItem);
        }
        
        return updatedItem;
      }
      return item;
    }));
    
    return shareId;
  };
  
  const unshareItem = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && item.share) {
        const { share, ...rest } = item;
        const updatedItem = {
          ...rest,
          updatedAt: new Date()
        };
        
        if (currentItem?.id === id) {
          setCurrentItemState(updatedItem);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };
  
  const getSharedItem = (shareId: string): Item | null => {
    const sharedItem = items.find(item => item.share?.shareId === shareId);
    
    if (!sharedItem) return null;
    
    // Verificar se o compartilhamento expirou
    if (sharedItem.share?.expiresAt && new Date(sharedItem.share.expiresAt) < new Date()) {
      return null;
    }
    
    // Verificar se atingiu o número máximo de visualizações
    if (sharedItem.share?.maxViews && 
        sharedItem.share.viewCount !== undefined && 
        sharedItem.share.viewCount >= sharedItem.share.maxViews) {
      return null;
    }
    
    // Incrementar o contador de visualizações
    if (sharedItem.share) {
      updateItem(sharedItem.id, {
        share: {
          ...sharedItem.share,
          viewCount: ((sharedItem.share.viewCount ?? 0) + 1)
        }
      });
    }
    
    return sharedItem;
  };

  // Collection CRUD
  const addCollection = (collection: Omit<Collection, 'id'>): string => {
    const id = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newCollection: Collection = {
      ...collection,
      id
    };
    
    setCollections(prev => [...prev, newCollection]);
    return id;
  };

  const updateCollection = (id: string, updates: Partial<Omit<Collection, 'id'>>) => {
    setCollections(prev => prev.map(collection => {
      if (collection.id === id) {
        return {
          ...collection,
          ...updates
        };
      }
      return collection;
    }));
  };

  const deleteCollection = (id: string) => {
    setCollections(prev => prev.filter(collection => collection.id !== id));
    if (currentCollection === id) {
      setCurrentCollectionState(null);
    }
  };

  // Tag CRUD
  const addTag = (tag: Omit<Tag, 'id'>): string => {
    const id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTag: Tag = {
      ...tag,
      id
    };
    
    setTags(prev => [...prev, newTag]);
    return id;
  };

  const updateTag = (id: string, updates: Partial<Omit<Tag, 'id'>>) => {
    setTags(prev => prev.map(tag => {
      if (tag.id === id) {
        return {
          ...tag,
          ...updates
        };
      }
      return tag;
    }));
  };

  const deleteTag = (id: string) => {
    setTags(prev => prev.filter(tag => tag.id !== id));
  };

  // Criar o objeto de contexto com todas as funções e estado
  const contextValue: AppContextType = {
    items,
    collections,
    tags,
    currentItem,
    currentCollection,
    viewMode,
    databaseStatus,
    setCurrentItem,
    setCurrentCollection,
    addItem,
    updateItem,
    deleteItem,
    addCollection,
    updateCollection,
    deleteCollection,
    addTag,
    updateTag,
    deleteTag,
    setViewMode,
    shareItem,
    unshareItem,
    getSharedItem,
    startEditing: (itemId: string) => {
      // Seleciona o item e abre para edição
      setCurrentItem(itemId);
      // Lógica adicional de edição pode ser implementada aqui
      console.log(`Iniciando edição do item ${itemId}`);
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}; 