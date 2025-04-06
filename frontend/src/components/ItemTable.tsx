import { 
  StarIcon, 
  LinkIcon, 
  DocumentTextIcon, 
  CodeBracketIcon as CodeIcon, 
  LightBulbIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { getRelativeTimeString } from '../utils/formatDate';
import { Item } from '../types';

const TypeIcon = ({ type }: { type: Item['type'] }) => {
  switch (type) {
    case 'link':
      return <LinkIcon className="h-5 w-5 text-blue-400" />;
    case 'note':
      return <DocumentTextIcon className="h-5 w-5 text-green-400" />;
    case 'code':
      return <CodeIcon className="h-5 w-5 text-yellow-400" />;
    case 'prompt':
      return <LightBulbIcon className="h-5 w-5 text-purple-400" />;
    default:
      return null;
  }
};

interface ItemTableProps {
  items: Item[];
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ItemTable = ({ 
  items, 
  onSelect, 
  onToggleFavorite,
  onEdit,
  onDelete 
}: ItemTableProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Nenhum item encontrado
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-800 dark:bg-gray-800 border-b border-gray-700">
            <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10"></th>
            <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">Tipo</th>
            <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Título</th>
            <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tags</th>
            <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Atualizado</th>
            <th className="p-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider w-24">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {items.map(item => (
            <tr 
              key={item.id} 
              className="bg-gray-900 dark:bg-gray-900 hover:bg-gray-800 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => onSelect(item.id)}
            >
              <td className="p-3 whitespace-nowrap">
                <button
                  className="text-gray-400 hover:text-yellow-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id, !item.favorite);
                  }}
                >
                  {item.favorite ? (
                    <StarIconSolid className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <StarIcon className="h-5 w-5" />
                  )}
                </button>
              </td>
              <td className="p-3 whitespace-nowrap">
                <TypeIcon type={item.type} />
              </td>
              <td className="p-3">
                <div className="font-medium text-white">{item.title}</div>
                {item.description && (
                  <div className="text-gray-400 text-sm truncate max-w-xs">{item.description}</div>
                )}
              </td>
              <td className="p-3">
                {item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded-full bg-gray-800 text-blue-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">-</span>
                )}
              </td>
              <td className="p-3 text-sm text-gray-400 whitespace-nowrap">
                {getRelativeTimeString(item.updatedAt)}
              </td>
              <td className="p-3 whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-2">
                  {onEdit && (
                    <button
                      className="text-gray-400 hover:text-white p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item.id);
                      }}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="text-gray-400 hover:text-red-500 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 