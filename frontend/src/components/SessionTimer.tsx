import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Função auxiliar para formatar o tempo em formato legível
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} segundos`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  
  return `${hours} ${hours === 1 ? 'hora' : 'horas'} e ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
};

const SessionTimer: React.FC = () => {
  const { sessionTimeRemaining, extendSession } = useAuth();
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  
  // Atualizar o tempo a cada segundo
  useEffect(() => {
    if (sessionTimeRemaining !== null) {
      // Converter de milissegundos para segundos
      const timeInSeconds = Math.floor(sessionTimeRemaining / 1000);
      setCurrentTime(timeInSeconds);
      
      const timer = setInterval(() => {
        setCurrentTime(prev => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      setCurrentTime(null);
    }
  }, [sessionTimeRemaining]);
  
  // Não mostrar nada se não houver tempo de verificação
  if (currentTime === null) {
    return null;
  }
  
  // Verificação necessária agora
  if (currentTime <= 0) {
    return (
      <div className="fixed bottom-4 right-4 max-w-md bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
        <div>
          <p className="font-bold">Verificação necessária</p>
          <p className="text-sm">Por favor, confirme sua identidade para continuar usando o aplicativo.</p>
          <button
            className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
            onClick={extendSession}
          >
            Verificar agora
          </button>
        </div>
      </div>
    );
  }
  
  // Verificação em breve
  if (currentTime < 300) { // menos de 5 minutos
    return (
      <div className="fixed bottom-4 right-4 max-w-md bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
        <ClockIcon className="h-6 w-6 text-yellow-500" />
        <div>
          <p className="font-bold">Verificação necessária em breve</p>
          <p className="text-sm">Por motivos de segurança, será necessário verificar sua identidade em {formatTime(currentTime)}.</p>
          <button
            className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-4 rounded"
            onClick={extendSession}
          >
            Estender sessão
          </button>
        </div>
      </div>
    );
  }
  
  // Verificação em um futuro próximo
  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
      <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
      <div>
        <p className="font-bold">Sessão ativa</p>
        <p className="text-sm">Verificação de segurança em {formatTime(currentTime)}.</p>
      </div>
    </div>
  );
};

export default SessionTimer; 