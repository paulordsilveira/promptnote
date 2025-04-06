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

// Rota para obter itens de uma coleção específica
router.get('/collection/:collectionId', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { collectionId } = req.params;
  
  const items = await db.all(
    `SELECT * FROM items WHERE collection = ? AND userId = ?`, 
    [collectionId, req.session.user.id]
  );
  
  res.json(items);
});

export default router; 