# PromptNote - Sistema de Gerenciamento de Prompts e Recursos de IA

PromptNote é uma aplicação para gerenciar e organizar seus prompts de IA, links, notas e códigos em um único lugar.

## Estrutura do Projeto

O projeto está organizado em duas partes principais:

- **frontend/** - Aplicação React/Vite com TypeScript
- **backend/** - Servidor Express com SQLite

## Configuração Inicial

### Pré-requisitos

- Node.js 18+ e npm
- Git

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd promptnoteapp
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie os arquivos `.env.example` para `.env` na raiz do projeto e na pasta `frontend/`
   - Ajuste as variáveis conforme necessário

## Executando o Projeto

### Desenvolvimento

Para iniciar tanto o backend quanto o frontend simultaneamente:

```bash
npm run dev:all
```

Para iniciar apenas o backend:

```bash
npm run dev:server
```

Para iniciar apenas o frontend:

```bash
npm run dev
```

### Produção

Para construir o projeto para produção:

```bash
npm run build
```

Para iniciar o servidor em modo produção:

```bash
npm start
```

## Banco de Dados

O projeto usa SQLite para armazenamento de dados. O banco é criado automaticamente quando você inicia o servidor pela primeira vez.

Para verificar o conteúdo do banco de dados:

```bash
node check-db.cjs
```

## API Endpoints

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login

### Itens

- `GET /api/items` - Listar todos os itens do usuário
- `POST /api/items` - Adicionar novo item
- `GET /api/collections/:collectionId/items` - Listar itens de uma coleção específica
- `POST /api/collections/:collectionId/items` - Adicionar item a uma coleção específica

## Contribuição

1. Crie um fork do projeto
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Faça commit de suas alterações: `git commit -m 'Adiciona nova funcionalidade'`
4. Envie para o repositório remoto: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença ISC.

## Instruções de Backup e Restauração

### Criar Backup

Dois scripts de backup estão disponíveis para Windows e Linux/Mac:

#### Windows:
Execute o arquivo `backup.bat` clicando duas vezes sobre ele ou através do PowerShell/Prompt de Comando:

```
.\backup.bat
```

#### Linux/Mac:
Execute o arquivo `backup.sh` no terminal:

```
chmod +x backup.sh
./backup.sh
```

### O que é incluído no backup:

- Todo o código-fonte (diretório `src`)
- Arquivos públicos (diretório `public`)
- Documentação (diretório `docs`)
- Banco de dados SQLite com todos os usuários e dados
- Arquivos de configuração (package.json, etc.)

### O que NÃO é incluído no backup:

- Diretório `node_modules` (as dependências podem ser reinstaladas com `npm install`)
- Arquivos temporários e caches
- Diretório `.git` e outros arquivos de controle de versão

### Restaurar Backup

#### Windows:
1. Extraia o arquivo ZIP para uma pasta vazia
2. Abra um terminal na pasta extraída
3. Execute `npm install` para instalar as dependências
4. Execute `node server.cjs` para iniciar o servidor backend
5. Em outro terminal, execute `npm run dev` para iniciar o cliente frontend

#### Linux/Mac:
1. Extraia o arquivo TAR para uma pasta vazia:
   ```
   tar -xzf promptnote_backup_AAAA-MM-DD.tar.gz
   ```
2. Navegue para a pasta extraída
3. Execute `npm install` para instalar as dependências
4. Execute `node server.cjs` para iniciar o servidor backend
5. Em outro terminal, execute `npm run dev` para iniciar o cliente frontend

### Backup Manual

Se preferir fazer um backup manual, copie os seguintes arquivos e diretórios:

- Todo o diretório `src/`
- Todo o diretório `public/` (se existir)
- Todo o diretório `docs/`
- Arquivo `database.sqlite` (contém todos os dados)
- Arquivos de configuração: `package.json`, `vite.config.js`, `tsconfig.json`, etc.
- Arquivos `.env` (se existirem)
- O arquivo principal do servidor: `server.cjs`

## Iniciar a aplicação após restauração

1. Instale as dependências:
   ```
   npm install
   ```

2. Inicie o servidor backend:
   ```
   node server.cjs
   ```

3. Em outro terminal, inicie o cliente frontend:
   ```
   npm run dev
   ```

4. Acesse a aplicação no navegador no endereço indicado (geralmente http://localhost:3000 ou semelhante)

## Configuração do Supabase para Compartilhamento

O PromptNote utiliza o Supabase (plano free) para gerenciar o compartilhamento de itens. Siga as etapas abaixo para configurar o ambiente:

### 1. Criar uma conta no Supabase

1. Acesse [supabase.com](https://supabase.com/) e crie uma conta gratuita
2. Crie um novo projeto
3. Anote a URL e a chave anon/public do seu projeto

### 2. Configurar o banco de dados

Execute o seguinte SQL no editor SQL do Supabase:

```sql
-- Criar tabela para itens compartilhados
CREATE TABLE shared_items (
  id BIGSERIAL PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  original_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  url TEXT,
  content TEXT,
  preview JSONB,
  tags TEXT[],
  password TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  share_status TEXT DEFAULT 'link',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para buscas rápidas por share_id
CREATE INDEX idx_shared_items_share_id ON shared_items(share_id);

-- Criar política de segurança para permitir leitura de itens compartilhados sem autenticação
CREATE POLICY "Permitir leitura pública de itens compartilhados" 
  ON shared_items FOR SELECT USING (true);

-- Criar política para permitir inserção de novos itens (ao compartilhar)
CREATE POLICY "Permitir inserção de itens compartilhados" 
  ON shared_items FOR INSERT WITH CHECK (true);

-- Política para permitir atualização do contador de visualizações
CREATE POLICY "Permitir atualização do contador de visualizações" 
  ON shared_items FOR UPDATE USING (true)
  WITH CHECK (
    (OLD.view_count IS DISTINCT FROM NEW.view_count) AND
    (OLD.id = NEW.id) AND
    (OLD.share_id = NEW.share_id)
  );
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_KEY=sua_chave_anon_do_supabase
```

Substitua os valores pelas suas credenciais do projeto no Supabase.

### 4. Executar o projeto

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

## Deployment na SquareCloud

Para fazer deploy na SquareCloud:

1. Crie uma conta na [SquareCloud](https://squarecloud.app/)
2. Instale o CLI da SquareCloud: `npm install -g @squarecloud/cli`
3. Faça login: `squ login`
4. Crie um arquivo `squarecloud.app` na raiz do projeto:

```json
{
  "name": "promptnote",
  "version": "1.0.0",
  "description": "App para gerenciar e compartilhar links, notas, códigos e prompts",
  "main": "server.js",
  "memory": 512,
  "type": "site",
  "start": "node server.js",
  "subdomain": "promptnote",
  "build": "npm run build"
}
```

5. Crie um servidor Node.js simples para servir os arquivos estáticos:

```bash
npm install express
```

6. Crie um arquivo `server.js` na raiz do projeto:

```javascript
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

// Servir arquivos estáticos da pasta dist (gerada pelo build)
app.use(express.static(path.join(__dirname, 'dist')));

// Redirecionar todas as requisições para o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

7. Atualizar scripts no package.json:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "start": "node server.js"
}
```

8. Fazer o deploy:

```bash
squ deploy
```

## Funcionalidades

- **Sistema de Coleções**: Criar, editar e excluir coleções para organizar seus itens
- **Gerenciamento de Itens**: Suporte para links (com preview), notas, prompts e códigos
- **Sistema de Tags**: Organização por tags, filtros e busca
- **Visualização Flexível**: Modos de visualização em grade ou lista
- **Relacionamentos**: Estabeleça conexões entre itens relacionados
- **Interface Responsiva**: Layout adaptativo para diferentes dispositivos
- **Compartilhamento**: Compartilhar itens com opções de privacidade
- **Proteção por Senha**: Proteger itens compartilhados com senhas
- **Expiração Automática**: Permitir que itens compartilhados expirem automaticamente
- **Limite de Visualizações**: Definir um limite de visualizações para itens compartilhados
- **Tema Claro e Escuro**: Alternar entre temas claro e escuro

## Tecnologias Utilizadas

- **Frontend**: React + TypeScript
- **Estilização**: TailwindCSS + HeadlessUI
- **Armazenamento**: LocalStorage (versão atual), backend planejado para versões futuras

## Como Executar

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Execute o projeto em modo de desenvolvimento:
   ```
   npm run dev
   ```
4. Acesse a aplicação em http://localhost:5173

## Próximos Passos

- Implementação de backend com Node.js e MongoDB
- Sistema de autenticação de usuários
- Exportação/importação de dados
- Melhorias na interface e experiência do usuário
- Adição de recursos adicionais (modo offline, atalhos de teclado, etc)

## Resolvendo Problemas do Servidor

### Servidor Minimal para Pré-visualização de URLs

Um servidor minimal foi criado para fornecer apenas funcionalidades essenciais de pré-visualização de URLs, evitando problemas do servidor principal.

Para iniciar apenas o servidor minimal:

```bash
# Usando Node.js "Common JS"
npm run server:minimal

# OU usando ES Modules
npm run server:minimal:esm
```

O servidor minimal fornece apenas:
- `/api/status` - Verificação do status do servidor
- `/api/preview-url` - Pré-visualização de URLs

### Problema: Servidor Não Inicia Corretamente

Se o servidor principal `server.mjs` não iniciar devido a erros como `Cannot find module`, você pode:

1. Usar o servidor minimal para obter pré-visualizações de URLs
2. Verificar os caminhos de importação nos arquivos de controladores
3. Conferir se todos os arquivos necessários estão presentes

### Problema: Erro nas Pré-visualizações de URLs

Se você estiver enfrentando problemas com pré-visualizações de URLs:

1. Verifique se o servidor minimal está rodando (`npm run server:minimal:esm`)
2. Confirme que o frontend está configurado para usar a URL correta
3. Tente acessar diretamente a API de pré-visualização:
   ```
   http://localhost:3333/api/preview-url?url=https://www.exemplo.com
   ```

### Problema: CORS (Cross-Origin Resource Sharing)

Se estiver enfrentando erros de CORS:

1. Verifique se o servidor está configurado para aceitar solicitações da origem do frontend
2. Confirme que as configurações de CORS estão corretas no servidor
3. Certifique-se de que o frontend esteja usando a URL correta para acessar a API

## Configuração de Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar o frontend
npm run dev

# Iniciar o servidor minimal (apenas para pré-visualizações)
npm run server:minimal:esm

# OU iniciar o servidor completo (se estiver funcionando)
npm run server
```

## Estrutura do Projeto

- `src/` - Código fonte do frontend React
- `server.mjs` - Servidor principal Express
- `server-minimal.mjs` - Servidor mínimo apenas para pré-visualizações de URLs
- `database.sqlite` - Banco de dados SQLite
