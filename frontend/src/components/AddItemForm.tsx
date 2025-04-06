import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { 
  XMarkIcon, 
  LinkIcon, 
  DocumentTextIcon, 
  CodeBracketIcon,
  LightBulbIcon,
  TagIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import { Item } from '../types';
import { TagSelector } from './TagSelector';
import { CollectionSelector } from './CollectionSelector';
import { fetchOGData } from '../utils/ogFetcher';

interface AddItemFormProps {
  onClose: () => void;
  initialType?: string;
  editItem?: Item;
  collection?: string;
  onBack?: () => void;
}

type ItemType = 'note' | 'link' | 'code' | 'prompt';

interface PreviewData {
  image?: string;
  title?: string;
  description?: string;
  url?: string;
}

export const AddItemForm = ({ onClose, initialType, editItem, collection: initialCollection, onBack }: AddItemFormProps) => {
  const { collections, addItem, tags: allTags, updateItem } = useApp();
  const [itemType, setItemType] = useState<ItemType>((editItem?.type as ItemType) || initialType as ItemType || 'note');
  const [title, setTitle] = useState(editItem?.title || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [content, setContent] = useState(editItem?.content || '');
  const [url, setUrl] = useState(editItem?.url || '');
  const [collection, setCollection] = useState(initialCollection || editItem?.collection || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(editItem?.tags || []);
  const [error, setError] = useState('');
  const [observation, setObservation] = useState(editItem?.observation || '');
  const [preview, setPreview] = useState<PreviewData | null>(editItem?.preview || null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promptContent, setPromptContent] = useState('');
  const [promptResponse, setPromptResponse] = useState('');
  const [loadingStatus, setLoadingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Efeito para separar o conteúdo do prompt da resposta quando estiver editando
  useEffect(() => {
    if (editItem && editItem.type === 'prompt' && editItem.content) {
      const parts = editItem.content.split('---RESPOSTA---');
      if (parts.length > 1) {
        setPromptContent(parts[0].trim());
        setPromptResponse(parts[1].trim());
      } else {
        setPromptContent(editItem.content);
      }
    }
  }, [editItem]);

  // Reiniciar o erro de imagem quando a URL mudar
  useEffect(() => {
    setImageError(false);
  }, [url, preview?.image]);

  // Verificar se é um link do Instagram
  const isInstagram = itemType === 'link' && url.includes('instagram.com');
  const isInstagramReel = isInstagram && url.includes('/reel/');

  // Visualizar preview para links
  useEffect(() => {
    if (itemType === 'link' && url.trim()) {
      setLoading(true);
      setLoadingStatus('loading');
      setImageError(false);
      
      try {
        // Verifica se a URL é válida
        new URL(url.trim());
        
        const timeoutId = setTimeout(() => {
          fetchOGData(url.trim())
            .then(data => {
              setPreview(data);
              
              // Preencher automaticamente título/descrição se estiverem vazios
              if (!title && data.title) {
                setTitle(data.title);
              }
              if (!description && data.description) {
                setDescription(data.description);
              }
              
              setLoading(false);
              setLoadingStatus('success');
            })
            .catch(error => {
              console.error('Erro ao buscar dados OG:', error);
              setPreview(null);
              setLoading(false);
              setLoadingStatus('error');
            });
        }, 1000); // Adicionar uma pequena pausa para mostrar a animação de carregamento
        
        return () => clearTimeout(timeoutId);
      } catch (error) {
        // Se a URL for inválida, limpe o preview e interrompa o carregamento
        setPreview(null);
        setLoading(false);
        setLoadingStatus('error');
      }
    } else {
      setPreview(null);
      setLoading(false);
      setLoadingStatus('idle');
    }
  }, [url, itemType, title, description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }
    
    if (itemType === 'link' && !url.trim()) {
      setError('A URL é obrigatória para links');
      return;
    }
    
    // Validar se uma coleção foi selecionada
    if (!collection) {
      setError('Por favor, selecione uma coleção');
      return;
    }
    
    // Preparar o conteúdo para prompts (combinando prompt e resposta)
    let finalContent = content;
    if (itemType === 'prompt') {
      finalContent = promptContent.trim();
      if (promptResponse.trim()) {
        finalContent += '\n\n---RESPOSTA---\n\n' + promptResponse.trim();
      }
    }
    
    // Criar o objeto do item
    const itemData = {
      title: title.trim(),
      type: itemType,
      description: description.trim(),
      content: itemType !== 'link' ? finalContent.trim() : '',
      url: itemType === 'link' ? url.trim() : undefined,
      observation: observation.trim() || undefined,
      preview: itemType === 'link' && preview ? {
        image: preview.image,
        title: preview.title,
        description: preview.description,
        url: url.trim()
      } : undefined,
      tags: selectedTags,
      collection: collection,
      favorite: editItem ? editItem.favorite : false,
      relationships: editItem ? editItem.relationships : [],
    };
    
    // Chamar a API para adicionar ou atualizar o item
    if (editItem) {
      updateItem(editItem.id, itemData);
    } else {
      addItem(itemData);
    }
    
    // Fechar o formulário
    onClose();
  };

  const handleImageError = () => {
    console.log('Erro ao carregar imagem no preview do form');
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
      // Se for uma URL relativa e temos a URL principal do item
      if (itemType === 'link' && url.trim()) {
        try {
          const domain = new URL(url.trim()).origin;
          const fullUrl = new URL(url, domain).href;
          return fullUrl;
        } catch (err) {
          console.error('Erro ao resolver URL relativa:', err);
        }
      }
      return url;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#191919] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            {onBack && (
              <button
                onClick={onBack}
                className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editItem ? "Editar Item" : "Adicionar Item"}
            </h2>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {/* Tipo de item */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Tipo de item
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`flex items-center px-3 py-2 rounded-md border ${
                  itemType === 'note'
                    ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
                onClick={() => setItemType('note')}
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Nota
              </button>
              <button
                type="button"
                className={`flex items-center px-3 py-2 rounded-md border ${
                  itemType === 'link'
                    ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
                onClick={() => setItemType('link')}
              >
                <LinkIcon className="h-5 w-5 mr-2" />
                Link
              </button>
              <button
                type="button"
                className={`flex items-center px-3 py-2 rounded-md border ${
                  itemType === 'code'
                    ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
                onClick={() => setItemType('code')}
              >
                <CodeBracketIcon className="h-5 w-5 mr-2" />
                Código
              </button>
              <button
                type="button"
                className={`flex items-center px-3 py-2 rounded-md border ${
                  itemType === 'prompt'
                    ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
                onClick={() => setItemType('prompt')}
              >
                <LightBulbIcon className="h-5 w-5 mr-2" />
                Prompt
              </button>
            </div>
          </div>
      
          {/* Coleções */}
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <FolderIcon className="h-5 w-5 mr-1 text-gray-700 dark:text-gray-300" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Coleções <span className="text-red-500">*</span>
              </label>
            </div>
            <CollectionSelector
              selectedCollection={collection}
              onChange={setCollection}
            />
          </div>

          {/* Campos específicos para Link */}
          {itemType === 'link' && (
            <>
              <div className="mb-4">
                <label htmlFor="url" className="block text-gray-700 dark:text-gray-300 mb-2">
                  URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://exemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                    </a>
                  )}
                </div>
                {loadingStatus === 'loading' && (
                  <div className="mt-2 flex items-center text-gray-500 dark:text-gray-400">
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Carregando informações...
                  </div>
                )}
                {loadingStatus === 'error' && (
                  <div className="mt-2 flex items-center text-red-500">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                    Não foi possível obter informações desta URL
                  </div>
                )}
              </div>

              {/* Preview para link */}
              {preview && (
                <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Preview</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {preview.image && !imageError && (
                      <div className="sm:w-1/3 h-32 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={getSafeImageUrl(preview.image)}
                          alt={preview.title || "Preview"}
                          onError={handleImageError}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {preview.title || "Sem título"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {preview.description || "Sem descrição"}
                      </p>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 truncate">
                        {url}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Campos específicos para Código */}
          {itemType === 'code' && (
            <div className="mb-4">
              <label htmlFor="language" className="block text-gray-700 dark:text-gray-300 mb-2">
                Linguagem
              </label>
              <select
                id="language"
                value={content.split('\n')[0] || ''}
                onChange={(e) => {
                  const selectedLanguage = e.target.value;
                  const codeContent = content.split('\n').slice(1).join('\n');
                  setContent(`${selectedLanguage}\n${codeContent}`);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma linguagem</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="sql">SQL</option>
                <option value="json">JSON</option>
                <option value="typescript">TypeScript</option>
                <option value="jsx">React/JSX</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
                <option value="rust">Rust</option>
                <option value="bash">Bash/Shell</option>
                <option value="powershell">PowerShell</option>
                <option value="markdown">Markdown</option>
                <option value="yaml">YAML</option>
                <option value="dockerfile">Dockerfile</option>
                <option value="graphql">GraphQL</option>
              </select>
            </div>
          )}

          {/* Campos específicos para Prompt */}
          {itemType === 'prompt' && (
            <>
              <div className="mb-4">
                <label htmlFor="promptContent" className="block text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
                  Prompt
                </label>
                <textarea
                  id="promptContent"
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="Digite seu prompt aqui..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="promptResponse" className="block text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <PlayIcon className="h-5 w-5 mr-2 text-green-500" />
                  Resposta (opcional)
                </label>
                <textarea
                  id="promptResponse"
                  value={promptResponse}
                  onChange={(e) => setPromptResponse(e.target.value)}
                  placeholder="Cole a resposta do modelo aqui (opcional)..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Título */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 dark:text-gray-300 mb-2">
              Título
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do item"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Descrição */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição breve do item"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Conteúdo para Nota */}
          {itemType === 'note' && (
            <div className="mb-4">
              <label htmlFor="content" className="block text-gray-700 dark:text-gray-300 mb-2">
                Conteúdo
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Conteúdo detalhado da nota"
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Conteúdo para Código */}
          {itemType === 'code' && (
            <div className="mb-4">
              <label htmlFor="codeContent" className="block text-gray-700 dark:text-gray-300 mb-2">
                Código
              </label>
              <textarea
                id="codeContent"
                value={content.split('\n').slice(1).join('\n')}
                onChange={(e) => {
                  const language = content.split('\n')[0] || '';
                  setContent(`${language}\n${e.target.value}`);
                }}
                placeholder="Cole seu código aqui"
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          )}

          {/* Observações */}
          <div className="mb-4">
            <label htmlFor="observation" className="block text-gray-700 dark:text-gray-300 mb-2">
              Observações (opcional)
            </label>
            <textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Observações adicionais"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <TagIcon className="h-5 w-5 mr-2 text-gray-700 dark:text-gray-300" />
              <label className="text-gray-700 dark:text-gray-300">Tags</label>
            </div>
            <TagSelector 
              selectedTags={selectedTags} 
              onChange={setSelectedTags} 
              existingTags={allTags} 
            />
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="p-3 mb-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                {error}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 