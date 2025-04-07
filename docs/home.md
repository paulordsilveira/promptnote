# PromptNote - Documentação dos Componentes

Este documento lista todos os principais componentes, botões, formulários e outros elementos da aplicação PromptNote para facilitar a identificação e referência.

## Páginas Principais

- **HomePage** - Página inicial que exibe os itens salvos
- **LoginPage** - Página de login
- **RegisterPage** - Página de registro de novos usuários
- **ProfilePage** - Página de perfil do usuário
- **ChangePasswordPage** - Página para alterar senha
- **ForgotPasswordPage** - Página para recuperação de senha
- **ResetPasswordPage** - Página para redefinir senha
- **SharedItemPage** - Página para visualizar um item compartilhado
- **NotFoundPage** - Página de erro 404

## Componentes de Layout

- **MainContent** - Componente principal que estrutura o layout da aplicação
- **Sidebar** - Barra lateral com navegação e categorias
- **Header** - Cabeçalho da aplicação
- **Navbar** - Barra de navegação

## Componentes de Itens

- **ItemGrid** - Grade de exibição dos itens em formato grid
- **ItemTable** - Tabela de exibição dos itens em formato lista
- **ItemCard** - Card individual para cada item na visualização grid
- **ItemDetail** - Exibição detalhada de um item quando selecionado
- **ItemFilter** - Filtro para buscar itens

## Formulários e Modais

- **AddItemForm** - Formulário para adicionar um novo item
- **AddItemEvent** - Wrapper modal para o formulário de adição de item
- **AddCollectionForm** - Formulário para adicionar uma nova coleção
- **AddTagForm** - Formulário para adicionar uma nova tag
- **RegisterForm** - Formulário para registro de usuário
- **ShareModal** - Modal para compartilhar um item
- **ConfirmModal** - Modal de confirmação para ações importantes

## Seletores e Controles

- **TagSelector** - Seletor de tags para associar a um item
- **CollectionSelector** - Seletor de coleções para associar um item
- **ViewToggle** - Alternar entre visualização em grid e tabela
- **ThemeToggle** - Alternar entre tema claro e escuro
- **RecentCategories** - Exibição de categorias recentes (para mobile)

## Outros Componentes

- **EmptyState** - Exibido quando não há itens
- **SessionTimer** - Temporizador de sessão
- **DebugPanel** - Painel de depuração

## Elementos da Barra Lateral

### Categorias Principais
- **Minhas Notas** - Exibe todos os itens
- **Notas** - Filtra itens do tipo "note"
- **Links** - Filtra itens do tipo "link"
- **Códigos** - Filtra itens do tipo "code"
- **Prompts** - Filtra itens do tipo "prompt"

### Seção de Coleções
- **Botão "+"** - Adicionar nova coleção
- **Lista de Coleções** - Coleções criadas pelo usuário
  - Cada coleção tem um ícone, nome e pode ser clicada para filtrar itens

### Seção de Tags
- **Botão "+"** - Adicionar nova tag
- **Lista de Tags** - Tags criadas pelo usuário
  - Cada tag tem um ícone, nome e pode ser clicada para filtrar itens

### Menu Inferior
- **Settings** - Configurações
- **Help** - Ajuda

## Botões Principais

### Botões de Ação Global
- **Adicionar (botão +)** - Botão flutuante para adicionar novo item
- **Sair** - Botão para fazer logout

### Botões de Item
- **Favoritar** - Adicionar/remover item dos favoritos
- **Editar** - Editar um item existente
- **Excluir** - Remover um item
- **Compartilhar** - Compartilhar um item

## Formulário de Adição de Item

### Campos do Formulário
- **Título** - Título do item
- **Descrição** - Descrição breve do item
- **Conteúdo** - Conteúdo principal do item
- **URL** - Para itens do tipo "link"
- **Tags** - Seletor de tags
- **Coleção** - Seletor de coleção
- **Tipo** - Tipo do item (note, link, code, prompt)

