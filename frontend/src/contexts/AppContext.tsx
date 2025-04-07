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

  // Verificar a conexão com o banco de dados uma única vez no início
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
          setDatabaseStatus('online');
          console.log('✅ Banco de dados está online');
        } else {
          setDatabaseStatus('offline');
          console.log('⚠️ Banco de dados offline');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar conexão:', error);
        setDatabaseStatus('offline');
      }
    };
    
    // Verificar apenas uma vez ao iniciar
    checkConnection();
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
      // ✅ Normalizar os tipos dos itens já existentes
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
      
      setItems(normalizedItems);
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
          
          // Tentar obter itens do usuário - simplificado
          const response = await fetch('/api/items', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.error(`❌ Erro ao carregar itens (Status: ${response.status})`);
            return;
          }
          
          // Processar resposta bem-sucedida
          const data = await response.json();
          
          // Verificar se data é um array e definir diretamente como itens
          if (Array.isArray(data)) {
            console.log(`✅ ${data.length} itens carregados com sucesso`);
            setItems(data);
          } 
          // Se não for um array, verificar se é um objeto com propriedade items
          else if (data && data.items && Array.isArray(data.items)) {
            console.log(`✅ ${data.items.length} itens carregados com sucesso`);
            setItems(data.items);
          }
          // Caso não consiga processar, apenas mostrar um aviso
          else {
            console.warn('⚠️ Resposta do servidor não está em formato reconhecível');
          }
        } catch (error) {
          console.error('❌ Erro ao carregar itens do servidor:', error);
        }
      }
    };
    
    // Executar apenas uma vez quando o status do banco de dados mudar para online
    if (databaseStatus === 'online') {
      fetchItemsFromServer();
    }
  }, [databaseStatus]);

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
          console.log('Preview obtido com sucesso:', preview);
        } catch (error) {
          console.error('Erro ao buscar metadata de OG:', error);
        }
      }
      
      // ✅ Normalizar o tipo do item
      let normalizedType = (item.type || 'note').toLowerCase().trim();
      
      // Garantir que seja um dos tipos válidos
      if (!['note', 'link', 'code', 'prompt'].includes(normalizedType)) {
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
      
      // Criar objeto completo do item
      const newItem: Item = {
        ...item,
        id: tempId,
        createdAt: now,
        updatedAt: now,
        // ✅ Usar o tipo normalizado
        type: normalizedType as 'note' | 'link' | 'code' | 'prompt',
        preview
      };
      
      // Sempre salvar localmente primeiro para garantir que não perdemos o item
      console.log('Salvando item no localStorage primeiro como backup');
      setItems(prev => [newItem, ...prev]);
      
      // Tentar salvar no servidor - abordagem simplificada e direta
      console.log('Tentando salvar item diretamente no banco de dados');
      
      // Garantir que temos uma coleção (usar default se não tiver)
      const collectionId = item.collection || 'default_collection';
      
      // Preparar payload para envio - incluindo o preview!
      const payload = {
        title: item.title,
        description: item.description || '',
        content: item.content || '',
        type: item.type,
        url: item.url || '',
        tags: item.tags || [],
        collectionId,
        preview: preview // Incluir o preview no payload
      };
      
      console.log('Enviando dados para o servidor (incluindo preview):', payload);
      
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
              tags: item.tags || [],
              preview: preview // Incluir o preview também na rota alternativa
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
        // Garantir que o campo preview seja preservado caso não esteja sendo atualizado
        const preservePreview = updates.preview !== undefined ? updates.preview : item.preview;
        
        // Quando o tipo ou URL de um item muda, tentamos obter os metadados
        // Isso garante que os links sempre tenham thumbnails
        if ((updates.type === 'link' || (item.type === 'link' && !updates.type)) && 
            (updates.url || item.url)) {
          
          const targetUrl = updates.url || item.url;
          console.log('🔄 Item do tipo link atualizado, atualizando metadados para:', targetUrl);
          
          // Disparar a atualização assíncrona dos metadados
          if (targetUrl) {
            (async () => {
              try {
                const newPreview = await fetchOGData(targetUrl);
                console.log('✅ Novos metadados obtidos:', newPreview);
                
                // Atualizar o item novamente com os novos metadados no estado local
                setItems(latestItems => latestItems.map(i => {
                  if (i.id === id) {
                    return {
                      ...i,
                      preview: newPreview,
                      updatedAt: new Date()
                    };
                  }
                  return i;
                }));
                
                // E também enviar a atualização para o servidor com os novos metadados
                if (databaseStatus === 'online') {
                  try {
                    console.log('🔄 Enviando atualização de preview para o servidor...');
                    
                    // Primeiro verificar se o item existe
                    const checkResponse = await fetch(`/api/items/${id}`, {
                      method: 'GET',
                      credentials: 'include'
                    });
                    
                    if (checkResponse.status === 404) {
                      console.log(`⚠️ Item ${id} não existe no servidor para atualizar preview.`);
                      return;  // Não tente atualizar um item que não existe
                    }
                    
                    const response = await fetch(`/api/items/${id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ preview: newPreview }),
                      credentials: 'include'
                    });
                    
                    if (response.ok) {
                      console.log('✅ Preview atualizado no servidor com sucesso');
                    } else {
                      console.error('❌ Erro ao atualizar preview no servidor:', response.status);
                    }
                  } catch (error) {
                    console.error('❌ Erro ao enviar atualização de preview:', error);
                  }
                }
              } catch (error) {
                console.error('❌ Erro ao obter metadados:', error);
              }
            })();
          }
        }
        
        return {
          ...item,
          ...updates,
          // Garantir que o preview seja preservado mesmo com outras atualizações
          preview: preservePreview,
          updatedAt: new Date()
        };
      }
      return item;
    }));
    
    // Tentar atualizar no servidor se estiver online
    if (databaseStatus === 'online') {
      // Executar de forma assíncrona sem bloquear a UI
      (async () => {
        try {
          console.log('🔄 Atualizando item no servidor...');
          
          // Obter o item atual da lista para garantir que temos todos os dados necessários
          const currentItem = items.find(item => item.id === id);
          if (!currentItem) {
            throw new Error('Item não encontrado na lista local');
          }
          
          // Verificar primeiro se o item existe no servidor
          console.log(`🔄 Verificando se o item ${id} existe no servidor...`);
          const checkResponse = await fetch(`/api/items/${id}`, {
            method: 'GET',
            credentials: 'include'
          });
          
          // Se o item não existir no servidor e for um item com ID temporário, considere criá-lo
          if (checkResponse.status === 404) {
            console.log(`⚠️ Item ${id} não encontrado no servidor.`);
            
            // Verificar se é um ID temporário (começa com temp_)
            if (id.startsWith('temp_')) {
              console.log(`🔄 Tentando criar item temporário ${id} no servidor...`);
              
              // Criar o item em vez de atualizar
              const createResponse = await fetch('/api/items', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: currentItem.title,
                  description: currentItem.description || '',
                  content: currentItem.content || '',
                  type: currentItem.type,
                  url: currentItem.url || '',
                  preview: currentItem.preview,
                  collectionId: currentItem.collection || 'default'
                }),
                credentials: 'include'
              });
              
              if (createResponse.ok) {
                const result = await createResponse.json();
                console.log(`✅ Item temporário criado no servidor com sucesso. Novo ID: ${result.id}`);
                
                // Atualizar o ID do item local para o ID retornado pelo servidor
                if (result.id) {
                  setItems(prev => prev.map(i => i.id === id ? { ...i, id: result.id } : i));
                }
              } else {
                console.error('❌ Erro ao criar item temporário no servidor:', createResponse.status);
              }
            } else {
              console.log(`⚠️ Item ${id} não existe no servidor e não é um item temporário. Nenhuma ação tomada.`);
            }
            
            return; // Sair da função pois o item não existe para atualizar
          }
          
          // Se estamos atualizando um link, garantir que o preview seja incluído
          const payload = {
            ...updates,
            // Se houver uma coleção para atualizar, use collectionId em vez de collection
            ...(updates.collection ? { collectionId: updates.collection } : {}),
            // Incluir o preview, mesmo que não esteja sendo atualizado
            ...(currentItem.type === 'link' && !updates.preview ? { preview: currentItem.preview } : {})
          };
          
          console.log('Enviando payload de atualização para o servidor:', payload);
          
          const response = await fetch(`/api/items/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
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
    if (currentItem && currentItem.id === id) {
      setCurrentItemState(null);
    }
    
    // Tentar remover no servidor se estiver online
    if (databaseStatus === 'online') {
      // Executar de forma assíncrona sem bloquear a UI
      (async () => {
        // Função interna de retry para exclusão
        const deleteWithRetry = async (retryCount = 0, maxRetries = 2) => {
          try {
            console.log(`🔄 Tentativa ${retryCount + 1} de remover item ${id} no servidor...`);
            
            const response = await fetch(`/api/items/${id}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            // Se a resposta for bem-sucedida (200-299), retornamos
            if (response.ok) {
              console.log(`✅ Item ${id} removido no servidor com sucesso!`);
              return true;
            }
            
            // Tratar diferentes códigos de erro
            if (response.status === 404) {
              // Item não encontrado no servidor (pode ter sido excluído antes)
              console.log(`⚠️ Item ${id} não encontrado no servidor. Considerando como excluído.`);
              return true;
            } else if (response.status === 401 || response.status === 403) {
              // Problema de autenticação/autorização
              console.error(`❌ Erro de autorização ao excluir item ${id}:`, response.status);
              throw new Error('Não autorizado');
            } else {
              // Outros erros
              const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
              console.error(`❌ Erro ao excluir item ${id} (Status ${response.status}):`, errorData);
              
              // Tentar novamente se ainda não atingimos o número máximo de tentativas
              if (retryCount < maxRetries) {
                console.log(`⏱️ Aguardando para tentar novamente (${retryCount + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return deleteWithRetry(retryCount + 1, maxRetries);
              }
              
              throw new Error(`Falha após ${maxRetries + 1} tentativas: ${errorData.message || response.statusText}`);
            }
          } catch (error) {
            if (retryCount < maxRetries) {
              console.log(`⏱️ Erro na tentativa ${retryCount + 1}, tentando novamente...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              return deleteWithRetry(retryCount + 1, maxRetries);
            }
            
            // Propagando o erro após todas as tentativas
            throw error;
          }
        };
        
        try {
          // Iniciar a exclusão com retry
          await deleteWithRetry();
        } catch (error) {
          console.error(`❌ Todas as tentativas de excluir o item ${id} falharam:`, error);
          
          // Restaurar o item localmente se a exclusão no servidor falhar
          // (comentado pois isso pode confundir o usuário - ele já viu o item ser excluído)
          // const itemToRestore = items.find(item => item.id === id);
          // if (itemToRestore) {
          //   console.log('⚠️ Restaurando item localmente após falha na exclusão no servidor');
          //   setItems(prev => [...prev, itemToRestore]);
          // }
          
          // Notificar o usuário
          alert('Não foi possível excluir o item no servidor. Por favor, tente novamente mais tarde.');
        }
      })();
    } else {
      console.log('⚠️ Servidor offline. Item removido apenas localmente');
      
      // Adicionar à fila de operações pendentes para sincronizar quando o servidor estiver online
      const pendingOps = JSON.parse(localStorage.getItem('pendingDeleteOps') || '[]');
      pendingOps.push({ op: 'delete', id, timestamp: Date.now() });
      localStorage.setItem('pendingDeleteOps', JSON.stringify(pendingOps));
      console.log(`⏱️ Exclusão do item ${id} adicionada à fila de operações pendentes para sincronização posterior`);
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
        // Não é mais necessário atualizar currentItem aqui, pois agora armazenamos apenas o ID
        return {
          ...item,
          share: shareConfig,
          updatedAt: new Date()
        };
      }
      return item;
    }));
    
    return shareId;
  };
  
  const unshareItem = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && item.share) {
        const { share, ...rest } = item;
        // Não é mais necessário atualizar currentItem aqui, pois agora armazenamos apenas o ID
        return {
          ...rest,
          updatedAt: new Date()
        };
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

  // Processar operações pendentes quando o banco de dados ficar online
  useEffect(() => {
    // Só executar quando o status mudar de offline para online
    if (databaseStatus === 'online') {
      const processPendingOperations = async () => {
        try {
          // Verificar se existem operações pendentes
          const pendingDeleteOps = JSON.parse(localStorage.getItem('pendingDeleteOps') || '[]');
          
          if (pendingDeleteOps.length === 0) {
            return; // Não há operações pendentes
          }
          
          console.log(`🔄 Processando ${pendingDeleteOps.length} exclusões pendentes...`);
          
          // Processar cada operação pendente
          const failedOps = [];
          
          for (const op of pendingDeleteOps) {
            if (op.op === 'delete') {
              try {
                console.log(`🔄 Excluindo item ${op.id} que estava pendente...`);
                
                const response = await fetch(`/api/items/${op.id}`, {
                  method: 'DELETE',
                  credentials: 'include'
                });
                
                if (response.ok || response.status === 404) {
                  console.log(`✅ Item ${op.id} excluído com sucesso!`);
                } else {
                  console.error(`❌ Erro ao excluir item ${op.id}:`, response.status);
                  failedOps.push(op);
                }
              } catch (error) {
                console.error(`❌ Erro ao excluir item ${op.id}:`, error);
                failedOps.push(op);
              }
            }
          }
          
          // Atualizar a lista de operações pendentes com as operações que falharam
          localStorage.setItem('pendingDeleteOps', JSON.stringify(failedOps));
          
          console.log(`🔄 ${pendingDeleteOps.length - failedOps.length} exclusões pendentes processadas com sucesso!`);
          
          if (failedOps.length > 0) {
            console.log(`🔄 ${failedOps.length} exclusões pendentes falharam e foram adicionadas à fila novamente.`);
          }
        } catch (error) {
          console.error('❌ Erro ao processar operações pendentes:', error);
        }
      };
      
      processPendingOperations();
    }
  }, [databaseStatus]);

  return (
    <AppContext.Provider value={{
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
    }}>
      {children}
    </AppContext.Provider>
  );
};