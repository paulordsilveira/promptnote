Leia os códigos abaixo e faça a criação dos arquivos conforme estrutura do projeto para integração de backend
backend/

├── db.js
├── server.mjs
├── routes/
│   ├── auth.js
│   └── items.js
├── middlewares/
│   └── authMiddleware.js
└── models/
    └── userModel.js



/* === backend/db.js === */
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const connectDB = async () => {
  return open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
};

/* === backend/server.mjs === */
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import SQLiteStore from 'express-session-sqlite';
import bodyParser from 'body-parser';
import { connectDB } from './db.js';

import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';

const app = express();
const PORT = 3333;

app.use(cors({
  origin: 'http://localhost:5173',
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

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

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

/* === backend/routes/auth.js === */
import express from 'express';
import bcrypt from 'bcrypt';
import { connectDB } from '../db.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const db = await connectDB();
  const hash = await bcrypt.hash(password, 10);
  try {
    await db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hash]);
    res.status(201).json({ message: 'Usuário registrado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = await connectDB();
  const user = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  req.session.user = { id: user.id, email: user.email };
  res.json({ user: req.session.user });
});

export default router;

/* === backend/routes/items.js === */
import express from 'express';
import { connectDB } from '../db.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const db = await connectDB();
  const items = await db.all(`SELECT * FROM items WHERE userId = ?`, [req.session.user.id]);
  res.json(items);
});

router.post('/', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { title, description, content, type, url, collection } = req.body;

  const result = await db.run(`
    INSERT INTO items (title, description, content, type, url, collection, userId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [title, description, content, type, url, collection, req.session.user.id]);

  res.status(201).json({ id: result.lastID });
});

export default router;

/* === backend/middlewares/authMiddleware.js === */
export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
};

Crie a pasta backend/ e adicione os arquivos acima.

Adicione no package.json (caso não tenha):



"dev:server": "nodemon backend/server.mjs",
"dev:all": "concurrently \"npm run dev\" \"npm run dev:server\""


Instale dependências do backend:

npm install express sqlite3 express-session express-session-sqlite bcrypt cors body-parser


rode tudo

npm run dev:all

Criar a pasta backend/ com essas subpastas e arquivos.

Rodar npm install se ainda não fez.

Rodar npm run dev:all para iniciar tudo.