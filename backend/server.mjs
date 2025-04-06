import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from 'body-parser';
import fs from 'fs';

// Importar as rotas
import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar o armazenamento de sessão SQLite
const SQLiteStore = connectSqlite3(session);

// Garantir que o diretório db existe
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Criar o aplicativo Express
const app = express();
const PORT = 3333;

// Configurar CORS - simplificado para origens comuns
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true
}));
app.use(bodyParser.json());

// Configurar sessões
app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ 
    db: 'sessions.sqlite', 
    dir: path.join(__dirname, 'db') 
  }),
  cookie: { maxAge: 60 * 60 * 1000 }
}));

// Rota de status simples para verificação de conexão
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', database: 'online', timestamp: new Date() });
});

// Registrar as rotas
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
}); 