### Botões do Formulário
- **Salvar** - Salvar o item
- **Cancelar** - Cancelar a operação

## Indicadores Visuais

- **Status de Conexão** - Indica se o banco de dados está conectado
- **Contador de Itens** - Exibe quantidade de itens em cada categoria
- **Preview de Links** - Miniatura com informações de URL para itens tipo "link"

# PromptNote - Documentação do HomePage e Sistema de Filtros

Este documento contém informações detalhadas sobre o componente HomePage, suas funcionalidades, estrutura de filtros, funções e problemas atuais para ajudar a identificar e corrigir bugs na aplicação PromptNote.

## Estrutura do Projeto

O projeto possui duas versões diferentes do componente HomePage:

1. **pages/HomePage.tsx** - A versão principal do componente
2. **components/HomePage.tsx** - Uma versão alternativa (possivelmente duplicada)

Isso pode causar confusão, pois ambos os componentes exportam `<HomePage />`, mas têm implementações diferentes de filtros.

## Contexto da Aplicação (AppContext)

O `AppContext` é o contexto principal da aplicação que gerencia o estado e as funções para manipular dados:

```typescript
interface AppContextType {
  items: Item[];                  // Todos os itens no sistema
  collections: Collection[];      // Todas as coleções
  tags: Tag[];                    // Todas as tags
  currentItem: Item | null;       // Item atualmente selecionado
  currentCollection: string | null; // ID da coleção atual
  viewMode: ViewMode;             // Modo de visualização ('grid' ou 'table')
  databaseStatus: 'online' | 'offline'; // Status da conexão com o banco de dados
  setCurrentItem: (itemId: string | null) => void; // Selecionar/desselecionar um item
  setCurrentCollection: (collectionId: string | null) => void; // Selecionar/desselecionar uma coleção
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>; // Adicionar item
  updateItem: (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>) => void; // Atualizar item
  deleteItem: (id: string) => void; // Excluir item
  addCollection: (collection: Omit<Collection, 'id'>) => string; // Adicionar coleção
  updateCollection: (id: string, updates: Partial<Omit<Collection, 'id'>>) => void; // Atualizar coleção
  deleteCollection: (id: string) => void; // Excluir coleção
  addTag: (tag: Omit<Tag, 'id'>) => string; // Adicionar tag
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id'>>) => void; // Atualizar tag
  deleteTag: (id: string) => void; // Excluir tag
  setViewMode: (mode: ViewMode) => void; // Alterar modo de visualização
  shareItem: (id: string, status: ShareStatus, config?: Partial<ShareConfig>) => string; // Compartilhar item
  unshareItem: (id: string) => void; // Descompartilhar item
  getSharedItem: (shareId: string) => Item | null; // Obter item compartilhado
  startEditing: (itemId: string) => void; // Iniciar edição de um item
}
```

## Interfaces de Dados

### Item

```typescript
interface Item {
  id: string;
  title: string;
  content?: string;
  description?: string;
  type: 'note' | 'link' | 'code' | 'prompt';
  tags?: string[];
  collection?: string;
  favorite?: boolean;
  createdAt: Date;
  updatedAt: Date;
  url?: string;
  preview?: {
    image?: string;
    title?: string;
    description?: string;
  };
  shared?: {
    id: string;
    status: 'public' | 'private';
    expiration?: Date;
    password?: string;
  };
}
```

### Collection

