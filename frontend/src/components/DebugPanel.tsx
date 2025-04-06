import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { BugAntIcon } from '@heroicons/react/24/outline';

const DebugPanel = () => {
  const { items, databaseStatus } = useApp();
  const [showDebug, setShowDebug] = useState(false);
  const [serverStatus, setServerStatus] = useState<string>('verificando...');
  const [lastChecked, setLastChecked] = useState<string>('-');
  const [testResults, setTestResults] = useState<{[key: string]: string}>({});
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (showDebug) {
      checkServerStatus();
    }
  }, [showDebug]);

  const checkServerStatus = async () => {
    try {
      setServerStatus('verificando...');
      const startTime = performance.now();
      const response = await fetch('/api/status', {
        method: 'GET',
        cache: 'no-cache',
        credentials: 'include'
      });
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      if (response.ok) {
        try {
          const data = await response.json();
          setServerStatus(`online (${responseTime}ms) - ${JSON.stringify(data)}`);
        } catch (e) {
          setServerStatus(`online (${responseTime}ms) - formato inválido`);
        }
      } else {
        setServerStatus(`erro ${response.status} (${responseTime}ms)`);
      }
      
      setLastChecked(new Date().toLocaleTimeString());
    } catch (error) {
      setServerStatus('offline (falha de conexão)');
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  const testApiEndpoints = async () => {
    setIsTesting(true);
    const endpoints = [
      '/api/status',
      '/api/auth/check',
      '/api/items',
      '/api/collections'
    ];

    const newResults: {[key: string]: string} = {};
    
    for (const endpoint of endpoints) {
      try {
        const startTime = performance.now();
        const response = await fetch(endpoint, {
          method: 'GET',
          cache: 'no-cache',
          credentials: 'include'
        });
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        if (response.ok) {
          try {
            const data = await response.json();
            newResults[endpoint] = `✅ ${response.status} (${responseTime}ms) - ${typeof data === 'object' ? JSON.stringify(data).substring(0, 30) + '...' : data}`;
          } catch (e) {
            newResults[endpoint] = `✅ ${response.status} (${responseTime}ms) - formato inválido`;
          }
        } else {
          newResults[endpoint] = `❌ ${response.status} (${responseTime}ms)`;
        }
      } catch (error) {
        newResults[endpoint] = `❌ erro (falha de conexão)`;
      }
    }
    
    setTestResults(newResults);
    setIsTesting(false);
  };
  
  return (
    <div className="fixed bottom-20 right-6 z-50">
      <button 
        onClick={() => setShowDebug(!showDebug)}
        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg"
        title="Depurar"
      >
        <BugAntIcon className="h-5 w-5" />
      </button>
      
      {showDebug && (
        <div className="absolute bottom-12 right-0 bg-gray-800 text-white p-4 rounded-lg shadow-xl w-80">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Depuração</h3>
            <button 
              onClick={checkServerStatus}
              className="text-xs bg-purple-700 px-2 py-1 rounded hover:bg-purple-600"
            >
              Atualizar
            </button>
          </div>
          
          <div className="text-xs border-b border-gray-700 pb-2 mb-2">
            <p>Última verificação: {lastChecked}</p>
            <p>API Status: <span className={serverStatus.includes('online') ? 'text-green-400' : 'text-red-400'}>{serverStatus}</span></p>
            <p>Context Status: <span className={databaseStatus === 'online' ? 'text-green-400' : 'text-red-400'}>{databaseStatus}</span></p>
          </div>
          
          <div className="border-b border-gray-700 pb-2 mb-2">
            <div className="flex justify-between items-center">
              <p className="font-bold text-sm">Teste de Endpoints:</p>
              <button 
                onClick={testApiEndpoints}
                disabled={isTesting}
                className={`text-xs ${isTesting ? 'bg-gray-600' : 'bg-blue-700 hover:bg-blue-600'} px-2 py-1 rounded`}
              >
                {isTesting ? 'Testando...' : 'Testar API'}
              </button>
            </div>
            
            {Object.keys(testResults).length > 0 && (
              <div className="mt-1 text-xs max-h-40 overflow-y-auto">
                {Object.entries(testResults).map(([endpoint, result]) => (
                  <div key={endpoint} className="mb-1">
                    <div className="font-mono">{endpoint}</div>
                    <div className={result.includes('✅') ? 'text-green-400' : 'text-red-400'}>
                      {result}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-b border-gray-700 pb-2 mb-2">
            <p className="font-bold text-sm">Items Cache:</p>
            <p className="text-xs">Total de itens: {items.length}</p>
          </div>
          
          {items.length > 0 && (
            <div className="mt-2">
              <p className="font-bold text-sm">Primeiros 5 itens:</p>
              <ul className="text-xs mt-1 max-h-40 overflow-y-auto">
                {items.slice(0, 5).map(item => (
                  <li key={item.id} className="mb-1 p-1 bg-gray-700 rounded">
                    <div className="truncate">{item.title || '[Sem título]'}</div>
                    <div className="text-gray-400 truncate">Tipo: {item.type}, ID: {item.id?.substring(0, 8)}...</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-2 text-xs">
            <button 
              onClick={() => {
                console.log('Dados completos dos itens:', items);
                alert('Dados dos itens exibidos no console (F12)');
              }}
              className="w-full bg-blue-700 px-2 py-1 rounded hover:bg-blue-600 mt-2"
            >
              Log detalhado no console
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel; 