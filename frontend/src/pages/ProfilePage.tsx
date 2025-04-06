import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserIcon, 
  EnvelopeIcon, 
  KeyIcon, 
  CameraIcon, 
  ArrowLeftIcon, 
  BellIcon,
  MoonIcon,
  LanguageIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon as LogoutIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ThemeMode, UserPreferences } from '../types';

export const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: ThemeMode.SYSTEM,
    notifications: true,
    language: 'pt-BR',
    defaultCollection: null,
    defaultView: 'grid',
    itemsPerPage: 20
  });
  
  // Inicializar campos quando o usuário é carregado
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPreferences(user.preferences || preferences);
    }
  }, [user]);
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!name.trim()) {
      setErrorMsg('O nome é obrigatório');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updateProfile({
        name
      });
      // Atualizar preferências em uma implementação real
      // Como updateProfile não suporta preferências, teriamos que implementar
      setSuccessMsg('Perfil atualizado com sucesso!');
      setIsEditingProfile(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Adicionar função para navegação à página de alteração de senha
  const navigateToChangePassword = () => {
    navigate('/change-password');
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setErrorMsg('Erro ao fazer logout');
    }
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-DEFAULT"></div>
      </div>
    );
  }
  
  // Formatar datas ou usar valores padrão
  const createdAtDate = user.createdAt ? new Date(user.createdAt) : new Date();
  const lastLoginDate = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
  const passwordUpdatedDate = user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Perfil do Usuário</h1>
        </div>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-md">
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 text-green-300 rounded-md">
            {successMsg}
          </div>
        )}
        
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden mb-6">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-900 to-indigo-900 flex flex-col sm:flex-row items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center border-4 border-gray-800">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-20 h-20 text-gray-400" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 shadow-lg hover:bg-indigo-700 transition-colors">
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-300">{user.email}</p>
              <p className="text-sm text-gray-400 mt-1">
                Membro desde {createdAtDate.toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="p-6">
            {isEditingProfile ? (
              <form onSubmit={handleProfileUpdate}>
                <h3 className="text-lg font-semibold mb-4">Editar Informações</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Nome
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full bg-gray-700 pl-10 py-2.5 text-white placeholder-gray-500 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="block w-full bg-gray-700 pl-10 py-2.5 text-gray-400 placeholder-gray-500 border border-gray-600 rounded-md cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado</p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-700">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Preferências</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MoonIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span>Tema</span>
                        </div>
                        <select
                          value={preferences.theme}
                          onChange={(e) => setPreferences({...preferences, theme: e.target.value as ThemeMode})}
                          className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value={ThemeMode.LIGHT}>Claro</option>
                          <option value={ThemeMode.DARK}>Escuro</option>
                          <option value={ThemeMode.SYSTEM}>Sistema</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span>Notificações</span>
                        </div>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.notifications}
                            onChange={(e) => setPreferences({...preferences, notifications: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <LanguageIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span>Idioma</span>
                        </div>
                        <select
                          value={preferences.language}
                          onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                          className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="pt-BR">Português (Brasil)</option>
                          <option value="en-US">English (US)</option>
                          <option value="es">Español</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      'Salvar alterações'
                    )}
                  </button>
                </div>
              </form>
            ) : isChangingPassword ? (
              <div>
                {/* Seção de segurança da conta */}
                <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Segurança da Conta</h3>
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center">
                        <KeyIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Senha</p>
                          <p className="text-xs text-gray-400">
                            {passwordUpdatedDate 
                              ? `Atualizada em ${passwordUpdatedDate.toLocaleDateString('pt-BR')}` 
                              : 'Nunca atualizada'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={navigateToChangePassword}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Alterar senha
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Informações Pessoais</h3>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Editar perfil
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm text-gray-400">Nome</h4>
                    <p className="mt-1">{user.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400">Email</h4>
                    <p className="mt-1">{user.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400">Membro desde</h4>
                    <p className="mt-1">{createdAtDate.toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400">Último acesso</h4>
                    <p className="mt-1">{lastLoginDate ? lastLoginDate.toLocaleString('pt-BR') : 'N/A'}</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-semibold mb-3">Preferências</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center">
                        <MoonIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <h4 className="text-sm text-gray-400">Tema</h4>
                      </div>
                      <p className="mt-1">
                        {preferences.theme === ThemeMode.LIGHT ? 'Claro' : 
                         preferences.theme === ThemeMode.DARK ? 'Escuro' : 'Sistema'}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <h4 className="text-sm text-gray-400">Notificações</h4>
                      </div>
                      <p className="mt-1">{preferences.notifications ? 'Ativadas' : 'Desativadas'}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <LanguageIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <h4 className="text-sm text-gray-400">Idioma</h4>
                      </div>
                      <p className="mt-1">
                        {preferences.language === 'pt-BR' ? 'Português (Brasil)' : 
                         preferences.language === 'en-US' ? 'English (US)' : 
                         preferences.language === 'es' ? 'Español' : preferences.language}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogoutIcon className="h-5 w-5 mr-2" />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}; 