```typescript
interface Collection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Tag

```typescript
interface Tag {
  id: string;
  name: string;
  color?: string;
  count?: number;
}
```

## HomePage (pages/HomePage.tsx)

A versão principal do componente HomePage está localizada em `pages/HomePage.tsx`. 

### Props

```typescript
interface HomePageProps {
  activeCategory?: string | null;
  setActiveCategory?: (category: string | null) => void;
}
```

### Estados Gerenciados

```typescript
const [showAddItemForm, setShowAddItemForm] = useState(false);
const [showItemTypeSelector, setShowItemTypeSelector] = useState(false);
const [selectedItemType, setSelectedItemType] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState('');
```

### Lógica de Filtragem (pages/HomePage.tsx)

Esta versão usa um **useMemo** para filtrar os itens:

```typescript
const filteredItems = useMemo(() => {
  console.log('🔄 FILTRAGEM: Iniciando com', items.length, 'itens');
  console.log('🔄 FILTRAGEM: Categoria atual =', activeCategory);
  console.log('🔄 FILTRAGEM: Coleção atual =', currentCollection);
  
  // Criar uma nova lista para manter os itens filtrados
  let filtered = [...items];
  
  // Filtrar por categoria
  if (activeCategory) {
    console.log(`🔍 Filtrando por categoria: "${activeCategory}"`);
    
    if (activeCategory.startsWith('tag:')) {
      // Filtrar por tag
      const tagId = activeCategory.split(':')[1];
      console.log(`🏷️ Filtrando pela tag ID: ${tagId}`);
      filtered = filtered.filter(item => 
        item.tags && item.tags.includes(tagId)
      );
    } else {
      // SOLUÇÃO FINAL: Verificar e ajustar os tipos
      // O AddItemForm usa especificamente: 'note', 'link', 'code', 'prompt'
      console.log(`📝 Filtrando pelo tipo: "${activeCategory}"`);
      
      // Diagnóstico: exibir tipos únicos para entender o que está acontecendo 
      const tiposDisponiveis = [...new Set(items.map(item => item.type))];
      console.log('📊 Tipos disponíveis no sistema:', tiposDisponiveis);
      
      // Correção crítica: exibir cada item com seu tipo para depuração
      console.log('Lista de itens com seus tipos:');
      items.forEach(item => {
        console.log(`- Item "${item.title}" (${item.id}): tipo = "${item.type}"`);
      });
      
      // Novo método de correção: filtrar usando includes para máxima flexibilidade
      filtered = filtered.filter(item => {
        // Converter para string para garantir que podemos comparar
        const itemType = String(item.type || '');
        const categoryType = String(activeCategory || '');
        
        // Comparação exata corrigida: garantir que a comparação é case-insensitive
        const isMatch = itemType.toLowerCase() === categoryType.toLowerCase();
        
        console.log(`- Verificando item "${item.title}": tipo "${itemType}" === "${categoryType}"? ${isMatch ? 'SIM ✅' : 'NÃO ❌'}`);
        return isMatch;
      });
      
      console.log(`Após filtragem por categoria "${activeCategory}": ${filtered.length} itens encontrados`);
    }
  }
  
  // Filtrar pela coleção atual
  if (currentCollection) {
    console.log(`📁 Filtrando pela coleção ID: ${currentCollection}`);
    filtered = filtered.filter(item => item.collection === currentCollection);
    console.log(`✅ Após filtro por coleção: ${filtered.length} itens restantes`);
  }
  
  // Filtrar por termo de busca
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => 
      (item.title?.toLowerCase() || '').includes(query) || 
      (item.content?.toLowerCase() || '').includes(query)
    );
    console.log(`✅ Após filtro por termo: ${filtered.length} itens restantes`);
  }
  
  console.log(`🏁 FILTRAGEM FINAL: ${filtered.length} itens serão exibidos`);
  console.log('Itens resultantes:', filtered.map(item => `${item.title} (tipo: ${item.type})`));
  
  return filtered;
}, [items, activeCategory, currentCollection, searchQuery]);
```

## HomePage (components/HomePage.tsx)

A versão alternativa em `components/HomePage.tsx` **não** implementa filtragem por categoria ou tags. Em vez disso, simplesmente exibe todos os itens sem filtro:

```typescript
const displayItems = items; // usa items diretamente sem aplicar filtros
```

## Sidebar.tsx

O componente Sidebar é responsável por gerenciar a seleção de categorias, coleções e tags.

### Props

```typescript
interface SidebarProps {
  onAddItem: () => void;
  onCategorySelect?: (category: string | null) => void;
  activeCategory?: string | null;
}
```

### Lógica de Seleção de Categoria

Quando um item de menu é clicado, o Sidebar executa:

```typescript
const handleCategorySelect = (category: string | null) => {
  // Log simples e direto
  console.log(`SIDEBAR: Categoria selecionada = "${category}"`);
  
  // Chamar a função de callback diretamente
  if (typeof onCategorySelect === 'function') {
    onCategorySelect(category);
  }
};
```

Para cada tipo de item na barra lateral:

```jsx
<a 
  href="#" 
  className={`sidebar-item ${activeCategory === 'note' ? 'active' : ''}`} 
  onClick={(e) => {
    e.preventDefault();
    console.log("SIDEBAR: Clicou em Notas - filtrando por tipo 'note'");
    // Não resetar coleção para permitir filtragem combinada
    handleCategorySelect('note');
  }}
