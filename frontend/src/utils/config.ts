// Configurações da aplicação

// URL base da API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

// URLs específicas das APIs
export const AUTH_API = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
};

export const ITEMS_API = {
  GET_ALL: `${API_BASE_URL}/api/items`,
  CREATE: `${API_BASE_URL}/api/items`,
  GET_COLLECTION_ITEMS: (collectionId: string) => `${API_BASE_URL}/api/collections/${collectionId}/items`,
  GET_ITEM: (id: string) => `${API_BASE_URL}/api/items/${id}`,
  UPDATE_ITEM: (id: string) => `${API_BASE_URL}/api/items/${id}`,
  DELETE_ITEM: (id: string) => `${API_BASE_URL}/api/items/${id}`,
}; 