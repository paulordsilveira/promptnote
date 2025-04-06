import { useState, useEffect } from 'react';
import { 
  StarIcon, 
  PencilIcon, 
  TrashIcon, 
  LinkIcon,
  XMarkIcon,
  TagIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  CodeBracketIcon as CodeIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  PaperClipIcon,
  ArrowsRightLeftIcon,
  HeartIcon,
  ArrowLeftIcon,
  DocumentIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookmarkIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useApp } from '../contexts/AppContext';
import { formatDate } from '../utils/formatDate';
import { ConfirmModal } from './ConfirmModal';
import { ShareModal } from './ShareModal';
import { AddItemForm } from './AddItemForm';

export const ItemDetail = () => {
  const { currentItem, updateItem, deleteItem, setCurrentItem, tags } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);

  // Determinar se é um link do Instagram
  const isInstagram = currentItem?.url?.includes('instagram.com') || false;
  const isInstagramReel = isInstagram && currentItem?.url?.includes('/reel/');

  // Reiniciar o estado de erro da imagem quando o item mudar
  useEffect(() => {
    if (currentItem) {
      setImageError(false);
      setIsEditing(false);
    }
  }, [currentItem?.id, currentItem?.preview?.image]);

  if (!currentItem) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Selecione um item para visualizar os detalhes</p>
      </div>
    );
  }

  const handleClose = () => {
    setCurrentItem(null);
  };

  const handleToggleFavorite = () => {
    updateItem(currentItem.id, { favorite: !currentItem.favorite });
  };

  const handleConfirmDelete = () => {
    deleteItem(currentItem.id);
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCloseEditForm = () => {
    setIsEditing(false);
  };

  const handleImageError = () => {
    console.log('Erro ao carregar imagem do detalhe:', currentItem?.id);
    setImageError(true);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleAttachmentClick = (attachment: any) => {
    setSelectedAttachment(attachment);
    setShowAttachmentModal(true);
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
      if (currentItem.url) {
        try {
          const domain = new URL(currentItem.url).origin;
          const fullUrl = new URL(url, domain).href;
          return fullUrl;
        } catch (err) {
          console.error('Erro ao resolver URL relativa:', err);
        }
      }
      return url;
    }
  };

  // Se estiver no modo de edição, mostra o formulário de edição
  if (isEditing && currentItem) {
    return (
      <AddItemForm 
        onClose={handleCloseEditForm} 
        editItem={currentItem} 
        collection={currentItem.collection}
      />
    );
  }

  // Encontrar as tags com informações completas
  const itemTags = currentItem.tags?.map(tagName => {
    const tagInfo = tags.find(t => t.name === tagName);
    return {
      name: tagName,
      color: tagInfo?.color || '#999'
    };
  }) || [];

  // Recuperar o nome do domínio para exibição
  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch (error) {
      return url;
    }
  };

  // Função para formatar a data de criação
  const formatCreationDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      // Verificar se a data é válida antes de formatar
      if (isNaN(date.getTime())) {
        return "Data não disponível";
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Erro ao formatar data:", dateString, e);
      return "Data não disponível";
    }
  };

  // Função para obter ícone de arquivo baseado no tipo
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel')) return '📊';
    if (fileType.includes('zip')) return '📦';
    return '📎';
  };

  return (
    <>
      <div className="flex-1 bg-gray-900 dark:bg-gray-900 bg-white overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4">
          {/* Layout em duas colunas */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Coluna principal (conteúdo existente) */}
            <div className="flex-1">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-blue-400 uppercase">
                      {currentItem.type}
                    </span>
                    {currentItem.type === 'link' && currentItem.url && (
                      <a 
                        href={currentItem.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 rounded-full bg-gray-800 text-green-400 flex items-center"
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Abrir Link
                      </a>
                    )}
                    {isInstagram && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-purple-400 flex items-center">
                        {isInstagramReel ? (
                          <>
                            <PlayIcon className="h-3 w-3 mr-1" />
                            Reel
                          </>
                        ) : (
                          'Instagram'
                        )}
                      </span>
                    )}
                    {currentItem.share && (
                      <>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center ${
                          currentItem.share.status === 'public' 
                            ? 'bg-blue-800 text-blue-200' 
                            : 'bg-green-800 text-green-200'
                        }`}>
                          <ShareIcon className="h-3 w-3 mr-1" />
                          {currentItem.share.status === 'public' ? 'Temporário' : 'Compartilhado'}
                          {currentItem.share.maxViews && (
                            <span className="ml-1 bg-blue-700 px-1 rounded-sm text-[10px]">
                              {currentItem.share.viewCount || 0}/{currentItem.share.maxViews}
                            </span>
                          )}
                        </span>
                        <a 
                          href={`${window.location.origin}/shared/${currentItem.share.shareId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs px-2 py-1 rounded-full flex items-center ${
                            currentItem.share.status === 'public' 
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                              : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          }`}
                        >
                          <ExternalLinkIcon className="h-3 w-3 mr-1" />
                          Testar Link
                        </a>
                      </>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{currentItem.title}</h1>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    className={`p-2 rounded-full transition-colors ${
                      currentItem.share 
                        ? currentItem.share.status === 'public'
                          ? 'text-blue-400 hover:text-blue-500' 
                          : 'text-green-400 hover:text-green-500'
                        : 'text-purple-400 hover:text-purple-500'
                    }`}
                    onClick={() => setShowDropdown(!showDropdown)}
                    title={
                      currentItem.share
                        ? currentItem.share.status === 'public'
                          ? 'Compartilhamento temporário' 
                          : 'Compartilhado com link'
                        : 'Privado (clique para compartilhar)'
                    }
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Dropdown de compartilhamento */}
                  {showDropdown && (
                    <div className="absolute z-10 mt-10 mr-10 w-60 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="py-1">
                        <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          OPÇÕES DE COMPARTILHAMENTO
                        </h3>
                        <button
                          onClick={() => {
                            setShowShareModal(true);
                            setShowDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                        >
                          <div className="w-4 h-4 rounded-full bg-purple-600 mr-2 flex items-center justify-center">
                            <span className="text-[8px] text-white">P</span>
                          </div>
                          Privado (apenas você)
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowShareModal(true);
                            setShowDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                        >
                          <div className="w-4 h-4 rounded-full bg-green-600 mr-2 flex items-center justify-center">
                            <span className="text-[8px] text-white">C</span>
                          </div>
                          Compartilhado (com link)
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowShareModal(true);
                            setShowDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                        >
                          <div className="w-4 h-4 rounded-full bg-blue-600 mr-2 flex items-center justify-center">
                            <span className="text-[8px] text-white">T</span>
                          </div>
                          Temporário (com limites)
                        </button>
                        
                        {currentItem.share && (
                          <>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            <a
                              href={`${window.location.origin}/shared/${currentItem.share.shareId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                              onClick={() => setShowDropdown(false)}
                            >
                              <ExternalLinkIcon className="h-4 w-4 mr-2" />
                              Abrir link compartilhado
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleToggleFavorite}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                    title={currentItem.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    {currentItem.favorite ? (
                      <StarIconSolid className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-purple-light rounded-full transition-colors"
                    onClick={handleEdit}
                    title="Editar item"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full"
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Excluir item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-white rounded-full"
                    onClick={handleClose}
                    title="Fechar"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Descrição */}
              {currentItem.description && (
                <div className="mb-4">
                  <p className="text-gray-300 text-sm">{currentItem.description}</p>
                </div>
              )}

              {/* Observações */}
              {currentItem.observation && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <h3 className="text-sm font-medium text-gray-400">Observações:</h3>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <textarea
                      className="w-full bg-gray-800 text-gray-300 text-sm italic resize-y min-h-[100px] focus:outline-none"
                      value={currentItem.observation || ''}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 500);
                        updateItem(currentItem.id, { observation: value });
                      }}
                      maxLength={500}
                      placeholder="Adicione observações (máximo 500 caracteres)"
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {(currentItem.observation?.length || 0)}/500
                    </div>
                  </div>
                </div>
              )}

              {/* Preview de link */}
              {currentItem.type === 'link' && currentItem.preview && (
                <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow border border-gray-200 dark:border-gray-700">
                  {/* Cabeçalho do preview com domínio */}
                  {currentItem.url && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                        <LinkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{getDomainFromUrl(currentItem.url)}</span>
                      </div>
                      <a 
                        href={currentItem.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <ExternalLinkIcon className="h-5 w-5" />
                      </a>
                    </div>
                  )}
                  
                  {/* Imagem de preview */}
                  {currentItem.preview.image && !imageError ? (
                    <div className="relative">
                      <img 
                        src={getSafeImageUrl(currentItem.preview.image)}
                        alt={currentItem.title} 
                        className="w-full h-auto object-cover max-h-80"
                        onError={handleImageError}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Overlay de play para Instagram Reels */}
                      {isInstagramReel && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <div className="bg-white bg-opacity-80 rounded-full p-3">
                            <PlayIcon className="h-8 w-8 text-black" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : imageError ? (
                    <div className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <div className="text-center">
                        <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Imagem indisponível</p>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* Conteúdo do preview */}
                  <div className="p-4">
                    {currentItem.preview.title && (
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{currentItem.preview.title}</h2>
                    )}
                    
                    {currentItem.preview.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{currentItem.preview.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Conteúdo de nota */}
              {currentItem.type === 'note' && currentItem.content && (
                <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-4 border border-gray-200 dark:border-gray-700">
                  <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {currentItem.content}
                  </div>
                </div>
              )}

              {/* Conteúdo de código */}
              {currentItem.type === 'code' && currentItem.content && (
                <div className="mb-4 bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-800">
                  <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex space-x-2 mr-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 opacity-75"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-75"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500 opacity-75"></div>
                      </div>
                      <CodeIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-xs text-gray-500">código.js</span>
                    </div>
                    
                    <button 
                      className="text-gray-500 hover:text-gray-300 text-xs"
                      title="Copiar código"
                      onClick={() => {
                        navigator.clipboard.writeText(currentItem.content);
                        alert('Código copiado para a área de transferência!');
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                  
                  <div className="p-4 overflow-x-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
                    {currentItem.content}
                  </div>
                </div>
              )}

              {/* Conteúdo de prompt */}
              {currentItem.type === 'prompt' && currentItem.content && (
                <div className="mb-4">
                  {/* Prompt */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <LightBulbIcon className="h-4 w-4 text-yellow-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-400">Prompt</h3>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {currentItem.content.split('---RESPOSTA---')[0]?.trim()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Resposta (se existir) */}
                  {currentItem.content.includes('---RESPOSTA---') && (
                    <div>
                      <div className="flex items-center mb-2">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-500 mr-2" />
                        <h3 className="text-sm font-medium text-gray-400">Resposta</h3>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {currentItem.content.split('---RESPOSTA---')[1]?.trim()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Nova coluna à direita */}
            <div className="w-64 shrink-0 space-y-6">
              {/* Informações de criação */}
              <div className="bg-black rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">CRIADO EM</h3>
                <p className="text-xs text-gray-400">
                  {formatCreationDate(currentItem.createdAt)}
                </p>
              </div>
              
              {/* Anexos em miniatura */}
              {currentItem.attachments && currentItem.attachments.length > 0 && (
                <div className="bg-black rounded-xl p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">ANEXOS COM MINIATURA</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {currentItem.attachments.map((attachment, index) => (
                      <div 
                        key={index} 
                        onClick={() => handleAttachmentClick(attachment)}
                        className="cursor-pointer bg-gray-800 p-2 rounded-lg flex flex-col items-center justify-center hover:bg-gray-700 transition-colors"
                      >
                        <div className="text-xl mb-1">
                          {getFileIcon(attachment.type)}
                        </div>
                        <p className="text-xs text-gray-400 truncate w-full text-center">
                          {(attachment.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              <div className="bg-black rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">TAGS</h3>
                <div className="flex flex-wrap gap-2">
                  {itemTags.length > 0 ? (
                    itemTags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          color: tag.color
                        }}
                      >
                        <span 
                          className="w-1.5 h-1.5 rounded-full mr-1 inline-block" 
                          style={{ backgroundColor: tag.color }}
                        ></span>
                        {tag.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">Nenhuma tag adicionada</p>
                  )}
                </div>
              </div>
              
              {/* Botão Caminhos */}
              <button 
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors"
              >
                <ArrowsRightLeftIcon className="h-5 w-5 mr-2" />
                <span>Caminhos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Excluir item"
          message="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isOpen={showDeleteConfirm}
          isDestructive={true}
        />
      )}
      
      {/* Modal de compartilhamento */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          itemId={currentItem.id}
        />
      )}
      
      {/* Modal para visualização de anexos */}
      {showAttachmentModal && selectedAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setShowAttachmentModal(false)}>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedAttachment.title || selectedAttachment.name}</h3>
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {selectedAttachment.type && selectedAttachment.type.includes('image') ? (
              <img 
                src={selectedAttachment.url || ''}
                alt={selectedAttachment.name}
                className="max-w-full max-h-[80vh] object-contain mx-auto"
              />
            ) : (
              <div className="text-center py-10">
                <div className="text-4xl mb-4">{getFileIcon(selectedAttachment.type || '')}</div>
                <p className="text-gray-800 dark:text-gray-200">{selectedAttachment.name}</p>
                <p className="text-gray-500 text-sm mt-2">{selectedAttachment.size ? `${Math.round(selectedAttachment.size / 1024)} KB` : ''}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}; 