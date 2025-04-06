// Chaves para o local storage
const STORAGE_KEYS = {
  COLLECTIONS: 'promptnote_collections',
  ITEMS: 'promptnote_items',
  TAGS: 'promptnote_tags',
  VIEW_MODE: 'promptnote_view_mode',
  AUTH_TOKEN: 'promptnote_auth_token',
  CURRENT_USER: 'promptnote_current_user',
  USER: 'promptnote_user',
  USER_PREFERENCES: 'promptnote_user_preferences',
  TOKEN_EXPIRY: 'promptnote_token_expiry',
  REFRESH_TOKEN: 'promptnote_refresh_token'
};

// Constantes para expiração de tokens em milissegundos
const TOKEN_DURATIONS = {
  ACCESS_TOKEN: 24 * 60 * 60 * 1000,  // 24 horas
  REFRESH_TOKEN: 30 * 24 * 60 * 60 * 1000,  // 30 dias
  VERIFICATION_INTERVAL: 60 * 60 * 1000  // Verificação a cada 1 hora
};

/**
 * Recupera dados do localStorage
 * @param key Chave para recuperar os dados
 * @returns Dados armazenados ou valor padrão caso não exista
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const storedData = localStorage.getItem(key);
    if (!storedData) return defaultValue;
    return JSON.parse(storedData) as T;
  } catch (error) {
    console.error(`Erro ao recuperar dados do localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Salva dados no localStorage
 * @param key Chave para salvar os dados
 * @param data Dados para salvar
 */
export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar dados no localStorage (${key}):`, error);
  }
}

/**
 * Remove dados do localStorage
 * @param key Chave para remover os dados
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Erro ao remover dados do localStorage (${key}):`, error);
  }
}

/**
 * Salva um token com tempo de expiração
 * @param token Token a ser salvo
 * @param durationMs Duração em milissegundos (padrão: 24 horas)
 */
export function saveAuthToken(token: string, durationMs = TOKEN_DURATIONS.ACCESS_TOKEN): void {
  try {
    // Salvar o token
    saveToStorage(STORAGE_KEYS.AUTH_TOKEN, token);
    
    // Calcular e salvar o tempo de expiração
    const expiryTime = Date.now() + durationMs;
    saveToStorage(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime);
  } catch (error) {
    console.error('Erro ao salvar token de autenticação:', error);
  }
}

/**
 * Salva um token de atualização (refresh token)
 * @param token Refresh token a ser salvo
 * @param durationMs Duração em milissegundos (padrão: 30 dias)
 */
export function saveRefreshToken(token: string, durationMs = TOKEN_DURATIONS.REFRESH_TOKEN): void {
  try {
    // Salvar o refresh token
    saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, token);
    
    // A expiração do refresh token é gerenciada pelo servidor
  } catch (error) {
    console.error('Erro ao salvar refresh token:', error);
  }
}

/**
 * Verifica se o token atual expirou
 * @returns true se o token expirou, false caso contrário
 */
export function isTokenExpired(): boolean {
  try {
    const expiryTime = getFromStorage<number>(STORAGE_KEYS.TOKEN_EXPIRY, 0);
    return Date.now() > expiryTime;
  } catch (error) {
    console.error('Erro ao verificar expiração do token:', error);
    return true; // Considera expirado em caso de erro
  }
}

/**
 * Obtém o tempo restante até a expiração do token em milissegundos
 * @returns Tempo restante em milissegundos
 */
export function getTokenTimeRemaining(): number {
  try {
    const expiryTime = getFromStorage<number>(STORAGE_KEYS.TOKEN_EXPIRY, 0);
    const remaining = expiryTime - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error('Erro ao obter tempo restante do token:', error);
    return 0;
  }
}

/**
 * Limpa todos os dados de autenticação
 */
export function clearAuthData(): void {
  try {
    removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    removeFromStorage(STORAGE_KEYS.REFRESH_TOKEN);
    removeFromStorage(STORAGE_KEYS.TOKEN_EXPIRY);
    removeFromStorage(STORAGE_KEYS.CURRENT_USER);
  } catch (error) {
    console.error('Erro ao limpar dados de autenticação:', error);
  }
}

export { STORAGE_KEYS, TOKEN_DURATIONS }; 