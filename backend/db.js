import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Função para conectar e inicializar o banco de dados 
export const connectDB = async () => {
  // Obter o caminho absoluto para o diretório atual
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Local padronizado para o banco de dados
  const dbPath = path.join(__dirname, 'db', 'database.sqlite');
  console.log('📁 Banco de dados em:', dbPath);
  
  // Verificar se o diretório existe
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Abrir conexão com o banco de dados
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Se o banco não tem tabelas, inicializar
  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
  if (tables.length === 0) {
    console.log('🔧 Criando tabelas no banco de dados...');
    await initializeDatabase(db);
  }
  
  return db;
};

// Função para inicializar o banco de dados com tabelas necessárias
async function initializeDatabase(db) {
  // Criar tabela de itens
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
  
  // Criar tabela de usuários
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
  
  // Verificar se já existe um usuário padrão
  const user = await db.get('SELECT * FROM users WHERE id = 1');
  if (!user) {
    // Inserir usuário padrão
    await db.run(`
      INSERT INTO users (id, email, name, password, createdAt, updatedAt)
      VALUES (1, 'usuario_teste@exemplo.com', 'Usuário Teste', 'senha123', datetime('now'), datetime('now'))
    `);
  }
  
  console.log('✅ Banco de dados inicializado com sucesso!');
} 