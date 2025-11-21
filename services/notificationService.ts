import { supabase } from '../lib/supabaseClient';
import { Notification } from '../types';

export const notificationService = {
  // Buscar notificações (Realtime será adicionado no componente Layout)
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }

    return data.map(n => ({
      id: n.id,
      user_id: n.user_id,
      title: n.title,
      message: n.message,
      read: n.read,
      created_at: n.created_at,
      type: n.type
    }));
  },

  // Marcar como lida
  markAsRead: async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  },

  // Criar notificação (usado pelo sistema ao mudar status)
  createNotification: async (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        read: false
      });
  }
};