>
  <div className="w-8 flex justify-center">
    <DocumentIcon className={`h-5 w-5 ${getIconColor('document')}`} />
  </div>
  <span className="ml-3 text-sm font-semibold text-white">Notas</span>
</a>
```

## Problemas Identificados no Sistema de Filtros

1. **Duplicação de Componentes**: Existem duas versões do HomePage com lógicas diferentes.

2. **Inconsistência na Filtragem**: 
   - A versão em `pages/HomePage.tsx` usa useMemo para filtrar itens.
   - A versão em `components/HomePage.tsx` não implementa filtros.

3. **Lógica de Seleção de Categorias**:
   - Quando uma categoria é selecionada, a coleção atual (currentCollection) é definida como null.
   - Quando uma coleção é selecionada, a categoria atual (activeCategory) é definida como null.
   - Isso pode fazer com que os filtros sejam mutuamente exclusivos em vez de combinados.

4. **Possíveis Problemas de Tipo**:
   - A verificação de tipo de item pode estar sendo feita inconsistentemente.
   - Alguns lugares podem usar igualdade estrita (===) enquanto outros podem usar igualdade solta (==).
   - A formatação das strings (maiúsculas/minúsculas) pode não ser consistente.

## Possíveis Soluções

1. **Unificar os Componentes HomePage**:
   - Manter apenas uma versão do HomePage
   - Implementar uma lógica de filtragem robusta e testada

2. **Melhorar a Lógica de Filtragem**:
   - Usar um callback useCallback para a função de filtragem
   - Adicionar logs para debug em pontos estratégicos
   - Garantir que comparações de tipo sejam feitas consistentemente

3. **Revisar as Interações entre Categorias e Coleções**:
   - Permitir a filtragem por categoria E coleção simultaneamente
   - Implementar uma lógica clara de prioridade de filtros

4. **Corrigir Bugs Específicos**:
   - Verificar se `item.type` está sempre em minúsculas ou como esperado
   - Verificar se as tags estão sendo corretamente associadas aos itens

## Como Testar os Filtros

Para identificar exatamente onde está o problema, é recomendado:

1. Adicionar logs extensivos em pontos-chave:
   ```jsx
   console.log(`Filtrando por categoria: ${activeCategory}`);
   console.log(`Item analisado: ${JSON.stringify(item)}`);
   console.log(`Resultado da comparação: ${item.type === activeCategory}`);
   ```

2. Testar cada filtro isoladamente:
   - Clicar em cada categoria e verificar se os itens corretos são exibidos
   - Clicar em cada coleção e verificar se os itens corretos são exibidos
   - Verificar se os filtros se comportam corretamente quando combinados

3. Examinar o estado do AppContext durante a interação:
   - Verificar o valor de `currentCollection`
   - Verificar o valor de `activeCategory`
   - Verificar se os `items` estão formatados corretamente

## Código Atual da Lógica de Filtragem em HomePage.tsx

```typescript
// Filtrar itens baseado na categoria selecionada e termo de busca
const filteredItems = useMemo(() => {
  console.log('🔄 FILTRAGEM: Iniciando com', items.length, 'itens');
  console.log('🔄 FILTRAGEM: Categoria atual =', activeCategory);
  console.log('🔄 FILTRAGEM: Coleção atual =', currentCollection);
  
  // Criar uma nova lista para manter os itens filtrados
  let filtered = [...items];
  
  // Filtrar por categoria
  if (activeCategory) {
    console.log(`🔍 Filtrando por categoria: "${activeCategory}"`);
    
    if (activeCategory.startsWith('tag:')) {
      // Filtrar por tag
      const tagId = activeCategory.split(':')[1];
      console.log(`🏷️ Filtrando pela tag ID: ${tagId}`);
      filtered = filtered.filter(item => 
        item.tags && item.tags.includes(tagId)
      );
    } else {
      // SOLUÇÃO FINAL: Verificar e ajustar os tipos
      // O AddItemForm usa especificamente: 'note', 'link', 'code', 'prompt'
      console.log(`📝 Filtrando pelo tipo: "${activeCategory}"`);
      
      // Diagnóstico: exibir tipos únicos para entender o que está acontecendo 
      const tiposDisponiveis = [...new Set(items.map(item => item.type))];
      console.log('📊 Tipos disponíveis no sistema:', tiposDisponiveis);
      
      // Correção crítica: exibir cada item com seu tipo para depuração
      console.log('Lista de itens com seus tipos:');
      items.forEach(item => {
        console.log(`- Item "${item.title}" (${item.id}): tipo = "${item.type}"`);
      });
      
      // Novo método de correção: filtrar usando includes para máxima flexibilidade
      filtered = filtered.filter(item => {
        // Converter para string para garantir que podemos comparar
        const itemType = String(item.type || '');
        const categoryType = String(activeCategory || '');
        
        // Comparação exata corrigida: garantir que a comparação é case-insensitive
        const isMatch = itemType.toLowerCase() === categoryType.toLowerCase();
        
        console.log(`- Verificando item "${item.title}": tipo "${itemType}" === "${categoryType}"? ${isMatch ? 'SIM ✅' : 'NÃO ❌'}`);
        return isMatch;
      });
      
      console.log(`Após filtragem por categoria "${activeCategory}": ${filtered.length} itens encontrados`);
    }
  }
  
  // Filtrar pela coleção atual
  if (currentCollection) {
    console.log(`📁 Filtrando pela coleção ID: ${currentCollection}`);
    filtered = filtered.filter(item => item.collection === currentCollection);
    console.log(`✅ Após filtro por coleção: ${filtered.length} itens restantes`);
  }
  
  // Filtrar por termo de busca
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => 
      (item.title?.toLowerCase() || '').includes(query) || 
      (item.content?.toLowerCase() || '').includes(query)
    );
    console.log(`✅ Após filtro por termo: ${filtered.length} itens restantes`);
  }
  
  console.log(`🏁 FILTRAGEM FINAL: ${filtered.length} itens serão exibidos`);
  console.log('Itens resultantes:', filtered.map(item => `${item.title} (tipo: ${item.type})`));
  
  return filtered;
}, [items, activeCategory, currentCollection, searchQuery]);
``` 

# Sistema de Filtragem Atual - Problemas e Implementação

## Problema de Filtragem por Categorias

Atualmente, existe um problema na filtragem por categorias ('note', 'link', 'code', 'prompt') que não está funcionando corretamente. Apesar de várias tentativas de correção, os itens não são filtrados quando o usuário seleciona um tipo na barra lateral.

### Implementação atual no HomePage.tsx

```typescript
// Filtrar itens baseado na categoria selecionada e termo de busca
const filteredItems = useMemo(() => {
  console.log('🔄 FILTRAGEM: Iniciando com', items.length, 'itens');
  console.log('🔄 FILTRAGEM: Categoria atual =', activeCategory);
  console.log('🔄 FILTRAGEM: Coleção atual =', currentCollection);
  
  // Criar uma nova lista para manter os itens filtrados
  let filtered = [...items];
  
  // Filtrar por categoria
  if (activeCategory) {
    console.log(`🔍 Filtrando por categoria: "${activeCategory}"`);
    
    if (activeCategory.startsWith('tag:')) {
      // Filtrar por tag
      const tagId = activeCategory.split(':')[1];
      console.log(`🏷️ Filtrando pela tag ID: ${tagId}`);
      filtered = filtered.filter(item => 
        item.tags && item.tags.includes(tagId)
      );
    } else {
      // SOLUÇÃO FINAL: Verificar e ajustar os tipos
      // O AddItemForm usa especificamente: 'note', 'link', 'code', 'prompt'
      console.log(`📝 Filtrando pelo tipo: "${activeCategory}"`);
      
      // Diagnóstico: exibir tipos únicos para entender o que está acontecendo 
      const tiposDisponiveis = [...new Set(items.map(item => item.type))];
      console.log('📊 Tipos disponíveis no sistema:', tiposDisponiveis);
      
      // Correção crítica: exibir cada item com seu tipo para depuração
      console.log('Lista de itens com seus tipos:');
      items.forEach(item => {
        console.log(`- Item "${item.title}" (${item.id}): tipo = "${item.type}"`);
      });
      
      // Novo método de correção: filtrar usando includes para máxima flexibilidade
      filtered = filtered.filter(item => {
        // Converter para string para garantir que podemos comparar
        const itemType = String(item.type || '');
        const categoryType = String(activeCategory || '');
        
        // Comparação exata corrigida: garantir que a comparação é case-insensitive
        const isMatch = itemType.toLowerCase() === categoryType.toLowerCase();
        
        console.log(`- Verificando item "${item.title}": tipo "${itemType}" === "${categoryType}"? ${isMatch ? 'SIM ✅' : 'NÃO ❌'}`);
        return isMatch;
      });
      
      console.log(`Após filtragem por categoria "${activeCategory}": ${filtered.length} itens encontrados`);
    }
  }
  
  // Filtrar pela coleção atual
  if (currentCollection) {
    console.log(`📁 Filtrando pela coleção ID: ${currentCollection}`);
    filtered = filtered.filter(item => item.collection === currentCollection);
    console.log(`✅ Após filtro por coleção: ${filtered.length} itens restantes`);
  }
  
  // Filtrar por termo de busca
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => 
      (item.title?.toLowerCase() || '').includes(query) || 
      (item.content?.toLowerCase() || '').includes(query)
    );
    console.log(`✅ Após filtro por termo: ${filtered.length} itens restantes`);
  }
  
  console.log(`🏁 FILTRAGEM FINAL: ${filtered.length} itens serão exibidos`);
  console.log('Itens resultantes:', filtered.map(item => `${item.title} (tipo: ${item.type})`));
  
  return filtered;
}, [items, activeCategory, currentCollection, searchQuery]);
```

### Implementação na Sidebar.tsx

```typescript
// Função para lidar com a seleção de categoria - simplificada ao máximo
const handleCategorySelect = (category: string | null) => {
  // Log simples e direto
  console.log(`SIDEBAR: Categoria selecionada = "${category}"`);
  
  // Chamar a função de callback diretamente
  if (typeof onCategorySelect === 'function') {
    onCategorySelect(category);
  }
};

