/**
 * Formata uma data para exibição
 * @param date Data a ser formatada
 * @param includeTime Se deve incluir o horário na formatação
 * @returns String formatada da data
 */
export function formatDate(date: Date | string, includeTime = false): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return dateObj.toLocaleDateString('pt-BR', options);
}

/**
 * Retorna uma string relativa de quanto tempo passou
 * @param date Data a ser comparada
 * @returns String relativa (ex: "há 2 dias")
 */
export function getRelativeTimeString(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  
  const diffSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffSeconds < 60) {
    return 'agora mesmo';
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  }
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `há ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`;
  }
  
  const diffYears = Math.floor(diffMonths / 12);
  return `há ${diffYears} ${diffYears === 1 ? 'ano' : 'anos'}`;
} 