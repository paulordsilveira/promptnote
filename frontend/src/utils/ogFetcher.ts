import axios from 'axios';

interface OGPreview {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  provider?: string;
}

// Cache local para previews
const previewCache = new Map<string, {data: OGPreview, timestamp: number}>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas em ms

/**
 * Busca metadados OpenGraph de uma URL
 */
export async function fetchOGData(url: string): Promise<OGPreview> {
  console.log('📡 Tentando obter preview para:', url);
  
  try {
    // Verifica se a URL é válida
    try {
      new URL(url);
    } catch (e) {
      console.error('❌ URL inválida:', url);
      throw new Error('URL inválida');
    }

    // 1. Verificar cache local
    const cachedData = getCachedPreview(url);
    if (cachedData) {
      console.log('📦 Usando dados do cache local para:', url);
      return cachedData;
    }

    // 2. Tentar obter dados diretamente para não depender da API
    try {
      // Usar função interna para extrair metadados
      console.log('🔍 Tentando obter preview localmente...');
      const result = await getSimplePreview(url);
      
      if (result) {
        // Salvar no cache
        cachePreview(url, result);
        return result;
      }
    } catch (error) {
      console.error('❌ Erro ao obter preview localmente:', 
                   error instanceof Error ? error.message : 'Erro desconhecido');
    }
        
    // 3. Tentar tratamento especial para domínios específicos
    if (url.includes('instagram.com')) {
      return getInstagramFallback(url);
    }
    
    // 4. Fallback: retornar dados básicos
    const fallbackData = {
      title: getDomainName(url),
      description: `Conteúdo de ${getDomainName(url)}`,
      image: getFallbackImage(url),
      url: url,
      provider: 'fallback'
    };
    
    // Salvar no cache para não repetir o erro
    cachePreview(url, fallbackData);
    
    return fallbackData;
  } catch (error) {
    console.error('❌ Erro ao processar URL:', 
                 error instanceof Error ? error.message : 'Erro desconhecido');
    
    // Fallback final
    return {
      title: getDomainName(url),
      description: `Conteúdo de ${getDomainName(url)}`,
      image: getFallbackImage(url),
      url: url,
      provider: 'error-fallback'
    };
  }
}

/**
 * Função interna para obter previews sem depender da API
 */
async function getSimplePreview(url: string): Promise<OGPreview> {
  try {
    // Tentar obter os dados diretamente via proxy CORS
    const corsProxy = 'https://corsproxy.io/?' + encodeURIComponent(url);
    
    const response = await fetch(corsProxy, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao acessar URL via proxy: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extrair metadados
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["'][^>]*>/i) 
                        || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["'][^>]*>/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["'][^>]*>/i)
                     || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:image["'][^>]*>/i);
    
    let imageUrl: string | undefined = undefined;
    if (ogImageMatch && ogImageMatch[1]) {
      imageUrl = ogImageMatch[1];
      // Converter para URL absoluta se for relativa
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.origin}${imageUrl}`;
      }
      // Processar a imagem para CORS
      imageUrl = getSafeImageUrl(imageUrl);
    }
    
    return {
      title: titleMatch ? titleMatch[1] : getDomainName(url),
      description: descriptionMatch ? descriptionMatch[1] : '',
      image: imageUrl,
      url: url,
      provider: 'direct'
    };
  } catch (error) {
    console.error('Erro ao obter preview direto:', error);
    throw error;
  }
}

/**
 * Verifica se há dados para a URL no cache
 */
function getCachedPreview(url: string): OGPreview | null {
  const cached = previewCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

/**
 * Salva dados no cache local
 */
function cachePreview(url: string, data: OGPreview): void {
  previewCache.set(url, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Função crucial para transformar URLs de imagem para usar um proxy
 * Esta função é a chave para evitar problemas de CORS
 */
function getSafeImageUrl(url: string | undefined): string {
  if (!url) return '';
  
  // Se já é uma URL do Imgur, usamos diretamente
  if (url.includes('imgur.com')) {
    return url;
  }
  
  // Se já é uma URL do proxy images.weserv.nl, retornamos ela mesma
  if (url.includes('images.weserv.nl')) {
    return url;
  }
  
  try {
    // Verificamos se é uma URL absoluta
    new URL(url);
    
    // Usar images.weserv.nl como proxy para evitar problemas de CORS
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&n=-1`;
  } catch (e) {
    console.error('URL inválida:', url);
    return '';
  }
}

/**
 * Extrai o nome do domínio da URL
 */
function getDomainName(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch (e) {
    return 'website';
  }
}

/**
 * Gera uma URL de imagem de fallback para a URL
 */
function getFallbackImage(url: string): string {
  const domain = getDomainName(url);
  
  // Para Instagram, usamos um fallback específico
  if (domain.includes('instagram.com')) {
    return 'https://i.imgur.com/UGj8rol.jpg';
  }
  
  // Para outros sites, tentamos obter um logo do domínio
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * Retorna informações de fallback para URLs do Instagram
 */
function getInstagramFallback(url: string): OGPreview {
  // Extrair informações da URL do Instagram
  let username = 'instagram_user';
  let type = 'post';
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length > 0) {
      // URL de perfil: instagram.com/username
      if (pathParts.length === 1) {
        username = pathParts[0];
        type = 'perfil';
      }
      // URL de post/reel: instagram.com/p/XXX ou instagram.com/reel/XXX
      else if (pathParts.includes('p')) {
        username = pathParts[0] || username;
        type = 'post';
      } 
      else if (pathParts.includes('reel')) {
        username = pathParts[0] || username;
        type = 'reel';
      }
    }
    
    // Selecionar imagem apropriada baseada no tipo
    const imageMap: Record<string, string> = {
      'post': 'https://i.imgur.com/pU2lwAQ.jpg',
      'reel': 'https://i.imgur.com/UGj8rol.jpg',
      'perfil': 'https://i.imgur.com/8dNMvEj.jpg'
    };
    
    const image = imageMap[type] || imageMap['post'];
    
    const title = `${username} | ${type.charAt(0).toUpperCase() + type.slice(1)} no Instagram`;
    const description = type === 'perfil' ? 
                        `Perfil de ${username} no Instagram` : 
                        `Conteúdo de ${username} no Instagram`;
    
    return {
      title,
      description,
      image,
      url,
      provider: 'instagram-fallback'
    };
  } catch (error) {
    // Fallback genérico para Instagram em caso de erro na extração
    return {
      title: 'Conteúdo do Instagram',
      description: 'Visualize este conteúdo no Instagram',
      image: 'https://i.imgur.com/UGj8rol.jpg',
      url,
      provider: 'instagram-error'
    };
  }
} 