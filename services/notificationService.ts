import { Notification } from '../types';

// Armazenamento local temporário (reseta ao atualizar página)
// Em produção, idealmente conectaríamos a uma tabela 'notifications' no Supabase
let LOCAL_NOTIFICATIONS: Notification[] = [];

export const notificationService = {
  getNotifications: (userId: string): Notification[] => {
    return LOCAL_NOTIFICATIONS.filter(n => n.user_id === userId).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  markAsRead: (notificationId: string) => {
    LOCAL_NOTIFICATIONS = LOCAL_NOTIFICATIONS.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
  },

  sendNotification: (toUserId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: toUserId,
      title,
      message,
      read: false,
      created_at: new Date().toISOString(),
      type
    };
    
    LOCAL_NOTIFICATIONS.unshift(newNotif);
    return true;
  }
};