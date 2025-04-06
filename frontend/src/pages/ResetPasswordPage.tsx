import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Obter o token da URL ao carregar a página
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);
  
  // Limpar qualquer timeout ao desmontar o componente
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  
  // Redirecionar para a página inicial se o usuário já estiver autenticado
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token de redefinição inválido');
      return;
    }
    
    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
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
      const result = await resetPassword(token, password);
      if (result) {
        setSuccess(true);
      } else {
        setError('Não foi possível redefinir sua senha. Verifique se o token é válido.');
      }
    } catch (err) {
      setError('Erro ao redefinir senha. Por favor, tente novamente.');
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-black to-purple-900">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white flex items-center justify-center">
          <span className="text-purple-DEFAULT">Prompt</span>
          <span>Note</span>
        </h1>
        <p className="text-gray-400 mt-2">Sua coleção de prompts e recursos de IA</p>
      </div>
      
      <div className="w-full max-w-md bg-black p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Redefinir Senha</h2>
        
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {!token && !searchParams.get('token') && (
          <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 text-yellow-500 px-4 py-3 rounded-md mb-6">
            <p>Token de redefinição não encontrado.</p>
            <p className="mt-2">Verifique o link ou solicite um novo.</p>
          </div>
        )}
        
        {success ? (
          <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-3 rounded-md mb-6">
            <p>Sua senha foi redefinida com sucesso!</p>
            <p className="mt-2">Você já pode fazer login com sua nova senha.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-400 mb-2">Nova Senha</label>
              <input
                type="password"
                id="password"
                className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-DEFAULT"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || !token}
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
                disabled={isLoading || !token}
                placeholder="Confirme sua nova senha"
              />
            </div>
            
            <button
              type="submit"
              className={`w-full bg-purple-DEFAULT hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors ${(isLoading || !token) ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={isLoading || !token}
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center text-gray-400">
          {success ? (
            <Link to="/login" className="text-purple-DEFAULT hover:text-purple-300">
              Ir para o login
            </Link>
          ) : (
            <Link to="/forgot-password" className="text-purple-DEFAULT hover:text-purple-300">
              Solicitar novo link de redefinição
            </Link>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} PromptNote - Todos os direitos reservados
      </div>
    </div>
  );
}; 