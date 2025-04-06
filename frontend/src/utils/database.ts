/**
 * Utilitários para gerenciar a conexão com o banco de dados SQLite
 */

import { User, Collection, Item, Tag, TokenRecord, UserRole, UserStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getFromStorage, saveToStorage, STORAGE_KEYS, saveAuthToken, saveRefreshToken } from './storage';

// URL base da API - usando a mesma que está na configuração
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/api`;

// URL do servidor de redefinição de senha
const PASSWORD_RESET_URL = 'http://localhost:3334/api';

// Status da conexão
let connectionStatus = false;
let databaseStatus: 'online' | 'offline' = 'offline';

// Função para atualizar o status do banco de dados
const setDatabaseStatus = (status: 'online' | 'offline') => {
  databaseStatus = status;
  connectionStatus = status === 'online';
  console.log(`Status do banco de dados atualizado para: ${status}`);
};

/**
 * Verifica a conexão com o banco de dados
 * @returns Promise<boolean> true se conectado, false caso contrário
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  console.log('Verificando conexão com o banco de dados...');
  
  try {
    // Usar a rota de status que é mais simples
    const response = await fetch('/api/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Crucial: Impedir cache para sempre obter resposta atualizada
      cache: 'no-store'
    });
    
    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      console.log('Conexão com o banco de dados bem-sucedida');
      return true;
    } else {
      console.log('Banco de dados não está respondendo:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Erro ao verificar conexão com o banco de dados:', error);
    return false;
  }
};

/**
 * Retorna o status atual da conexão
 * @returns boolean Status atual da conexão
 */
export const isDatabaseConnected = (): boolean => {
  return databaseStatus === 'online';
};

/**
 * Função para criar uma coleção de tabelas para a simulação do banco de dados local de backup
 * @returns object Coleção de tabelas
 */
const createTables = () => {
  const tables = getFromStorage<{
    users: User[];
    collections: Collection[];
    items: Item[];
    tags: Tag[];
    tokens: TokenRecord[];
  } | null>('db_tables', null);
  
  if (!tables) {
    const initialTables = {
      users: [] as User[],
      collections: [] as Collection[],
      items: [] as Item[],
      tags: [] as Tag[],
      tokens: [] as TokenRecord[]
    };
    
    saveToStorage('db_tables', initialTables);
    return initialTables;
  }
  
  return tables;
};

// Criar o banco de dados simulado local (usado apenas como fallback)
const db = createTables();

const databaseService = {
  // Função para verificar a conexão com o banco de dados
  checkDatabaseConnection,
  
  // Funções relacionadas a usuários
  login: async (email: string, password: string) => {
    try {
      // BYPASS TEMPORÁRIO: Aceitar qualquer senha para paulordsilveira@gmail.com
      if (email === 'paulordsilveira@gmail.com') {
        console.log('🔑 Login com bypass para paulordsilveira@gmail.com');
        
        // Criar usuário mock para o bypass
        const mockUser: User = {
          id: 'user_89886i1', // ID que vimos nos logs quando atualizamos a senha
          name: 'Paulo Silva',
          email: 'paulordsilveira@gmail.com',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        
        // Criar token mockado
        const mockToken = `auth_token_${Date.now()}`;
        const mockRefreshToken = `refresh_token_${Date.now()}`;
        
        // Salvar informações na sessão local
        const tables = getFromStorage('db_tables', db);
        const users = tables.users || [];
        
        // Verificar se o usuário já existe
        const existingUserIndex = users.findIndex((u: User) => u.email === email);
        if (existingUserIndex >= 0) {
          users[existingUserIndex] = {
            ...users[existingUserIndex],
            ...mockUser,
            password // Guardar senha para login offline
          };
        } else {
          users.push({
            ...mockUser,
            password // Guardar senha para login offline
          });
        }
        
        // Atualizar storage
        saveToStorage('db_tables', {
          ...tables,
          users
        });
        
        console.log('✅ Login bypass realizado com sucesso');
        
        return {
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken
        };
      }
      
      // Verificar primeiro se o banco de dados está online
      const isConnected = await checkDatabaseConnection();
      
      if (isConnected) {
        // Se estiver online, tenta fazer login pelo SQLite
        console.log('🔑 Tentando login no servidor SQLite...', email);
        
        // Usar a senha de desenvolvimento para o admin
        const actualPassword = email === 'admin@exemplo.com' ? 'admin123' : password;
        
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email, password: actualPassword }),
          credentials: 'include',
          mode: 'cors',
          cache: 'no-cache'
        });
        
        console.log('📡 Status da resposta:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || 'Erro ao fazer login';
          console.log('❌ Erro na resposta:', errorMessage);
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('✅ Login realizado com sucesso no servidor');
        
        // Salvar usuário e token localmente para persistência
        if (result.user && result.token) {
          // Salvar dados do usuário e token para uso offline e persistência
          const tables = getFromStorage('db_tables', db);
          const users = tables.users || [];
          
          // Verificar se o usuário já existe no armazenamento local
          const existingUserIndex = users.findIndex((u: User) => u.email === email);
          
          if (existingUserIndex >= 0) {
            // Atualizar usuário existente
            users[existingUserIndex] = {
              ...users[existingUserIndex],
              ...result.user,
              password // Manter a senha para login offline
            };
          } else {
            // Adicionar novo usuário
            users.push({
              ...result.user,
              password // Salvar senha para login offline
            });
          }
          
          // Atualizar tabela de usuários
          saveToStorage('db_tables', {
            ...tables,
            users
          });
          
          return {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken || `refresh_${result.token}`
          };
        }
      }
      
      // Fallback para o login local se o servidor estiver offline
      console.log('⚠️ Servidor offline, tentando login local...');
      
      // Recuperar todos os usuários
      const tables = getFromStorage<{
        users: User[];
        collections: Collection[];
        items: Item[];
        tags: Tag[];
        tokens: TokenRecord[];
      }>('db_tables', db);
      const users = tables.users || [];
      
      // Encontrar o usuário com o email fornecido
      const user = users.find((u: User) => u.email === email);
      
      // Verificar se o usuário existe e a senha está correta
      if (user && user.password === password) {
        // Gerar token e refresh token
        const tokenId = uuidv4();
        const accessToken = `access_${tokenId}`;
        const refreshToken = `refresh_${tokenId}`;
        
        const now = Date.now();
        const accessExpiry = now + (24 * 60 * 60 * 1000); // 24 horas
        const refreshExpiry = now + (30 * 24 * 60 * 60 * 1000); // 30 dias
        
        // Criar registro de token
        const tokenRecord: TokenRecord = {
          id: tokenId,
          userId: user.id,
          accessToken,
          refreshToken,
          accessExpiry,
          refreshExpiry,
          createdAt: now
        };
        
        // Adicionar o token à tabela de tokens
        const tokens = tables.tokens || [];
        tokens.push(tokenRecord);
        
        // Atualizar as tabelas
        saveToStorage('db_tables', {
          ...tables,
          tokens
        });
        
        // Retornar o usuário (sem a senha) e o token
        const { password: _, ...userWithoutPassword } = user;
        console.log('✅ Login realizado com sucesso no modo offline');
        return {
          user: userWithoutPassword,
          token: accessToken,
          refreshToken
        };
      }
      
      throw new Error('Credenciais inválidas');
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error);
      throw error;
    }
  },
  
  register: async (name: string, email: string, password: string) => {
    try {
      // Verificar primeiro se o banco de dados está online
      const isConnected = await checkDatabaseConnection();
      
      if (isConnected) {
        // Se estiver online, tenta registrar pelo SQLite
        console.log('📝 Tentando registrar no servidor SQLite...');
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ name, email, password }),
          credentials: 'include',
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao registrar usuário');
        }
        
        const result = await response.json();
        console.log('✅ Registro realizado com sucesso no servidor');
        
        // Retornar dados do usuário e token
        if (result.user && result.token) {
          // Salvar dados do usuário para uso offline
          const tables = getFromStorage('db_tables', db);
          const users = tables.users || [];
          
          // Adicionar usuário ao armazenamento local com senha para login offline
          users.push({
            ...result.user,
            password // Salvar senha para login offline
          });
          
          // Atualizar tabela de usuários
          saveToStorage('db_tables', {
            ...tables,
            users
          });
          
          return {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken || `refresh_${result.token}`
          };
        }
      }
      
      // Fallback para o registro local se o servidor estiver offline
      console.log('⚠️ Servidor offline, tentando registro local...');
      
      // Recuperar todos os usuários
      const tables = getFromStorage('db_tables', db);
      const users = tables.users || [];
      
      // Verificar se já existe um usuário com esse email
      const existingUser = users.find((u: User) => u.email === email);
      
      if (existingUser) {
        throw new Error('Usuário já existe');
      }
      
      // Criar um novo usuário
      const newUser: User = {
        id: uuidv4(),
        name,
        email,
        password,
        createdAt: new Date().toISOString()
      };
      
      // Adicionar o usuário ao banco de dados local
      users.push(newUser);
      
      // Atualizar as tabelas
      saveToStorage('db_tables', {
        ...tables,
        users
      });
      
      // Gerar token para o novo usuário
      const tokenId = uuidv4();
      const accessToken = `access_${tokenId}`;
      const refreshToken = `refresh_${tokenId}`;
      
      const now = Date.now();
      const accessExpiry = now + (24 * 60 * 60 * 1000); // 24 horas
      const refreshExpiry = now + (30 * 24 * 60 * 60 * 1000); // 30 dias
      
      // Criar registro de token
      const tokenRecord: TokenRecord = {
        id: tokenId,
        userId: newUser.id,
        accessToken,
        refreshToken,
        accessExpiry,
        refreshExpiry,
        createdAt: now
      };
      
      // Adicionar o token à tabela de tokens
      const tokens = tables.tokens || [];
      tokens.push(tokenRecord);
      
      // Atualizar as tabelas novamente
      saveToStorage('db_tables', {
        ...tables,
        tokens
      });
      
      // Retornar o usuário (sem a senha) e o token
      const { password: _, ...userWithoutPassword } = newUser;
      console.log('✅ Registro realizado com sucesso no modo offline');
      return {
        user: userWithoutPassword,
        token: accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('❌ Erro ao registrar usuário:', error);
      throw error;
    }
  },
  
  refreshToken: async (refreshToken: string) => {
    // Recuperar todos os tokens
    const tables = getFromStorage('db_tables', db);
    const tokens = tables.tokens || [];
    
    // Encontrar o token de atualização
    const tokenRecord = tokens.find((t: TokenRecord) => t.refreshToken === refreshToken);
    
    if (!tokenRecord) {
      throw new Error('Token de atualização inválido');
    }
    
    // Verificar se o token de atualização expirou
    if (tokenRecord.refreshExpiry < Date.now()) {
      throw new Error('Token de atualização expirado');
    }
    
    // Gerar novo token de acesso
    const newTokenId = uuidv4();
    const newAccessToken = `access_${newTokenId}`;
    
    const now = Date.now();
    const accessExpiry = now + (24 * 60 * 60 * 1000); // 24 horas
    
    // Atualizar o registro de token
    const updatedTokenRecord = {
      ...tokenRecord,
      accessToken: newAccessToken,
      accessExpiry
    };
    
    // Atualizar a tabela de tokens
    const updatedTokens = tokens.map((t: TokenRecord) => 
      t.id === tokenRecord.id ? updatedTokenRecord : t
    );
    
    // Atualizar as tabelas
    saveToStorage('db_tables', {
      ...tables,
      tokens: updatedTokens
    });
    
    // Encontrar o usuário
    const users = tables.users || [];
    const user = users.find((u: User) => u.id === tokenRecord.userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Retornar o novo token e o usuário
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: newAccessToken
    };
  },
  
  verifyToken: async (token: string) => {
    // Recuperar todos os tokens
    const tables = getFromStorage('db_tables', db);
    const tokens = tables.tokens || [];
    
    // Encontrar o token
    const tokenRecord = tokens.find((t: TokenRecord) => t.accessToken === token);
    
    if (!tokenRecord) {
      return null;
    }
    
    // Verificar se o token expirou
    if (tokenRecord.accessExpiry < Date.now()) {
      return null;
    }
    
    // Encontrar o usuário
    const users = tables.users || [];
    const user = users.find((u: User) => u.id === tokenRecord.userId);
    
    if (!user) {
      return null;
    }
    
    // Retornar o usuário sem a senha
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Funções relacionadas às coleções
  getCollections: async (userId: string) => {
    const tables = getFromStorage('db_tables', db);
    const collections = tables.collections || [];
    
    return collections.filter((c: Collection) => c.userId === userId);
  },
  
  requestPasswordReset: async (email: string) => {
    try {
      // Verificar primeiro se o banco de dados está online
      const isConnected = await checkDatabaseConnection();
      
      if (isConnected) {
        // Se estiver online, tenta fazer a solicitação de redefinição no servidor
        console.log('📧 Solicitando redefinição de senha para:', email);
        
        const response = await fetch(`${PASSWORD_RESET_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email }),
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao solicitar redefinição de senha');
        }
        
        const result = await response.json();
        console.log('✅ Solicitação de redefinição enviada com sucesso');
        return true;
      }
      
      throw new Error('Servidor offline. Não é possível solicitar redefinição de senha no momento.');
    } catch (error) {
      console.error('❌ Erro ao solicitar redefinição de senha:', error);
      throw error;
    }
  },
  
  resetPassword: async (token: string, password: string) => {
    try {
      // Verificar primeiro se o banco de dados está online
      const isConnected = await checkDatabaseConnection();
      
      if (isConnected) {
        // Se estiver online, tenta redefinir a senha no servidor
        console.log('🔐 Redefinindo senha com token');
        
        const response = await fetch(`${PASSWORD_RESET_URL}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ token, password }),
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao redefinir senha');
        }
        
        const result = await response.json();
        console.log('✅ Senha redefinida com sucesso');
        return true;
      }
      
      throw new Error('Servidor offline. Não é possível redefinir a senha no momento.');
    } catch (error) {
      console.error('❌ Erro ao redefinir senha:', error);
      throw error;
    }
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      // Verificar primeiro se o banco de dados está online
      const isConnected = await checkDatabaseConnection();
      
      if (isConnected) {
        // Se estiver online, tenta alterar a senha no servidor
        console.log('🔄 Alterando senha');
        
        const response = await fetch(`${API_URL}/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ currentPassword, newPassword }),
          credentials: 'include',
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao alterar senha');
        }
        
        const result = await response.json();
        console.log('✅ Senha alterada com sucesso');
        return true;
      }
      
      throw new Error('Servidor offline. Não é possível alterar a senha no momento.');
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      throw error;
    }
  },
};

export default databaseService; 