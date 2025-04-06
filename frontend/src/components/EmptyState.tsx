import { PlusIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onAction: () => void;
}

export const EmptyState = ({ title, description, buttonText, onAction }: EmptyStateProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
      <div 
        className="bg-gray-900 dark:bg-gray-800 rounded-full p-4 mb-4 cursor-pointer"
        onClick={onAction}
      >
        <PlusIcon className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="text-lg font-medium text-white dark:text-gray-300 mb-2">{title}</h2>
      <p className="text-gray-300 dark:text-gray-400 mb-4 max-w-md">{description}</p>
    </div>
  );
}; 