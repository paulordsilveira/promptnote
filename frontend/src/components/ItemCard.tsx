import { useState, useEffect } from 'react';
import { 
  StarIcon, 
  LinkIcon, 
  DocumentTextIcon, 
  CodeBracketIcon as CodeIcon, 
  LightBulbIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  ShareIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Item } from '../types';
import { getRelativeTimeString } from '../utils/formatDate';
import { useApp } from '../contexts/AppContext';

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

interface ItemCardProps {
  item: Item;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
}

export const ItemCard = ({ item, onSelect, onToggleFavorite }: ItemCardProps) => {
  const { tags: allTags, startEditing } = useApp();
  // Determinar se devemos mostrar o preview
  const showPreview = item.type === 'link' && item.preview;
  
  // Estado para rastrear erros de carregamento de imagem
  const [imageError, setImageError] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  
  // Determinar se é um link do Instagram
  const isInstagram = item.url?.includes('instagram.com') || false;
  const isInstagramReel = isInstagram && item.url?.includes('/reel/');
  
  // Redefinir o erro de imagem quando o item muda
  useEffect(() => {
    setImageError(false);
  }, [item.id, item.preview?.image]);
  
  // Recuperar o nome do domínio para exibição
  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch (error) {
      return url;
    }
  };

  // Obter as informações completas das tags
  const getTagInfo = (tagName: string) => {
    const tagInfo = allTags.find(tag => tag.name === tagName);
    return {
      name: tagName,
      color: tagInfo?.color || '#999999'
    };
  };

  // Manipulador de erro de imagem
  const handleImageError = () => {
    console.log('Erro ao carregar imagem do card:', item.id);
    setImageError(true);
  };

  // Função para transformar URLs de imagem para usar um proxy caso necessário
  const getSafeImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    
    // Se já é uma URL do Imgur, usamos diretamente
    if (url.includes('imgur.com')) {
      return url;
    }
    
    // Se já é uma URL do proxy images.weserv.nl, retornamos ela mesma
    if (url.includes('images.weserv.nl')) {
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
      if (item.url) {
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

  // Função para compartilhar um item
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar ativação do card
    
    // Criar um objeto para compartilhar
    const shareData = {
      title: item.title,
      text: item.description || item.title,
      url: item.url || window.location.href
    };
    
    // Verificar se a API de compartilhamento está disponível
    if (navigator.share && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .then(() => console.log('Item compartilhado com sucesso'))
        .catch(err => console.error('Erro ao compartilhar:', err));
    } else {
      // Fallback para navegadores que não suportam a API de compartilhamento
      alert('Compartilhar: ' + item.title + '\n' + (item.url || window.location.href));
      
      // Alternativa: copiar o link para a área de transferência
      if (navigator.clipboard) {
        navigator.clipboard.writeText(item.url || window.location.href)
          .then(() => alert('Link copiado para a área de transferência!'))
          .catch(err => console.error('Erro ao copiar:', err));
      }
    }
  };

  // Função para iniciar a edição do item
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impedir que o card seja selecionado
    startEditing(item.id);
  };

  return (
    <div 
      className="bg-[#373739] dark:bg-[#191919] rounded-xl overflow-hidden border border-gray-700 dark:border-gray-800 hover:border-purple-light dark:hover:border-purple-light shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-[320px]"
      onClick={() => onSelect(item.id)}
    >
      {/* Cabeçalho do card */}
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-md bg-gray-600 dark:bg-gray-800 text-purple-light">
              <TypeIcon type={item.type} />
            </div>
            <h3 className="font-medium text-white line-clamp-1 text-sm">{item.title}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              className="p-1 rounded-md text-xs flex items-center bg-gray-700 text-white"
              onClick={handleEdit}
              title="Editar item"
            >
              <PencilIcon className="h-3 w-3" />
            </button>
            {item.share ? (
              <a
                href={`${window.location.origin}/shared/${item.share.shareId}`}
                onClick={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1 rounded-md text-xs flex items-center ${
                  item.share.status === 'public' 
                    ? 'bg-blue-900 text-blue-300' 
                    : 'bg-green-900 text-green-300'
                }`}
                title="Abrir link compartilhado"
              >
                <ShareIcon className="h-3 w-3 mr-1" />
                {item.share.status === 'public' ? 'T' : 'C'}
              </a>
            ) : (
              <button
                className="p-1 rounded-md text-xs flex items-center bg-purple-900 text-purple-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(e);
                }}
                title="Compartilhar"
              >
                <ShareIcon className="h-3 w-3 mr-1" />
                P
              </button>
            )}
            <button
              className="text-gray-400 hover:text-gold p-1"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id, !item.favorite);
              }}
              title={item.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              {item.favorite ? (
                <StarIconSolid className="h-4 w-4 text-gold" />
              ) : (
                <StarIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Descrição para todos os tipos */}
        {item.description && (
          <p className="text-gray-300 text-xs mb-2 line-clamp-2">{item.description}</p>
        )}
      </div>

      {/* Conteúdo específico por tipo */}
      <div className="border-t border-gray-200 dark:border-gray-700 flex-1 overflow-hidden">
        {/* Preview de link */}
        {showPreview && (
          <>
            {/* Imagem do preview - Ocupando largura total */}
            {item.preview?.image && !imageError ? (
              <div className="w-full relative h-[100px]">
                <img 
                  src={getSafeImageUrl(item.preview.image)}
                  alt={item.title} 
                  className="w-full object-cover h-full"
                  onError={handleImageError}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  decoding="async"
                />
                
                {/* Overlay de play para reels do Instagram */}
                {isInstagramReel && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white bg-opacity-80 rounded-full p-2">
                      <PlayIcon className="h-6 w-6 text-black" />
                    </div>
                  </div>
                )}
              </div>
            ) : imageError ? (
              <div className="w-full h-[100px] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">Imagem indisponível</span>
              </div>
            ) : null}
            
            {/* Informações do link */}
            <div className="p-3 bg-gray-700 dark:bg-gray-800 flex-1 overflow-y-auto max-h-[100px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {/* URL do site */}
              {item.url && (
                <div className="flex items-center text-xs text-gray-300 dark:text-gray-400 mb-1">
                  <LinkIcon className="h-3 w-3 mr-1" />
                  <span className="truncate">{getDomainFromUrl(item.url)}</span>
                  {isInstagram && (
                    <span className="ml-1 px-1 py-0.5 text-[9px] bg-gray-600 dark:bg-gray-700 rounded-full">
                      {isInstagramReel ? 'reel' : 'post'}
                    </span>
                  )}
                </div>
              )}
              
              {/* Título do preview */}
              {item.preview?.title && (
                <h4 className="text-xs font-medium text-gray-100 dark:text-gray-200 mb-1 line-clamp-2">
                  {item.preview.title}
                </h4>
              )}
              
              {/* Descrição do preview */}
              {item.preview?.description && (
                <p className="text-xs text-gray-300 dark:text-gray-400 line-clamp-3">
                  {item.preview.description}
                </p>
              )}
            </div>
          </>
        )}
        
        {/* Preview de nota */}
        {item.type === 'note' && item.content && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 flex-1 relative overflow-y-auto max-h-[150px] scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div 
              className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-transparent" 
              style={{ borderRight: '12px solid #d1d5db' }}
            ></div>
            <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {item.content}
            </p>
          </div>
        )}
        
        {/* Preview de código */}
        {item.type === 'code' && item.content && (
          <div className="p-3 bg-gray-800 dark:bg-gray-900 font-mono flex-1 relative overflow-y-auto max-h-[180px]">
            <div className="absolute top-2 left-2 flex space-x-1.5">
              <div className="editor-button editor-red"></div>
              <div className="editor-button editor-yellow"></div>
              <div className="editor-button editor-green"></div>
            </div>
            <div className="text-xs text-gray-200 dark:text-gray-300 pt-4 markdown-code">
              <pre>{`\`\`\`
${item.content}
\`\`\``}</pre>
            </div>
          </div>
        )}
        
        {/* Preview de prompt */}
        {item.type === 'prompt' && item.content && (
          <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex-1 overflow-y-auto max-h-[180px]">
            {/* Prompt */}
            <div className="mb-2">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 rounded-full bg-purple-DEFAULT mr-1"></div>
                <span className="text-[9px] uppercase font-semibold text-purple-DEFAULT">Prompt</span>
              </div>
              <div className="bg-purple-DEFAULT/10 dark:bg-purple-DEFAULT/20 rounded-lg p-2 pl-3 border-l-2 border-purple-DEFAULT">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {item.content.split('---RESPOSTA---')[0]?.trim() || item.content}
                </p>
              </div>
            </div>
            
            {/* Resposta do prompt (se existir) */}
            {item.content.includes('---RESPOSTA---') && (
              <div>
                <div className="flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-[9px] uppercase font-semibold text-green-500">Resposta</span>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 pl-3 border-l-2 border-green-500">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {item.content.split('---RESPOSTA---')[1]?.trim()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Anexos - Exibidos para todos os tipos de item, se existirem */}
        {item.attachments && item.attachments.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-1 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-[9px] uppercase font-semibold text-blue-500">Anexos ({item.attachments.length})</span>
            </div>
            <div className="space-y-1 max-h-[60px] overflow-y-auto pr-1">
              {item.attachments.slice(0, 2).map((attachment, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">
                  <div className="flex items-center overflow-hidden">
                    <span className="mr-1 text-lg">
                      {attachment.type.includes('image') ? '🖼️' : 
                       attachment.type.includes('pdf') ? '📄' : 
                       attachment.type.includes('word') ? '📝' : 
                       attachment.type.includes('excel') ? '📊' : 
                       attachment.type.includes('zip') ? '📦' : '📎'}
                    </span>
                    <span className="truncate">{attachment.title || attachment.name}</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-[10px] whitespace-nowrap">
                    {Math.round(attachment.size / 1024)} KB
                  </span>
                </div>
              ))}
              {item.attachments.length > 2 && (
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                  +{item.attachments.length - 2} {item.attachments.length - 2 === 1 ? 'anexo' : 'anexos'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer com tags e data */}
      <div className="px-3 py-2">
        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {item.tags.slice(0, 3).map(tag => {
              const tagInfo = getTagInfo(tag);
              return (
                <span 
                  key={tag} 
                  className="tag text-[9px] px-1.5 py-0.5 rounded-full bg-purple-DEFAULT/10 dark:bg-purple-DEFAULT/20 text-purple-DEFAULT dark:text-purple-light"
                  style={{ 
                    backgroundColor: `${tagInfo.color}20`, 
                    color: tagInfo.color
                  }}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full mr-1 inline-block" 
                    style={{ backgroundColor: tagInfo.color }}
                  ></span>
                  {tag}
                </span>
              );
            })}
            {item.tags.length > 3 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Data de atualização */}
        <div className="text-[9px] text-gray-500 dark:text-gray-400">
          Atualizado {getRelativeTimeString(item.updatedAt)}
        </div>
      </div>
    </div>
  );
}; 