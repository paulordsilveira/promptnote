import React, { createContext, useContext, useState, useEffect, useCallback, useRef, PropsWithChildren } from 'react';
import { User } from '../types';
import { 
  getFromStorage, 
  saveToStorage, 
  removeFromStorage, 
  STORAGE_KEYS, 
  saveAuthToken, 
  saveRefreshToken, 
  isTokenExpired, 
  getTokenTimeRemaining, 
  clearAuthData,
  TOKEN_DURATIONS
} from '../utils/storage';
import databaseService from '../utils/database';

// Definição da interface de registro
interface UserRegister {
  name: string;
  email: string;
  password: string;
}

// Definição do tipo do contexto
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  isAuthenticating: boolean;
  authError: string | null;
  showSessionExpiry: boolean;
  sessionTimeRemaining: number | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateProfile: (updatedData: Partial<User>) => void;
  renewSession: () => Promise<boolean>;
  sessionTimeout: number;
  lastActivity: Date;
  updateLastActivity: () => void;
  extendSession: () => Promise<boolean>;
  refreshAuthToken: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
}

// Criação do contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Provider do contexto
export const AuthProvider = ({ children }: PropsWithChildren) => {
  // Estados
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSessionExpiry, setShowSessionExpiry] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  
  // Verifica se há um usuário na sessão quando o app é carregado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Verificar se há token de autenticação
        const token = getFromStorage(STORAGE_KEYS.AUTH_TOKEN, null);
        
        if (!token) {
          setUser(null);
          return;
        }
        
        // Verificar se o token expirou
        if (isTokenExpired()) {
          // Tentar atualizar o token
          const refreshToken = getFromStorage(STORAGE_KEYS.REFRESH_TOKEN, null);
          
          if (refreshToken) {
            try {
              // Tenta renovar o token
              await refreshAuthToken();
            } catch (error) {
              console.error('❌ Erro ao atualizar token:', error);
              clearAuthData();
              setUser(null);
            }
          } else {
            // Sem refresh token, fazer logout
            clearAuthData();
            setUser(null);
          }
        } else {
          // Token ainda é válido
          // Recuperar dados do usuário
          const storedUser = getFromStorage(STORAGE_KEYS.USER, null);
          
          if (storedUser) {
            setUser(storedUser);
          } else {
            // Sem dados de usuário, fazer logout
            clearAuthData();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Atualizar o tempo restante a cada minuto
  useEffect(() => {
    if (!user) {
      setSessionTimeRemaining(null);
      return;
    }
    
    const timer = setInterval(() => {
      const remaining = getTokenTimeRemaining();
      
      if (remaining !== null) {
        setSessionTimeRemaining(remaining);
        
        // Mostrar aviso quando faltar menos de 10 minutos
        if (remaining < 10 * 60 * 1000) {
          setShowSessionExpiry(true);
        }
      }
    }, 60000); // Verificar a cada minuto
    
    return () => {
      clearInterval(timer);
    };
  }, [user]);
  
  /**
   * Função para fazer login
   */
  const login = async (email: string, password: string) => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      
      console.log('🔑 Iniciando login...');
      
      // Usar a senha de desenvolvimento para o admin
      const actualPassword = email === 'admin@exemplo.com' ? 'admin123' : password;
      
      const result = await databaseService.login(email, actualPassword);
      
      if (!result) {
        setAuthError('Credenciais inválidas');
        return false;
      }
      
      const { user: userData, token, refreshToken } = result;
      
      console.log('✅ Login realizado com sucesso:', userData.name);
      
      // Salvar dados de autenticação
      saveAuthToken(token);
      if (refreshToken) {
        saveRefreshToken(refreshToken);
      }
      saveToStorage(STORAGE_KEYS.USER, userData);
      
      // Atualizar estado
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error);
      setAuthError(error instanceof Error ? error.message : 'Erro ao fazer login');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  /**
   * Função para registrar um novo usuário
   */
  const register = async (name: string, email: string, password: string) => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      
      const result = await databaseService.register(name, email, password);
      
      if (!result) {
        setAuthError('Erro ao registrar usuário');
        return false;
      }
      
      const { user: userData, token, refreshToken } = result;
      
      // Salvar dados de autenticação
      saveAuthToken(token);
      if (refreshToken) {
        saveRefreshToken(refreshToken);
      }
      saveToStorage(STORAGE_KEYS.USER, userData);
      
      // Atualizar estado
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao registrar:', error);
      setAuthError(error instanceof Error ? error.message : 'Erro ao registrar');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  /**
   * Função para renovar o token de autenticação
   */
  const refreshAuthToken = async () => {
    const refreshToken = getFromStorage(STORAGE_KEYS.REFRESH_TOKEN, null);
    
    if (!refreshToken) {
      throw new Error('Sem token de atualização');
    }
    
    try {
      // Tenta renovar o token
      const result = await databaseService.refreshToken(refreshToken);
      
      if (!result) {
        throw new Error('Falha ao renovar token');
      }
      
      const { user: userData, token } = result;
      
      // Salvar dados de autenticação
      saveAuthToken(token);
      saveToStorage(STORAGE_KEYS.USER, userData);
      
      // Atualizar estado
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      throw error;
    }
  };
  
  /**
   * Função para fazer logout
   */
  const logout = () => {
    // Fazer a chamada HTTP para o servidor
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })
    .catch(error => {
      console.error('❌ Erro ao fazer logout no servidor:', error);
    })
    .finally(() => {
      // Limpar dados de autenticação independente do resultado da requisição
      clearAuthData();
      
      // Atualizar estado
      setUser(null);
    });
  };
  
  /**
   * Função para atualizar o perfil do usuário
   */
  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updatedData };
    
    // Salvar dados atualizados
    saveToStorage(STORAGE_KEYS.USER, updatedUser);
    
    // Atualizar estado
    setUser(updatedUser);
  };
  
  /**
   * Função para estender a sessão atual
   */
  const extendSession = async () => {
    try {
      await refreshAuthToken();
      setShowSessionExpiry(false);
      return true;
    } catch (error) {
      console.error('❌ Erro ao estender sessão:', error);
      return false;
    }
  };
  
  /**
   * Função para solicitar redefinição de senha
   */
  const requestPasswordReset = async (email: string) => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      
      console.log('📧 Iniciando solicitação de redefinição de senha...');
      
      const result = await databaseService.requestPasswordReset(email);
      
      if (!result) {
        setAuthError('Erro ao solicitar redefinição de senha');
        return false;
      }
      
      console.log('✅ Solicitação de redefinição de senha enviada com sucesso');
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao solicitar redefinição de senha:', error);
      setAuthError(error instanceof Error ? error.message : 'Erro ao solicitar redefinição de senha');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  /**
   * Função para redefinir senha com token
   */
  const resetPassword = async (token: string, password: string) => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      
      console.log('🔐 Redefinindo senha com token...');
      
      const result = await databaseService.resetPassword(token, password);
      
      if (!result) {
        setAuthError('Erro ao redefinir senha');
        return false;
      }
      
      console.log('✅ Senha redefinida com sucesso');
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao redefinir senha:', error);
      setAuthError(error instanceof Error ? error.message : 'Erro ao redefinir senha');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  /**
   * Função para alterar senha do usuário logado
   */
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      
      console.log('🔄 Alterando senha...');
      
      const result = await databaseService.changePassword(currentPassword, newPassword);
      
      if (!result) {
        setAuthError('Erro ao alterar senha');
        return false;
      }
      
      console.log('✅ Senha alterada com sucesso');
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      setAuthError(error instanceof Error ? error.message : 'Erro ao alterar senha');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const value = {
    user,
    isLoading,
    isAuthenticating,
    authError,
    showSessionExpiry,
    sessionTimeRemaining,
    login,
    register,
    logout,
    updateProfile,
    extendSession,
    refreshAuthToken,
    requestPasswordReset,
    resetPassword,
    changePassword
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
} 