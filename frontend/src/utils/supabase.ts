import { createClient } from '@supabase/supabase-js';
import { Item } from '../types';

// Obter URL e chave do Supabase a partir das variáveis de ambiente
// Adicionar valores padrão para evitar erros durante o desenvolvimento
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9';

// Criar cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Verificar se as credenciais são válidas
export const checkSupabaseCredentials = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_KEY;
  
  const isConfigured = Boolean(url && key);
  
  if (!isConfigured) {
    console.warn(
      '⚠️ Credenciais do Supabase não configuradas ou inválidas. ' +
      'O compartilhamento via Supabase não estará disponível. ' +
      'Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_KEY para valores reais.'
    );
    return false;
  }
  
  return true;
};

/**
 * Salva um item compartilhado no Supabase
 */
export const saveSharedItem = async (item: any) => {
  try {
    // Se o cliente não está inicializado, usamos apenas o modo simulado
    if (!supabase) {
      console.warn('Compartilhamento via Supabase desativado. Usando compartilhamento local.');
      
      // Retornar um mock para que a aplicação continue funcionando
      const mockShareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: 1,
        share_id: mockShareId,
        original_id: item.id,
        title: item.title,
      };
    }

    // Gerar um ID de compartilhamento único
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Preparar o item para salvar no Supabase
    const sharedItem = {
      share_id: shareId,
      original_id: item.id,
      title: item.title,
      description: item.description || null,
      type: item.type,
      url: item.url || null,
      content: item.content || null,
      preview: item.preview || null,
      tags: item.tags || [],
      password: item.password || null,
      expires_at: item.expires_at || null,
      max_views: item.max_views || null,
      view_count: 0,
      share_status: item.share_status || 'link'
    };

    // Salvar no Supabase
    const { data, error } = await supabase
      .from('shared_items')
      .insert(sharedItem)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar item no Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao compartilhar item:', error);
    return null;
  }
};

/**
 * Busca um item compartilhado pelo shareId
 */
export const getSharedItem = async (shareId: string) => {
  try {
    // Se o cliente não está inicializado, retornamos nulo para usar o fallback local
    if (!supabase) {
      console.warn('Cliente Supabase não disponível, usando dados locais.');
      return null;
    }

    // Buscar o item no Supabase
    const { data, error } = await supabase
      .from('shared_items')
      .select('*')
      .eq('share_id', shareId)
      .single();

    if (error) {
      console.error('Erro ao buscar item compartilhado:', error);
      return null;
    }

    // Verificar se o item expirou
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.log('Item compartilhado expirou');
      return null;
    }

    // Verificar se atingiu o número máximo de visualizações
    if (data.max_views && data.view_count >= data.max_views) {
      console.log('Item compartilhado atingiu o limite de visualizações');
      return null;
    }

    // Converter o item para o formato esperado pela aplicação
    const item: Item = {
      id: data.original_id,
      title: data.title,
      description: data.description,
      type: data.type as Item['type'],
      url: data.url,
      content: data.content || '',
      preview: data.preview,
      tags: data.tags || [],
      favorite: false,
      relationships: [],
      collection: '',
      share: {
        shareId: data.share_id,
        status: data.share_status as any,
        password: data.password,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        maxViews: data.max_views,
        viewCount: data.view_count
      },
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return item;
  } catch (error) {
    console.error('Erro ao buscar item compartilhado:', error);
    return null;
  }
};

/**
 * Incrementa o contador de visualizações de um item compartilhado
 */
export const incrementViewCount = async (shareId: string) => {
  try {
    // Se o cliente não está inicializado, retornamos um mock
    if (!supabase) {
      console.warn('Cliente Supabase não disponível, contador não incrementado.');
      return { id: 1, view_count: 1, share_id: shareId };
    }

    // Buscar o item no Supabase para obter o contador atual
    const { data: item, error: fetchError } = await supabase
      .from('shared_items')
      .select('id, view_count, share_id')
      .eq('share_id', shareId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar contador de visualizações:', fetchError);
      return null;
    }

    // Incrementar o contador
    const { data, error } = await supabase
      .from('shared_items')
      .update({ view_count: (item.view_count || 0) + 1 })
      .eq('id', item.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao incrementar contador de visualizações:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao incrementar contador de visualizações:', error);
    return null;
  }
};

export default supabase; 