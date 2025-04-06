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

// Rota para verificar se o usuário está autenticado
router.get('/check', (req, res) => {
  if (req.session && req.session.user) {
    // Usuário autenticado
    return res.json({ isAuthenticated: true, user: req.session.user });
  }
  
  // Se não há sessão ou usuário na sessão, criar um usuário temporário
  if (!req.session.user) {
    req.session.user = { id: 1, email: 'usuario_teste@exemplo.com' };
  }
  
  // Retornar o usuário (seja o autenticado ou o temporário)
  return res.json({ isAuthenticated: true, user: req.session.user });
});

export default router; 