export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parent?: string;
  userId: string;
  items?: Item[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Enums para autenticação e preferências do usuário
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

// Interface para preferências do usuário
export interface UserPreferences {
  theme: ThemeMode;
  notifications: boolean;
  language: string;
  defaultCollection: string | null;
  defaultView: string;
  itemsPerPage: number;
}

// Interface para usuário
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Senha em texto (apenas para operações locais/simuladas)
  passwordHash?: string; // Hash da senha (para armazenamento seguro)
  profileImage?: string;
  role?: UserRole;
  status?: UserStatus;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  passwordUpdatedAt?: string;
  deletedAt?: string;
}

// Interface para token de autenticação
export interface AuthToken {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

// Interface para token de recuperação de senha
export interface PasswordReset {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

// Interface para registro de token
export interface TokenRecord {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  accessExpiry: number;
  refreshExpiry: number;
  createdAt: number;
}

export type ShareStatus = 'private' | 'link' | 'public';

export interface ShareConfig {
  status: ShareStatus;
  shareId?: string;
  password?: string;
  expiresAt?: Date;
  viewCount?: number;
  maxViews?: number;
}

export interface Item {
  id: string;
  type: 'link' | 'note' | 'prompt' | 'code';
  title: string;
  description?: string;
  content: string;
  url?: string;
  observation?: string;
  preview?: {
    image?: string;
    title?: string;
    description?: string;
    url?: string;
  };
  attachments?: Array<{
    name: string;
    title: string;
    size: number;
    type: string;
  }>;
  tags: string[];
  relationships: Relationship[];
  collection: string;
  favorite: boolean;
  share?: ShareConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface Relationship {
  id: string;
  type: 'similar' | 'part_of' | 'reference';
  sourceItem: string;
  targetItem: string;
  notes?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  parent?: string;
  count: number;
}

export interface Sidebar {
  collections: Collection[];
  favorites: boolean;
  allItems: boolean;
  trash: boolean;
  tags: Tag[];
} 