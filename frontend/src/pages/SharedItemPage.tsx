import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Item } from '../types';
import { 
  ArrowLeftIcon, 
  LinkIcon, 
  TagIcon, 
  CalendarIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  CodeBracketIcon as CodeIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../utils/formatDate';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getSharedItem as getSharedItemFromSupabase, incrementViewCount } from '../utils/supabase';

// Ícone para cada tipo de item
const TypeIcon = ({ type }: { type: Item['type'] }) => {
  switch (type) {
    case 'link':
      return <LinkIcon className="h-5 w-5" />;
    case 'note':
      return <DocumentTextIcon className="h-5 w-5" />;
    case 'code':
      return <CodeIcon className="h-5 w-5" />;
    case 'prompt':
      return <LightBulbIcon className="h-5 w-5" />;
    default:
      return null;
  }
};

export const SharedItemPage = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { getSharedItem: getLocalSharedItem, tags } = useApp();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Atualizar o título da página quando o item for carregado
  useEffect(() => {
    if (item) {
      document.title = `${item.title} | PromptNote`;
    } else {
      document.title = 'Item Compartilhado | PromptNote';
    }
  }, [item]);
  
  // Função para buscar o item do Supabase ou localmente
  const fetchSharedItem = async () => {
    if (!shareId) {
      setLoading(false);
      return;
    }
  
    try {
      // Primeiro tentar buscar localmente (prioriza o armazenamento local)
      const localItem = getLocalSharedItem(shareId);
      
      if (localItem) {
        if (localItem.share?.password) {
          setPasswordProtected(true);
        } else {
          setItem(localItem);
        }
        setLoading(false);
        return;
      }
      
      // Se não encontrou localmente, tentar no Supabase
      try {
        const supabaseItem = await getSharedItemFromSupabase(shareId);
        
        if (supabaseItem) {
          // Se encontrou no Supabase, incrementar contador de visualizações
          try {
            await incrementViewCount(shareId);
          } catch (countError) {
            console.warn('Não foi possível incrementar contador de visualizações:', countError);
          }
          
          // Verificar se existe proteção por senha no objeto retornado do Supabase
          const itemWithPassword = supabaseItem as any;
          if (itemWithPassword.share?.password) {
            setPasswordProtected(true);
          } else {
            setItem(supabaseItem as unknown as Item);
          }
        } else {
          // Não encontrou em nenhum lugar
          console.log('Item não encontrado em nenhum armazenamento');
        }
      } catch (supabaseError) {
        console.warn('Erro ao acessar Supabase, usando apenas dados locais:', supabaseError);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar item compartilhado:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSharedItem();
  }, [shareId]);
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shareId) return;
    
    try {
      // Primeiro tentar verificar no Supabase
      const supabaseItem = await getSharedItemFromSupabase(shareId);
      
      if (supabaseItem && (supabaseItem as any).password === password) {
        setItem(supabaseItem as unknown as Item);
        setPasswordProtected(false);
        setPasswordError(false);
        return;
      }
      
      // Se não encontrou no Supabase, tentar localmente
      const localItem = getLocalSharedItem(shareId);
      
      if (localItem && localItem.share?.password === password) {
        setItem(localItem);
        setPasswordProtected(false);
        setPasswordError(false);
      } else {
        setPasswordError(true);
      }
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      setPasswordError(true);
    }
  };
  
  const handleImageError = () => {
    setImageError(true);
  };

  // Determinar se é um link do Instagram
  const isInstagram = item?.url?.includes('instagram.com') || false;
  const isInstagramReel = isInstagram && item?.url?.includes('/reel/');
  
  // Função para transformar URLs de imagem para usar um proxy caso necessário
  const getSafeImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    
    // Se já é uma URL do Imgur, usamos diretamente
    if (url?.includes('imgur.com')) {
      return url;
    }
    
    // Se já é uma URL do proxy images.weserv.nl, retornamos ela mesma
    if (url?.includes('images.weserv.nl')) {
      return url;
    }
    
    // Para outras URLs, vemos se precisamos usar o proxy images.weserv.nl
    try {
      // Verificamos se é uma URL absoluta
      new URL(url);
      // Se chegou aqui, é uma URL válida, mas ainda pode ter problemas de CORS
      return url;
    } catch (e) {
      // Se for uma URL relativa, tentamos completar com o domínio
      if (item?.url) {
        try {
          const domain = new URL(item.url).origin;
          const fullUrl = new URL(url, domain).href;
          return fullUrl;
        } catch (err) {
          console.error('Erro ao resolver URL relativa:', err);
        }
      }
      return url;
    }
  };
  
  // Recuperar o nome do domínio para exibição
  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch (error) {
      return url;
    }
  };
  
  // Encontrar as tags com informações completas
  const itemTags = item?.tags?.map(tagName => {
    const tagInfo = tags.find(t => t.name === tagName);
    return {
      name: tagName,
      color: tagInfo?.color || '#999'
    };
  }) || [];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Carregando...</h2>
        </div>
      </div>
    );
  }

  if (!item && !passwordProtected) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Item não encontrado</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Este item não existe, foi removido ou o link expirou.
          </p>
          <a 
            href={window.location.origin} 
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar para a página inicial
          </a>
        </div>
      </div>
    );
  }
  
  if (passwordProtected) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            Item protegido por senha
          </h2>
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">
                Digite a senha para acessar este conteúdo
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  passwordError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Senha"
              />
              {passwordError && (
                <p className="mt-1 text-red-500 text-sm">Senha incorreta. Tente novamente.</p>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <a 
                href={window.location.origin}
                className="text-purple-600 dark:text-purple-400 hover:underline"
              >
                Voltar para a página inicial
              </a>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Acessar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Renderizar apenas o card do item compartilhado
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Cabeçalho da página */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Item compartilhado via PromptNote
          </h1>
        </div>
        
        {/* Card do Item */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-auto">
          {/* Cabeçalho do card */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-purple-600 dark:text-purple-400">
                  <TypeIcon type={item?.type || 'note'} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{item?.title}</h1>
              </div>
              
              {/* Indicador de tipo do item */}
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 uppercase">
                {item?.type}
              </span>
            </div>
            
            {/* Descrição */}
            {item?.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
            )}
          </div>

          {/* Conteúdo principal */}
          <div className="max-h-[500px] overflow-auto">
            {/* Conteúdo específico por tipo */}
            {item?.type === 'link' && item?.url && (
              <div>
                {/* Imagem do preview */}
                {item.preview?.image && !imageError ? (
                  <div className="w-full relative h-auto min-h-[180px] max-h-[300px]">
                    <img 
                      src={getSafeImageUrl(item.preview.image)}
                      alt={item.preview.title || item?.title} 
                      className="w-full object-contain h-full"
                      onError={handleImageError}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Overlay de play para reels do Instagram */}
                    {isInstagramReel && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <div className="bg-white bg-opacity-80 rounded-full p-3">
                          <PlayIcon className="h-8 w-8 text-black" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : imageError ? (
                  <div className="w-full h-[180px] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Imagem indisponível</span>
                  </div>
                ) : null}
                
                {/* Informações do link */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800">
                  {/* URL do site */}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    <span>{getDomainFromUrl(item.url)}</span>
                    {isInstagram && (
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                        {isInstagramReel ? 'reel' : 'post'}
                      </span>
                    )}
                  </div>
                  
                  {/* Botão para abrir o link */}
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    <ExternalLinkIcon className="h-4 w-4 mr-2" />
                    Abrir Link Original
                  </a>
                </div>
              </div>
            )}

            {item?.type === 'note' && (
              <div className="p-4 prose dark:prose-invert max-w-none prose-sm">
                <Markdown>
                  {item.content}
                </Markdown>
              </div>
            )}

            {item?.type === 'code' && (
              <div>
                <SyntaxHighlighter
                  language="javascript"
                  style={materialDark}
                  customStyle={{ margin: 0, borderRadius: 0 }}
                  showLineNumbers
                >
                  {item?.content || ''}
                </SyntaxHighlighter>
              </div>
            )}

            {item?.type === 'prompt' && (
              <div className="p-4 space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">Prompt</h3>
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">{item?.content}</div>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé do card */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            {/* Tags */}
            {itemTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {itemTags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: `${tag.color}20`, 
                      color: tag.color 
                    }}
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Data de criação */}
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <CalendarIcon className="h-3 w-3 mr-1" />
              Criado em: {formatDate(item?.createdAt || new Date())}
            </div>
            
            {/* Link de volta para o app */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Este é um item compartilhado através do PromptNote.
              </p>
              <a
                href={window.location.origin}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Conhecer o PromptNote
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 