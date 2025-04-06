import { User, UserPreferences } from '../types';
import { getFromStorage, saveToStorage, removeFromStorage, STORAGE_KEYS } from './storage';

// Simulação de hash para senha - em produção seria usado bcrypt
const hashPassword = (password: string): string => {
  // Apenas para simulação, não é seguro para produção
  return btoa(password + '_salt_value');
};

// Simulando um banco de dados em memória com alguns usuários
let mockUsers: User[] = [
  {
    id: 'user_1',
    name: 'Admin Teste',
    email: 'admin@exemplo.com',
    passwordHash: hashPassword('admin123'),
    role: 'admin',
    status: 'active',
    profileImage: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff',
    preferences: {
      theme: 'system',
      notifications: true,
      language: 'pt-BR',
      defaultView: 'grid',
      itemsPerPage: 20
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 'user_2',
    name: 'Usuário Demo',
    email: 'usuario@exemplo.com',
    passwordHash: hashPassword('demo123'),
    role: 'user',
    status: 'active',
    profileImage: 'https://ui-avatars.com/api/?name=Usuario&background=10b981&color=fff',
    preferences: {
      theme: 'dark',
      notifications: false,
      language: 'pt-BR',
      defaultView: 'grid',
      itemsPerPage: 12
    },
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2023-02-15')
  }
];

// Classe de serviço de autenticação
export class AuthService {
  // Funções auxiliares privadas
  private generateToken(userId: string): string {
    // Na implementação real, usaríamos JWT
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias
    
    const tokenData = {
      userId,
      expiresAt: expiresAt.toISOString()
    };
    
    return btoa(JSON.stringify(tokenData));
  }
  
  private parseToken(token: string): { userId: string, expiresAt: string } | null {
    try {
      return JSON.parse(atob(token));
    } catch (error) {
      return null;
    }
  }
  
  private isTokenValid(token: string): boolean {
    const parsed = this.parseToken(token);
    if (!parsed) return false;
    
    const expiresAt = new Date(parsed.expiresAt);
    return expiresAt > new Date();
  }
  
  // Métodos públicos
  login(email: string, password: string): { token: string, user: Omit<User, 'passwordHash'> } | null {
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) return null;
    if (user.passwordHash !== hashPassword(password)) return null;
    if (user.status !== 'active') return null;
    
    // Atualiza último login
    user.lastLoginAt = new Date();
    
    // Gera token de autenticação
    const token = this.generateToken(user.id);
    
    // Remove campo sensível
    const { passwordHash, ...safeUser } = user;
    
    return { token, user: safeUser };
  }
  
  register(name: string, email: string, password: string): { token: string, user: Omit<User, 'passwordHash'> } | null {
    // Verifica se e-mail já está em uso
    if (mockUsers.some(u => u.email === email)) {
      return null;
    }
    
    // Criar novo usuário
    const now = new Date();
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      passwordHash: hashPassword(password),
      role: 'user',
      status: 'active',
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
      preferences: {
        theme: 'system',
        notifications: true,
        language: 'pt-BR',
        defaultView: 'grid',
        itemsPerPage: 12
      },
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    };
    
    // Adiciona à "base de dados"
    mockUsers.push(newUser);
    
    // Gera token de autenticação
    const token = this.generateToken(newUser.id);
    
    // Remove campo sensível
    const { passwordHash, ...safeUser } = newUser;
    
    return { token, user: safeUser };
  }
  
  getUserFromToken(token: string): Omit<User, 'passwordHash'> | null {
    if (!this.isTokenValid(token)) return null;
    
    const parsed = this.parseToken(token);
    if (!parsed) return null;
    
    const user = mockUsers.find(u => u.id === parsed.userId);
    if (!user || user.status !== 'active') return null;
    
    // Remove campo sensível
    const { passwordHash, ...safeUser } = user;
    
    return safeUser;
  }
  
  updateUser(userId: string, userData: Partial<User>): Omit<User, 'passwordHash'> | null {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;
    
    // Não permitir alteração de campos sensíveis
    const { id, passwordHash, role, status, createdAt, ...allowedUpdates } = userData;
    
    // Atualizar usuário
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...allowedUpdates,
      updatedAt: new Date()
    };
    
    // Remove campos sensíveis
    const { passwordHash: _, ...safeUser } = mockUsers[userIndex];
    
    return safeUser;
  }
  
  updatePassword(userId: string, currentPassword: string, newPassword: string): boolean {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;
    
    // Verificar senha atual
    if (mockUsers[userIndex].passwordHash !== hashPassword(currentPassword)) {
      return false;
    }
    
    // Atualizar senha
    mockUsers[userIndex].passwordHash = hashPassword(newPassword);
    mockUsers[userIndex].updatedAt = new Date();
    
    return true;
  }
  
  logout(): void {
    // Em uma implementação real, invalidaríamos o token no servidor
    removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    removeFromStorage(STORAGE_KEYS.CURRENT_USER);
  }
}

// Instância única do serviço de autenticação
export const authService = new AuthService(); 