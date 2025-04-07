import express from 'express';
import { connectDB } from '../db.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota para buscar todas as coleções do usuário
router.get('/', requireAuth, async (req, res) => {
  const db = await connectDB();
  
  try {
    console.log('Buscando coleções para o usuário ID:', req.session.user.id);
    
    // Buscar apenas as coleções do usuário atual
    const collections = await db.all(
      `SELECT * FROM collections WHERE userId = ? ORDER BY name ASC`, 
      [req.session.user.id]
    );
    console.log('Coleções encontradas para o usuário:', collections.length);
    
    res.json(collections);
  } catch (err) {
    console.error('Erro ao buscar coleções:', err);
    res.status(500).json({ error: 'Erro ao buscar coleções', details: err.message });
  }
});

// Rota para criar uma nova coleção
router.post('/', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { name, description, icon } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'O nome da coleção é obrigatório' });
  }

  try {
    console.log('Criando nova coleção:', name);
    
    const result = await db.run(`
      INSERT INTO collections (name, description, icon, userId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      name.trim(),
      description || '',
      icon || 'folder',
      req.session.user.id
    ]);

    const newCollection = await db.get('SELECT * FROM collections WHERE id = ?', [result.lastID]);
    
    console.log(`Coleção criada com sucesso. ID: ${result.lastID}`);
    res.status(201).json(newCollection);
  } catch (err) {
    console.error('Erro ao criar coleção:', err);
    res.status(500).json({ error: 'Erro ao criar coleção', details: err.message });
  }
});

// Rota para atualizar uma coleção existente
router.put('/:id', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const { name, description, icon } = req.body;

  try {
    // Verificar se a coleção pertence ao usuário atual
    const collection = await db.get(
      `SELECT * FROM collections WHERE id = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    if (!collection) {
      return res.status(404).json({ error: 'Coleção não encontrada ou não pertence ao usuário' });
    }
    
    // Atualizar apenas os campos que foram fornecidos
    const updates = [];
    const values = [];
    
    if (name !== undefined && name.trim() !== '') {
      updates.push('name = ?');
      values.push(name.trim());
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || '');
    }
    
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon || 'folder');
    }
    
    // Sempre atualizar o campo updatedAt
    updates.push('updatedAt = datetime("now")');
    
    // Adicionar o ID e o userId aos valores para a condição WHERE
    values.push(id);
    values.push(req.session.user.id);
    
    if (updates.length > 0) {
      await db.run(
        `UPDATE collections SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
        values
      );
    }
    
    // Buscar a coleção atualizada para retornar
    const updatedCollection = await db.get(
      `SELECT * FROM collections WHERE id = ?`, 
      [id]
    );
    
    console.log(`Coleção ${id} atualizada com sucesso`);
    res.json(updatedCollection);
  } catch (err) {
    console.error('Erro ao atualizar coleção:', err);
    res.status(500).json({ error: 'Erro ao atualizar coleção', details: err.message });
  }
});

// Rota para excluir uma coleção
router.delete('/:id', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  
  try {
    // Verificar se a coleção pertence ao usuário atual
    const collection = await db.get(
      `SELECT * FROM collections WHERE id = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    if (!collection) {
      return res.status(404).json({ error: 'Coleção não encontrada ou não pertence ao usuário' });
    }
    
    // Excluir a coleção
    await db.run(
      `DELETE FROM collections WHERE id = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    // Atualizar os itens associados a esta coleção para a coleção padrão
    await db.run(
      `UPDATE items SET collection = 'default' WHERE collection = ?`, 
      [id]
    );
    
    console.log(`Coleção ${id} excluída com sucesso`);
    res.json({ message: 'Coleção excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir coleção:', err);
    res.status(500).json({ error: 'Erro ao excluir coleção', details: err.message });
  }
});

// Rota para obter os itens de uma coleção específica
router.get('/:id/items', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  
  try {
    // Verificar se a coleção pertence ao usuário atual
    const collection = await db.get(
      `SELECT * FROM collections WHERE id = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    if (!collection) {
      return res.status(404).json({ error: 'Coleção não encontrada ou não pertence ao usuário' });
    }
    
    // Buscar os itens da coleção
    const items = await db.all(
      `SELECT * FROM items WHERE collection = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    // Processar os itens para desserializar os previews
    const processedItems = items.map(item => {
      if (item.preview) {
        try {
          item.preview = JSON.parse(item.preview);
        } catch (e) {
          console.error(`Erro ao fazer parse do preview do item ${item.id}:`, e);
          item.preview = null;
        }
      }
      return item;
    });
    
    res.json(processedItems);
  } catch (err) {
    console.error('Erro ao buscar itens da coleção:', err);
    res.status(500).json({ error: 'Erro ao buscar itens da coleção', details: err.message });
  }
});

export default router; 