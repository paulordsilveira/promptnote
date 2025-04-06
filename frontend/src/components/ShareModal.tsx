import { useState, useEffect } from 'react';
import { 
  LinkIcon, 
  LockClosedIcon, 
  XMarkIcon as XIcon,
  CalendarIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import { ShareStatus } from '../types';
import { saveSharedItem } from '../utils/supabase';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
}

export const ShareModal = ({ isOpen, onClose, itemId }: ShareModalProps) => {
  const { items, shareItem, unshareItem } = useApp();
  const item = items.find(i => i.id === itemId);
  
  const [shareStatus, setShareStatus] = useState<ShareStatus>(item?.share?.status || 'private');
  const [sharePassword, setSharePassword] = useState<string>('');
  const [expireDate, setExpireDate] = useState<string>('');
  const [maxViews, setMaxViews] = useState<number | undefined>(undefined);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (item?.share) {
      setShareStatus(item.share.status);
      setSharePassword(item.share.password || '');
      setExpireDate(item.share.expiresAt ? new Date(item.share.expiresAt).toISOString().split('T')[0] : '');
      setMaxViews(item.share.maxViews);
      
      // FORÇAR URL ABSOLUTA usando o formato correto no carregamento
      const absoluteUrl = new URL(`/shared/${item.share.shareId}`, window.location.origin).toString();
      console.log('##### LINK ABSOLUTO DEFINIDO:', absoluteUrl);
      setShareUrl(absoluteUrl);
    } else {
      // Valores padrão
      setShareStatus('private');
      setSharePassword('');
      setExpireDate('');
      setMaxViews(undefined);
      setShareUrl('');
    }
    
    // Limpar estado de erro ao abrir o modal
    setError(null);
  }, [item]);
  
  if (!isOpen || !item) return null;
  
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (shareStatus === 'private') {
        // Remover compartilhamento
        unshareItem(itemId);
        setShareUrl('');
      } else {
        // Configurações de compartilhamento
        const config = {
          password: shareStatus === 'public' ? sharePassword || undefined : undefined,
          expiresAt: shareStatus === 'public' ? (expireDate ? new Date(expireDate) : undefined) : undefined,
          maxViews: shareStatus === 'public' ? (maxViews || undefined) : undefined
        };
        
        // Primeiro, salvar localmente para compatibilidade
        const localShareId = shareItem(itemId, shareStatus, config);
        
        // Tentar salvar no Supabase, mas continuar mesmo se falhar
        try {
          // Preparar o item para salvar no Supabase
          const itemToSave = {
            ...item,
            password: config.password,
            expires_at: config.expiresAt,
            max_views: config.maxViews,
            view_count: 0,
            share_status: shareStatus
          };
          
          // Salvar no Supabase
          const supabaseItem = await saveSharedItem(itemToSave);
          
          // Usar o share_id do Supabase se disponível
          const shareId = supabaseItem?.share_id || localShareId;
          
          // FORÇANDO URL ABSOLUTA com o formato correto
          const absoluteUrl = new URL(`/shared/${shareId}`, window.location.origin).toString();
          console.log('##### LINK ABSOLUTO GERADO:', absoluteUrl);
          
          // Definir diretamente no estado
          setShareUrl(absoluteUrl);
          
          // COPIAR IMEDIATAMENTE para a área de transferência para garantir
          navigator.clipboard.writeText(absoluteUrl)
            .then(() => {
              console.log('URL absoluta copiada automaticamente:', absoluteUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => console.error('Erro ao copiar URL:', err));
          
        } catch (supabaseError) {
          console.warn('Erro ao salvar no Supabase, usando apenas compartilhamento local:', supabaseError);
          // Continuar com o compartilhamento local
          // FORÇANDO URL ABSOLUTA com o formato correto
          const absoluteLocalUrl = new URL(`/shared/${localShareId}`, window.location.origin).toString();
          console.log('##### LINK ABSOLUTO LOCAL GERADO:', absoluteLocalUrl);
          
          // Definir diretamente no estado
          setShareUrl(absoluteLocalUrl);
          
          // COPIAR IMEDIATAMENTE para a área de transferência para garantir
          navigator.clipboard.writeText(absoluteLocalUrl)
            .then(() => {
              console.log('URL local absoluta copiada automaticamente:', absoluteLocalUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => console.error('Erro ao copiar URL local:', err));
        }
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
      setError('Houve um erro ao compartilhar. Tente novamente.');
    } finally {
      setIsLoading(false);
      
      // Fechar o modal após salvar
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };
  
  const copyToClipboard = () => {
    if (!shareUrl || !item?.share?.shareId) return;
    
    // SEMPRE forçar o formato absoluto correto do link
    const absoluteUrl = new URL(`/shared/${item.share.shareId}`, window.location.origin).toString();
    
    console.log('##### COPIANDO URL ABSOLUTA PARA ÁREA DE TRANSFERÊNCIA:', absoluteUrl);
    
    navigator.clipboard.writeText(absoluteUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Erro ao copiar URL:', err));
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações de compartilhamento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {/* Opções de compartilhamento */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibilidade
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="shareStatus"
                  value="private"
                  checked={shareStatus === 'private'}
                  onChange={() => setShareStatus('private')}
                  className="mr-2 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-purple-600 mr-2 flex items-center justify-center">
                    <span className="text-[8px] text-white">P</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Privado (apenas você pode ver)
                  </span>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="shareStatus"
                  value="link"
                  checked={shareStatus === 'link'}
                  onChange={() => setShareStatus('link')}
                  className="mr-2 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-600 mr-2 flex items-center justify-center">
                    <span className="text-[8px] text-white">C</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Compartilhado (qualquer pessoa com o link)
                  </span>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="shareStatus"
                  value="public"
                  checked={shareStatus === 'public'}
                  onChange={() => setShareStatus('public')}
                  className="mr-2 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-600 mr-2 flex items-center justify-center">
                    <span className="text-[8px] text-white">T</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Temporário (com opções de expiração)
                  </span>
                </div>
              </label>
            </div>
          </div>
          
          {shareStatus !== 'private' && shareStatus !== 'link' && (
            <>
              {/* Proteção por senha */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Proteção por senha (opcional)
                </label>
                <div className="flex">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={sharePassword}
                      onChange={(e) => setSharePassword(e.target.value)}
                      placeholder="Digite uma senha"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Data de expiração */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de expiração (opcional)
                </label>
                <div className="flex">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={expireDate}
                      onChange={(e) => setExpireDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Número máximo de visualizações */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limite de visualizações (opcional)
                </label>
                <div className="flex">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={maxViews || ''}
                      onChange={(e) => setMaxViews(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Ilimitado"
                      min="1"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* URL de compartilhamento */}
          {item.share && shareUrl && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link de compartilhamento
              </label>
              <div className="flex">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`ml-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    shareStatus === 'private' 
                      ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' 
                      : shareStatus === 'link'
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              {/* Botão de teste para abrir diretamente o link */}
              <div className="mt-2 flex">
                <a 
                  href={new URL(`/shared/${item.share.shareId}`, window.location.origin).toString()}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  <ExternalLinkIcon className="h-4 w-4 mr-1" />
                  Testar link em nova aba
                </a>
              </div>
              {item.share.viewCount !== undefined && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Visualizações: {item.share.viewCount}{item.share.maxViews ? ` de ${item.share.maxViews}` : ''}
                </p>
              )}
            </div>
          )}
          
          {/* Mensagem de erro */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              shareStatus === 'private' 
                ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' 
                : shareStatus === 'link'
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}; 