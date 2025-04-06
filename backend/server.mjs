import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import bodyParser from 'body-parser';
import { connectDB } from './db.js';

import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';

const SQLiteStore = connectSqlite3(session);
const app = express();
const PORT = 3333;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(bodyParser.json());

app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: './' }),
  cookie: { maxAge: 60 * 60 * 1000 }
}));

// Endpoint de status para verificação de conexão
app.get('/api/status', (req, res) => {
  res.json({ status: 'OK', database: 'online', server: 'running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

// Rota para coleções e seus itens
app.use('/api/collections/:collectionId/items', (req, res, next) => {
  req.collectionId = req.params.collectionId;
  next();
}, async (req, res) => {
  try {
    const db = await connectDB();
    const { collectionId } = req;
    
    // Criar ou obter um usuário de sessão temporário se necessário
    if (!req.session.user) {
      req.session.user = { id: 1, email: 'usuario_teste@exemplo.com' };
    }
    
    if (req.method === 'POST') {
      // Adicionar item à coleção específica
      const itemData = req.body;
      const result = await db.run(`
        INSERT INTO items (title, description, content, type, url, collection, userId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        itemData.title || 'Sem título', 
        itemData.description || '', 
        itemData.content || '', 
        itemData.type || 'note', 
        itemData.url || '', 
        collectionId, 
        req.session.user.id,
      ]);
      
      // Retornar o item criado com ID
      res.status(201).json({ 
        item: {
          ...itemData,
          id: result.lastID,
          collection: collectionId,
          userId: req.session.user.id
        },
        message: 'Item criado com sucesso' 
      });
    } else if (req.method === 'GET') {
      // Buscar itens da coleção
      const items = await db.all(
        `SELECT * FROM items WHERE collection = ? AND userId = ?`, 
        [collectionId, req.session.user.id]
      );
      res.json(items);
    } else {
      res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (error) {
    console.error(`Erro ao processar requisição para coleção ${req.collectionId}:`, error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const db = await connectDB();
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    content TEXT,
    type TEXT,
    url TEXT,
    collection TEXT,
    userId INTEGER,
    createdAt TEXT,
    updatedAt TEXT
  );
`);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
}); 