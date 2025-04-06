import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { changePassword, user } = useAuth();
  const navigate = useNavigate();
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Limpar qualquer timeout ao desmontar o componente
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  
  // Redirecionar para o login se o usuário não estiver autenticado
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    // Limpar timeout anterior se existir
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Configurar um timeout de segurança para limitar o tempo de carregamento
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('Tempo limite excedido. Por favor, tente novamente.');
      }
    }, 10000); // 10 segundos de timeout
    
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result) {
        setSuccess(true);
        
        // Limpar campos após o sucesso
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError('Não foi possível alterar sua senha. Verifique se a senha atual está correta.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar senha';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      
      // Limpar o timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  };
  
  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Alterar Senha</h1>
      
      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-3 rounded-md mb-6">
          <p>Sua senha foi alterada com sucesso!</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-gray-800 bg-opacity-50 rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="currentPassword" className="block text-gray-400 mb-2">Senha Atual</label>
          <input
            type="password"
            id="currentPassword"
            className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-DEFAULT"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Digite sua senha atual"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-gray-400 mb-2">Nova Senha</label>
          <input
            type="password"
            id="newPassword"
            className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-DEFAULT"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Digite sua nova senha"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-400 mb-2">Confirmar Nova Senha</label>
          <input
            type="password"
            id="confirmPassword"
            className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-DEFAULT"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Confirme sua nova senha"
          />
        </div>
        
        <div className="flex justify-between items-center">
          <button
            type="button"
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            onClick={() => navigate('/profile')}
            disabled={isLoading}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className={`bg-purple-DEFAULT hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </div>
      </form>
    </div>
  );
}; 