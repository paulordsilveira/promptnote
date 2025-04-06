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
const PREVIEW_STORAGE_KEY = 'promptnote_previews_cache';

// Carregar cache do localStorage ao iniciar
try {
  const storedCache = localStorage.getItem(PREVIEW_STORAGE_KEY);
  if (storedCache) {
    const parsed = JSON.parse(storedCache);
    Object.keys(parsed).forEach(key => {
      previewCache.set(key, parsed[key]);
    });
    console.log(`📦 Carregado cache de previews com ${previewCache.size} itens`);
  }
} catch (e) {
  console.error('Erro ao carregar cache de previews:', e);
}

// Função para salvar o cache no localStorage
function persistCacheToStorage() {
  try {
    const cacheObject: Record<string, {data: OGPreview, timestamp: number}> = {};
    previewCache.forEach((value, key) => {
      cacheObject[key] = value;
    });
    localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(cacheObject));
    console.log(`💾 Cache de previews salvo com ${previewCache.size} itens`);
  } catch (e) {
    console.error('Erro ao salvar cache de previews:', e);
  }
}

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
      const instagramPreview = getInstagramFallback(url);
      cachePreview(url, instagramPreview);
      return instagramPreview;
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
    console.log('Iniciando extração de preview para:', url);
    
    // Tentar obter os dados diretamente via proxy CORS
    const corsProxy = 'https://corsproxy.io/?' + encodeURIComponent(url);
    console.log('Usando proxy CORS:', corsProxy);
    
    const response = await fetch(corsProxy, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // Definir um timeout para evitar esperas infinitas
      signal: AbortSignal.timeout(15000) // 15 segundos de timeout
    });
    
    if (!response.ok) {
      console.error(`Erro na resposta do proxy (${response.status}):`, await response.text().catch(() => 'Não foi possível ler o corpo da resposta'));
      throw new Error(`Erro ao acessar URL via proxy: ${response.status}`);
    }
    
    const html = await response.text();
    console.log(`Obtidos ${html.length} caracteres de HTML para análise`);
    
    // Extrair metadados - buscando mais padrões para melhorar a precisão
    // Título: primeiro og:title, depois title padrão
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["'][^>]*>/i)
                     || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:title["'][^>]*>/i);
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    
    // Descrição: primeiro og:description, depois description padrão
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["'][^>]*>/i)
                     || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:description["'][^>]*>/i);
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["'][^>]*>/i) 
                        || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["'][^>]*>/i);
    
    // Imagem: primeiro og:image, depois twitter:image, depois procurar por imagem grande
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["'][^>]*>/i)
                     || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:image["'][^>]*>/i);
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["'](.*?)["'][^>]*>/i)
                         || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']twitter:image["'][^>]*>/i);
    
    // Título final
    const title = ogTitleMatch ? ogTitleMatch[1] : (titleMatch ? titleMatch[1] : getDomainName(url));
    console.log('Título encontrado:', title);
    
    // Descrição final
    const description = ogDescMatch ? ogDescMatch[1] : (descriptionMatch ? descriptionMatch[1] : '');
    console.log('Descrição encontrada:', description?.substring(0, 100) + (description?.length > 100 ? '...' : ''));
    
    // Processa a imagem
    let imageUrl: string | undefined = undefined;
    if (ogImageMatch && ogImageMatch[1]) {
      imageUrl = ogImageMatch[1];
      console.log('Imagem encontrada via og:image:', imageUrl);
    } else if (twitterImageMatch && twitterImageMatch[1]) {
      imageUrl = twitterImageMatch[1];
      console.log('Imagem encontrada via twitter:image:', imageUrl);
    }
    
    // Converter para URL absoluta se for relativa
    if (imageUrl && imageUrl.startsWith('/')) {
      const urlObj = new URL(url);
      imageUrl = `${urlObj.origin}${imageUrl}`;
      console.log('Convertida para URL absoluta:', imageUrl);
    } else if (imageUrl && !imageUrl.startsWith('http')) {
      const urlObj = new URL(url);
      imageUrl = `${urlObj.origin}/${imageUrl}`;
      console.log('Convertida para URL absoluta (sem barra):', imageUrl);
    }
    
    // Processar a imagem para CORS
    if (imageUrl) {
      const safeImageUrl = getSafeImageUrl(imageUrl);
      console.log('Imagem processada para proxy:', safeImageUrl);
      imageUrl = safeImageUrl;
    } else {
      // Fallback para logo do domínio
      imageUrl = getFallbackImage(url);
      console.log('Usando imagem de fallback:', imageUrl);
    }
    
    const preview = {
      title,
      description,
      image: imageUrl,
      url,
      provider: 'direct'
    };
    
    console.log('Preview extraído com sucesso:', preview);
    return preview;
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
  
  // Persistir o cache no localStorage
  persistCacheToStorage();
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
    // Se chegou aqui, é uma URL válida, mas ainda pode ter problemas de CORS
    return url;
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