# Instruções para Criar Backup do Frontend

Este projeto contém scripts para criar um backup completo do frontend do PromptNote. O backup inclui todos os arquivos necessários para o funcionamento do frontend, além de uma documentação detalhada.

## No Windows

1. Abra o PowerShell ou o Prompt de Comando como administrador
2. Navegue até a pasta do projeto
3. Execute o script batch com o comando:

```
.\createfrontendbackup.bat
```

## No Linux/macOS

1. Abra o terminal
2. Navegue até a pasta do projeto
3. Dê permissão de execução ao script:

```bash
chmod +x createfrontendbackup.sh
```

4. Execute o script:

```bash
./createfrontendbackup.sh
```

## O que será incluído no backup

O arquivo ZIP gerado (`promptnotefrontbackup.zip`) conterá:

- Todo o código fonte do frontend (`src/`)
- Arquivos estáticos (`public/`)
- Arquivos de configuração (package.json, vite.config.ts, etc.)
- Documentação completa (`DOCUMENTATION.md`)

## Após a criação do backup

Você pode distribuir o arquivo `promptnotefrontbackup.zip` para outras pessoas ou armazená-lo como cópia de segurança. Para restaurar ou instalar em outro local:

1. Descompacte o arquivo ZIP
2. Navegue até a pasta descompactada
3. Instale as dependências:

```bash
npm install
```

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
``` 