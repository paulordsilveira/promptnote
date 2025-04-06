import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
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
  
  // Redirecionar para a página inicial se o usuário já estiver autenticado
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
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
      await login(email, password);
      // O redirecionamento será feito pelo efeito useEffect que observa 'user'
    } catch (err) {
      setError('Credenciais inválidas. Por favor, tente novamente.');
      setIsLoading(false);
      
      // Limpar o timeout, pois já tratamos o erro
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-black to-purple-900">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white flex items-center">
          <span className="text-purple-DEFAULT">Prompt</span>
          <span>Note</span>
        </h1>
        <p className="text-gray-400 mt-2">Sua coleção de prompts e recursos de IA</p>
      </div>
      
      <div className="w-full max-w-md bg-black p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Entrar</h2>
        
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-400 mb-2">E-mail</label>
            <input
              type="email"
              id="email"
              className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-DEFAULT"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label htmlFor="password" className="text-gray-400">Senha</label>
              <Link to="/forgot-password" className="text-purple-DEFAULT text-sm hover:text-purple-300">
                Esqueceu a senha?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-DEFAULT"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            className={`w-full bg-purple-DEFAULT hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-gray-400">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-purple-DEFAULT hover:text-purple-300">
            Criar conta
          </Link>
        </div>
      </div>
      
      <div className="mt-8 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} PromptNote - Todos os direitos reservados
      </div>
    </div>
  );
}; 