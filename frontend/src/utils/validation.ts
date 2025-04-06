/**
 * Funções utilitárias para validação
 */

/**
 * Verifica se uma string é uma URL válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Verifica se uma string é um endereço de email válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Verifica se uma string está vazia ou contém apenas espaços
 */
export function isEmpty(str: string): boolean {
  return !str || str.trim() === '';
} 