/**
 * Funções utilitárias para validação
 */

/**
 * Verifica se uma string é uma URL válida
 * @param {string} url - URL a ser validada
 * @returns {boolean} - true se for válida, false caso contrário
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Verifica se uma string é um endereço de email válido
 * @param {string} email - Email a ser validado
 * @returns {boolean} - true se for válido, false caso contrário
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Verifica se uma string está vazia ou contém apenas espaços
 * @param {string} str - String a ser verificada
 * @returns {boolean} - true se estiver vazia, false caso contrário
 */
export function isEmpty(str) {
  return !str || str.trim() === '';
} 