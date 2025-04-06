import express from 'express';
import { connectDB } from '../db.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota principal para buscar todos os itens
router.get('/', async (req, res) => {
  const db = await connectDB();
  
  console.log("===== REQUISIÇÃO DE ITENS RECEBIDA =====");
  console.log('Método:', req.method);
  console.log('Headers:', req.headers);
  console.log('Sessão:', req.session);
  
  // Garantir que temos um usuário na sessão
  if (!req.session.user) {
    console.log('Criando usuário temporário para a sessão');
    req.session.user = { 
      id: 1, 
      email: 'usuario_teste@exemplo.com',
      name: 'Usuário Teste' 
    };
  }
  
  try {
    console.log('Buscando itens para o usuário ID:', req.session.user.id);
    
    // Buscar apenas os itens do usuário atual
    const items = await db.all(`SELECT * FROM items WHERE userId = ?`, [req.session.user.id]);
    console.log('Itens encontrados para o usuário:', items.length);
    
    // Processar os itens para desserializar os previews
    const processedItems = items.map(item => {
      if (item.preview) {
        try {
          // Converter o campo preview de JSON string para objeto
          item.preview = JSON.parse(item.preview);
        } catch (e) {
          console.error(`Erro ao fazer parse do preview do item ${item.id}:`, e);
          // Em caso de erro, manter o preview como está ou definir como null
          // para evitar problemas no frontend
          item.preview = null;
        }
      }
      return item;
    });
    
    // Retornar os itens processados, mesmo que seja um array vazio
    res.json(processedItems);
  } catch (err) {
    console.error('Erro ao buscar itens:', err);
    res.status(500).json({ error: 'Erro ao buscar itens', details: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { title, description, content, type, url, collection, preview } = req.body;

  try {
    console.log('Criando novo item com preview:', preview ? 'presente' : 'ausente');
    
    // Serializar o objeto preview para JSON caso exista
    const previewJSON = preview ? JSON.stringify(preview) : null;
    
    const result = await db.run(`
      INSERT INTO items (title, description, content, type, url, preview, collection, userId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      title || 'Sem título', 
      description || '', 
      content || '', 
      type || 'note', 
      url || '', 
      previewJSON,
      collection || 'default', 
      req.session.user.id
    ]);

    console.log(`Item criado com sucesso. ID: ${result.lastID}`);
    
    res.status(201).json({ 
      id: result.lastID,
      preview: preview
    });
  } catch (err) {
    console.error('Erro ao criar item:', err);
    res.status(500).json({ error: 'Erro ao criar item', details: err.message });
  }
});

// Rota para atualizar um item existente
router.put('/:id', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const { title, description, content, type, url, preview, collection } = req.body;

  try {
    console.log(`Atualizando item ${id} - Preview:`, preview ? 'presente' : 'ausente');
    
    // Serializar o objeto preview para JSON caso exista
    const previewJSON = preview ? JSON.stringify(preview) : null;
    
    // Primeiro verificar se o item pertence ao usuário atual
    const item = await db.get(
      `SELECT * FROM items WHERE id = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado ou não pertence ao usuário' });
    }
    
    // Atualizar apenas os campos que foram fornecidos
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    
    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
    }
    
    if (url !== undefined) {
      updates.push('url = ?');
      values.push(url);
    }
    
    if (preview !== undefined) {
      updates.push('preview = ?');
      values.push(previewJSON);
    }
    
    if (collection !== undefined) {
      updates.push('collection = ?');
      values.push(collection);
    }
    
    // Sempre atualizar o campo updatedAt
    updates.push('updatedAt = datetime("now")');
    
    // Adicionar o ID e o userId aos valores para a condição WHERE
    values.push(id);
    values.push(req.session.user.id);
    
    if (updates.length > 0) {
      await db.run(
        `UPDATE items SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
        values
      );
    }
    
    // Buscar o item atualizado para retornar
    const updatedItem = await db.get(
      `SELECT * FROM items WHERE id = ?`, 
      [id]
    );
    
    // Desserializar o preview se existir
    if (updatedItem.preview) {
      try {
        updatedItem.preview = JSON.parse(updatedItem.preview);
      } catch (e) {
        console.error('Erro ao fazer parse do preview:', e);
      }
    }
    
    console.log('Item atualizado com sucesso');
    res.json(updatedItem);
  } catch (err) {
    console.error('Erro ao atualizar item:', err);
    res.status(500).json({ error: 'Erro ao atualizar item', details: err.message });
  }
});

// Rota para obter um item específico
router.get('/:id', async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  
  try {
    const item = await db.get(`SELECT * FROM items WHERE id = ?`, [id]);
    
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    
    // Desserializar o preview se existir
    if (item.preview) {
      try {
        item.preview = JSON.parse(item.preview);
      } catch (e) {
        console.error('Erro ao fazer parse do preview:', e);
      }
    }
    
    res.json(item);
  } catch (err) {
    console.error('Erro ao buscar item:', err);
    res.status(500).json({ error: 'Erro ao buscar item', details: err.message });
  }
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

// Rota para excluir um item
router.delete('/:id', requireAuth, async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  
  try {
    // Primeiro verificar se o item pertence ao usuário atual
    const item = await db.get(
      `SELECT * FROM items WHERE id = ? AND userId = ?`, 
      [id, req.session.user.id]
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado ou não pertence ao usuário' });
    }
    
    // Excluir o item
    await db.run(`DELETE FROM items WHERE id = ? AND userId = ?`, [id, req.session.user.id]);
    
    console.log(`Item ${id} excluído com sucesso`);
    res.json({ message: 'Item excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir item:', err);
    res.status(500).json({ error: 'Erro ao excluir item', details: err.message });
  }
});

// Rota especial para depuração que exibe todos os itens independente de autenticação
router.get('/debug/all', async (req, res) => {
  const db = await connectDB();
  
  console.log("===== REQUISIÇÃO DE DEPURAÇÃO DE ITENS =====");
  
  try {
    // Buscar todos os itens na tabela sem filtro de usuário
    const todosItens = await db.all(`SELECT * FROM items`);
    
    console.log(`Total de ${todosItens.length} itens encontrados na tabela`);
    
    // Retornar todos os itens
    res.json({
      message: "Esta é uma rota de depuração. Não use em produção.",
      itemCount: todosItens.length,
      items: todosItens
    });
  } catch (err) {
    console.error('Erro ao buscar itens para depuração:', err);
    res.status(500).json({ error: 'Erro ao buscar itens', details: err.message });
  }
});

export default router; 