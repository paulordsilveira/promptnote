import { Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline';

type ViewMode = 'grid' | 'table';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export const ViewToggle = ({ mode, onChange, className = '' }: ViewToggleProps) => {
  return (
    <div className={`flex items-center bg-gray-800 rounded-md p-1 ${className}`}>
      <button
        className={`p-1.5 rounded ${
          mode === 'grid'
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => onChange('grid')}
        title="Visualização em grade"
      >
        <Squares2X2Icon className="h-5 w-5" />
      </button>
      <button
        className={`p-1.5 rounded ${
          mode === 'table'
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => onChange('table')}
        title="Visualização em tabela"
      >
        <TableCellsIcon className="h-5 w-5" />
      </button>
    </div>
  );
}; 