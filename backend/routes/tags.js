import express from 'express';
import { connectDB } from '../db.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota para buscar todas as tags do usuário
router.get('/', requireAuth, async (req, res) => {
  const db = await connectDB();
  
  try {
    console.log('Buscando tags para o usuário ID:', req.session.user.id);
    
    // Buscar as tags do usuário atual
    const tags = await db.all(
      `SELECT tags.*, COUNT(item_tags.itemId) as count 
       FROM tags 
       LEFT JOIN item_tags ON tags.id = item_tags.tagId 
       WHERE tags.userId = ? 
       GROUP BY tags.id
       ORDER BY tags.name ASC`, 
      [req.session.user.id]
    );
    
    console.log('Tags encontradas para o usuário:', tags.length);
    res.json(tags);
  } catch (err) {
    console.error('Erro ao buscar tags:', err);
    res.status(500).json({ error: 'Erro ao buscar tags', details: err.message });
  }
});

// Rota para criar uma nova tag
router.post('/', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { name, color } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'O nome da tag é obrigatório' });
  }

  try {
    console.log('Criando nova tag:', name);
    
    const result = await db.run(`
      INSERT INTO tags (name, color, userId, createdAt, updatedAt)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `, [
      name.trim(),
      color || 'text-gray-400',
      req.session.user.id
    ]);

    const newTag = await db.get('SELECT * FROM tags WHERE id = ?', [result.lastID]);
    
    console.log(`Tag criada com sucesso. ID: ${result.lastID}`);
    res.status(201).json(newTag);
  } catch (err) {
    console.error('Erro ao criar tag:', err);
    res.status(500).json({ error: 'Erro ao criar tag', details: err.message });
  }
});

// Rota para atualizar uma tag existente
router.put('/:id', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const { name, color } = req.body;

  try {
    // Verificar se a tag pertence ao usuário atual
    const tag = await db.get(
      `SELECT * FROM tags WHERE id = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada ou não pertence ao usuário' });
    }
    
    // Atualizar apenas os campos que foram fornecidos
    const updates = [];
    const values = [];
    
    if (name !== undefined && name.trim() !== '') {
      updates.push('name = ?');
      values.push(name.trim());
    }
    
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }
    
    // Sempre atualizar o campo updatedAt
    updates.push('updatedAt = datetime("now")');
    
    // Adicionar o ID e o userId aos valores para a condição WHERE
    values.push(id);
    values.push(req.session.user.id);
    
    if (updates.length > 0) {
      await db.run(
        `UPDATE tags SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
        values
      );
    }
    
    // Buscar a tag atualizada para retornar
    const updatedTag = await db.get(
      `SELECT * FROM tags WHERE id = ?`, 
      [id]
    );
    
    console.log(`Tag ${id} atualizada com sucesso`);
    res.json(updatedTag);
  } catch (err) {
    console.error('Erro ao atualizar tag:', err);
    res.status(500).json({ error: 'Erro ao atualizar tag', details: err.message });
  }
});

// Rota para excluir uma tag
router.delete('/:id', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  
  try {
    // Verificar se a tag pertence ao usuário atual
    const tag = await db.get(
      `SELECT * FROM tags WHERE id = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada ou não pertence ao usuário' });
    }
    
    // Excluir as relações da tag com itens
    await db.run(`DELETE FROM item_tags WHERE tagId = ?`, [id]);
    
    // Excluir a tag
    await db.run(
      `DELETE FROM tags WHERE id = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    console.log(`Tag ${id} excluída com sucesso`);
    res.json({ message: 'Tag excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir tag:', err);
    res.status(500).json({ error: 'Erro ao excluir tag', details: err.message });
  }
});

// Rota para adicionar uma tag a um item
router.post('/items/:itemId/tags/:tagId', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { itemId, tagId } = req.params;
  
  try {
    // Verificar se o item e a tag pertencem ao usuário atual
    const item = await db.get(
      `SELECT * FROM items WHERE id = ? AND userId = ?`, 
      [itemId, req.session.user.id]
    );
    
    const tag = await db.get(
      `SELECT * FROM tags WHERE id = ? AND userId = ?`, 
      [tagId, req.session.user.id]
    );
    
    if (!item || !tag) {
      return res.status(404).json({ 
        error: 'Item ou tag não encontrados ou não pertencem ao usuário'
      });
    }
    
    // Verificar se já existe esta relação
    const existingRelation = await db.get(
      `SELECT * FROM item_tags WHERE itemId = ? AND tagId = ?`,
      [itemId, tagId]
    );
    
    if (existingRelation) {
      return res.status(200).json({ message: 'Item já possui esta tag' });
    }
    
    // Adicionar a relação
    await db.run(
      `INSERT INTO item_tags (itemId, tagId) VALUES (?, ?)`,
      [itemId, tagId]
    );
    
    console.log(`Tag ${tagId} adicionada ao item ${itemId}`);
    res.status(201).json({ message: 'Tag adicionada ao item com sucesso' });
  } catch (err) {
    console.error('Erro ao adicionar tag ao item:', err);
    res.status(500).json({ error: 'Erro ao adicionar tag ao item', details: err.message });
  }
});

// Rota para remover uma tag de um item
router.delete('/items/:itemId/tags/:tagId', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { itemId, tagId } = req.params;
  
  try {
    // Verificar se o item e a tag pertencem ao usuário atual
    const item = await db.get(
      `SELECT * FROM items WHERE id = ? AND userId = ?`, 
      [itemId, req.session.user.id]
    );
    
    const tag = await db.get(
      `SELECT * FROM tags WHERE id = ? AND userId = ?`, 
      [tagId, req.session.user.id]
    );
    
    if (!item || !tag) {
      return res.status(404).json({ 
        error: 'Item ou tag não encontrados ou não pertencem ao usuário' 
      });
    }
    
    // Remover a relação
    await db.run(
      `DELETE FROM item_tags WHERE itemId = ? AND tagId = ?`,
      [itemId, tagId]
    );
    
    console.log(`Tag ${tagId} removida do item ${itemId}`);
    res.json({ message: 'Tag removida do item com sucesso' });
  } catch (err) {
    console.error('Erro ao remover tag do item:', err);
    res.status(500).json({ error: 'Erro ao remover tag do item', details: err.message });
  }
});

// Rota para obter os itens de uma tag específica
router.get('/:id/items', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  
  try {
    // Verificar se a tag pertence ao usuário atual
    const tag = await db.get(
      `SELECT * FROM tags WHERE id = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada ou não pertence ao usuário' });
    }
    
    // Buscar os itens da tag
    const items = await db.all(
      `SELECT items.* FROM items 
       JOIN item_tags ON items.id = item_tags.itemId 
       WHERE item_tags.tagId = ? AND items.userId = ?`, 
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
    console.error('Erro ao buscar itens da tag:', err);
    res.status(500).json({ error: 'Erro ao buscar itens da tag', details: err.message });
  }
});

export default router; 