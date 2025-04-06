import { useCallback, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';

export const useDarkMode = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar se o tema já está no localStorage
    if (typeof window === 'undefined') return 'light';
    
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Verificar preferência do sistema
    if (window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    
    return 'light';
  });

  // Verificar se o tema atual é escuro
  const isDarkMode = useMemo(() => theme === 'dark', [theme]);

  // Efeito para atualizar a classe no documento quando o tema muda
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Quando o componente é montado, verificar e aplicar o tema
  useEffect(() => {
    // Aplicar tema na inicialização
    const initialTheme = localStorage.getItem('theme') as Theme;
    
    if (initialTheme === 'dark' || 
        (!initialTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      if (theme !== 'dark') setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (theme !== 'light') setTheme('light');
    }
    
    // Ouvir mudanças na preferência do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Função para alternar o tema
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return { theme, setTheme, toggleTheme, isDarkMode };
}; 