// Nos links da barra lateral:
<a 
  href="#" 
  className={`sidebar-item ${activeCategory === 'note' ? 'active' : ''}`} 
  onClick={(e) => {
    e.preventDefault();
    console.log("SIDEBAR: Clicou em Notas - filtrando por tipo 'note'");
    // Não resetar coleção para permitir filtragem combinada
    handleCategorySelect('note');
  }}
>
  <div className="w-8 flex justify-center">
    <DocumentIcon className={`h-5 w-5 ${getIconColor('document')}`} />
  </div>
  <span className="ml-3 text-sm font-semibold text-white">Notas</span>
</a>
```

### Implementação no AddItemForm.tsx

```typescript
// Definição do tipo de item
type ItemType = 'note' | 'link' | 'code' | 'prompt';

export const AddItemForm = ({ onClose, initialType, editItem, collection: initialCollection, onBack }: AddItemFormProps) => {
  const { collections, addItem, tags: allTags, updateItem } = useApp();
  const [itemType, setItemType] = useState<ItemType>((editItem?.type as ItemType) || initialType as ItemType || 'note');
  
  // Outras declarações de estado...
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica...
    
    // Criar o objeto do item
    const itemData = {
      title: title.trim(),
      type: itemType, // ItemType definido como 'note' | 'link' | 'code' | 'prompt'
      description: description.trim(),
      content: itemType !== 'link' ? finalContent.trim() : '',
      url: itemType === 'link' ? url.trim() : undefined,
      observation: observation.trim() || undefined,
      preview: itemType === 'link' && preview ? {
        image: preview.image,
        title: preview.title,
        description: preview.description,
        url: url.trim()
      } : undefined,
      tags: selectedTags,
      collection: collection,
      favorite: editItem ? editItem.favorite : false,
      relationships: editItem ? editItem.relationships : [],
    };
    
    // Chamar a API para adicionar ou atualizar o item
    if (editItem) {
      updateItem(editItem.id, itemData);
    } else {
      addItem(itemData);
    }
    
    // Fechar o formulário
    onClose();
  };
  
  // Restante do componente...
}
```

## Discrepâncias e Possíveis Problemas

1. **Inconsistência de Tipos**: 
   - Na interface Item, o tipo é definido como string literal: `type: 'note' | 'link' | 'code' | 'prompt'`
   - No entanto, ao ser armazenado ou recuperado, pode estar sendo convertido para outro formato.

2. **Comunicação entre Componentes**:
   - A Sidebar seleciona corretamente a categoria (por exemplo, 'note')
   - O HomePage recebe a categoria via props, mas a comparação no filtro não está funcionando

3. **Logs de Diagnóstico**:
   - Os logs no console mostram que os tipos disponíveis nos itens não correspondem exatamente aos tipos esperados
   - Tentativas de normalização (toLowerCase(), trim(), conversão para string) não resolveram o problema

4. **Filtros Funcionais vs. Não-Funcionais**:
   - A filtragem por coleções funciona corretamente
   - A filtragem por tags funciona corretamente
   - Apenas a filtragem por tipo de item (categoria) não está funcionando

## Possíveis Soluções a Explorar

1. **Verificar o formato dos dados no banco**:
   - Examinar como os tipos de itens são armazenados no banco de dados
   - Verificar se há normalização de tipos ao salvar/recuperar itens

2. **Revisar o fluxo de dados**:
   - Rastrear o estado `activeCategory` desde a definição até a aplicação do filtro
   - Verificar se há alguma manipulação intermediária alterando o valor

3. **Implementar uma solução alternativa**:
   - Testar uma abordagem diferente para filtrar, como um método de filtragem baseado em funções específicas para cada tipo
   - Usar uma estrutura de correspondência mais flexível com mapas

4. **Verificar o objeto Item**:
   - Confirmar que o campo `type` nos objetos Item retornados pelo banco realmente corresponde aos valores esperados 
   - Investigar se há alguma transformação de dados entre o front-end e o back-end

## Estratégia de Depuração

Para resolver este problema, são recomendados os seguintes passos:

1. Adicionar logs mais detalhados para ver exatamente quais valores estão sendo recebidos e processados
2. Verificar a resposta do servidor para confirmar o formato exato dos dados
3. Testar diferentes abordagens de comparação para encontrar a que funciona
4. Considerar modificar a forma como os tipos são armazenados para garantir consistência

*Documento atualizado em: 10/05/2024* 