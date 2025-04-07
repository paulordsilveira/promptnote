import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SharedItemPage } from './pages/SharedItemPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { checkDatabaseConnection } from './utils/database';
import SessionTimer from './components/SessionTimer';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  const { showSessionExpiry } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  return (
    <>
      {showSessionExpiry && <SessionTimer />}
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage 
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/change-password" element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        } />
        
        <Route path="/shared/:shareId" element={<SharedItemPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(false);
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkDatabaseConnection();
        setIsDatabaseConnected(isConnected);
      } catch (error) {
        console.error('Erro ao verificar conexão com o banco de dados:', error);
        setIsDatabaseConnected(false);
      }
    };
    
    checkConnection();
    
    // Verificar a conexão a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}
