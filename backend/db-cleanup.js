import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Obter o caminho absoluto para o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o diretório do banco de dados
const dbDir = path.join(__dirname, 'db');

// Arquivos de banco de dados
const databasePath = path.join(dbDir, 'database.sqlite');
const sessionsPath = path.join(dbDir, 'sessions.sqlite');

// Função principal
async function main() {
  try {
    console.log('🧹 Iniciando limpeza e reinicialização do banco de dados...');
    
    // Verificar se o diretório existe
    if (!fs.existsSync(dbDir)) {
      console.log('📁 Criando diretório db...');
      fs.mkdirSync(dbDir, { recursive: true });
    } else {
      console.log('📁 Diretório db já existe');
    }
    
    // Remover os bancos de dados existentes se houver
    if (fs.existsSync(databasePath)) {
      console.log('🗑️ Removendo banco de dados principal...');
      fs.unlinkSync(databasePath);
    }
    
    if (fs.existsSync(sessionsPath)) {
      console.log('🗑️ Removendo banco de sessões...');
      fs.unlinkSync(sessionsPath);
    }
    
    // Criar e inicializar banco de dados
    console.log('🔧 Criando novo banco de dados...');
    const db = await open({
      filename: databasePath,
      driver: sqlite3.Database
    });
    
    // Criar as tabelas necessárias
    console.log('📊 Criando tabelas...');
    
    // Tabela de usuários
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
    
    // Tabela de itens
    await db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        type TEXT NOT NULL,
        url TEXT,
        preview TEXT,
        collection TEXT,
        userId INTEGER NOT NULL,
        favorite BOOLEAN DEFAULT 0,
        tags TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
    
    // Tabela de coleções
    await db.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        userId INTEGER NOT NULL,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);
    
    // Tabela de tags
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT,
        userId INTEGER NOT NULL,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);
    
    // Tabela de relação entre itens e tags
    await db.exec(`
      CREATE TABLE IF NOT EXISTS item_tags (
        itemId INTEGER,
        tagId INTEGER,
        PRIMARY KEY (itemId, tagId),
        FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
    
    // Inserir usuário padrão
    console.log('👤 Inserindo usuário padrão...');
    await db.run(`
      INSERT INTO users (id, email, name, password, createdAt, updatedAt)
      VALUES (1, 'usuario_teste@exemplo.com', 'Usuário Teste', 'senha123', datetime('now'), datetime('now'))
    `);
    
    // Inserir coleções padrão
    console.log('📚 Inserindo coleções padrão...');
    await db.run(`
      INSERT INTO collections (name, description, icon, userId, createdAt, updatedAt)
      VALUES ('Trabalho', 'Itens relacionados ao trabalho', 'briefcase', 1, datetime('now'), datetime('now'))
    `);
    
    await db.run(`
      INSERT INTO collections (name, description, icon, userId, createdAt, updatedAt)
      VALUES ('Pessoal', 'Itens pessoais', 'star', 1, datetime('now'), datetime('now'))
    `);
    
    // Inserir tags padrão
    console.log('🏷️ Inserindo tags padrão...');
    await db.run(`
      INSERT INTO tags (name, color, userId, createdAt, updatedAt)
      VALUES ('Importante', 'text-red-500', 1, datetime('now'), datetime('now'))
    `);
    
    await db.run(`
      INSERT INTO tags (name, color, userId, createdAt, updatedAt)
      VALUES ('Ler depois', 'text-blue-500', 1, datetime('now'), datetime('now'))
    `);
    
    await db.run(`
      INSERT INTO tags (name, color, userId, createdAt, updatedAt)
      VALUES ('Tutorial', 'text-green-500', 1, datetime('now'), datetime('now'))
    `);
    
    console.log('✅ Banco de dados inicializado com sucesso!');
    console.log(`📁 Localização: ${databasePath}`);
    
    // Fechar conexão
    await db.close();
    
    console.log('🚀 Pronto para uso!');
    
  } catch (error) {
    console.error('❌ Erro durante a operação:', error);
  }
}

// Executar a função principal
main(); 