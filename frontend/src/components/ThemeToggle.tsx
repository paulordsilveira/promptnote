import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';

export const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useDarkMode();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] transition-colors relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700"
      aria-label={isDarkMode ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={isDarkMode ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      <div className="relative z-10">
        {isDarkMode ? (
          <SunIcon className="h-5 w-5 text-yellow-400" />
        ) : (
          <MoonIcon className="h-5 w-5 text-purple-DEFAULT" />
        )}
      </div>
      <span className="sr-only">{isDarkMode ? "Tema Claro" : "Tema Escuro"}</span>
    </button>
  );
}; 