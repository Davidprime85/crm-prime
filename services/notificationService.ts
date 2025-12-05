import { db } from './firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';

// Interface para o objeto de Notificação
export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: any;
  type?: 'info' | 'warning' | 'success' | 'error';
  link?: string;
}

// Interface do Serviço
interface NotificationService {
  // Funções de Email/SMS (Novas)
  sendEmail: (to: string, subject: string, content: string) => Promise<void>;
  sendSMS: (to: string, message: string) => Promise<void>;
  notifyClientUpdate: (processId: string, status: string, clientEmail?: string, clientName?: string) => Promise<void>;

  // Funções de Sistema/Chat (Restauradas)
  getNotifications: (userId: string) => Promise<Notification[]>;
  markAsRead: (notificationId: string) => Promise<void>;
  createNotification: (userId: string, message: string, type?: 'info' | 'warning' | 'success' | 'error', link?: string) => Promise<void>;
  saveChatMessage: (processId: string, message: string, senderId: string, senderRole: string) => Promise<void>;
}

const notificationService: NotificationService = {

  // =================================================================
  // 1. ENVIO DE E-MAILS (CONECTADO AO RESEND/VERCEL)
  // =================================================================
  sendEmail: async (to: string, subject: string, content: string) => {
    try {
      console.log(`📤 [Resend] Enviando email para ${to}...`);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html: content }),
      });

      if (!response.ok) throw new Error('Falha no envio via API');
      console.log('✅ Email enviado com sucesso!');
    } catch (error) {
      console.error('❌ Erro no envio de email:', error);
    }
  },

  sendSMS: async (to: string, message: string) => {
    console.log(`📱 [Simulação SMS] Para: ${to} | Msg: ${message}`);
  },

  // Atualiza status e avisa o cliente (Aceita 4 argumentos agora para corrigir o erro TS2554)
  notifyClientUpdate: async (processId: string, status: string, clientEmail?: string, clientName?: string) => {
    try {
      // 1. Cria notificação no sistema
      // (Opcional: se tiver ID do cliente, cria notificação interna)

      // 2. Tenta enviar E-mail
      let email = clientEmail;
      let name = clientName || 'Cliente';

      // Se não veio o email, busca no banco
      if (!email) {
        const docRef = doc(db, 'processes', processId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          email = data.client_email;
          name = data.client_name || name;
        }
      }

      if (email) {
        const subject = `Atualização: Seu processo mudou para ${status}`;
        const html = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0044cc;">Olá, ${name}</h2>
            <p>O status do seu processo foi atualizado para: <strong>${status.toUpperCase()}</strong></p>
            <p>Acesse o portal para conferir os detalhes.</p>
            <hr />
            <small>Equipe Prime Habitação</small>
          </div>
        `;
        await notificationService.sendEmail(email, subject, html);
      }
    } catch (error) {
      console.error('Erro no notifyClientUpdate:', error);
    }
  },

  // =================================================================
  // 2. FUNÇÕES DO SISTEMA (RESTAUROU O QUE FALTAVA)
  // =================================================================

  // Busca notificações do usuário (Para o ícone de sino)
  getNotifications: async (userId: string) => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      return [];
    }
  },

  // Marca como lida
  markAsRead: async (notificationId: string) => {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  },

  // Cria notificação interna (usado pelo dataService)
  createNotification: async (userId: string, message: string, type = 'info', link?: string) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        message,
        type,
        link,
        read: false,
        createdAt: Timestamp.now() // Usa Timestamp do Firestore
      });
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
    }
  },

  // Salva mensagem de chat (usado pelo AdminDashboard/AttendantDashboard)
  saveChatMessage: async (processId: string, message: string, senderId: string, senderRole: string) => {
    try {
      const messagesRef = collection(db, `processes/${processId}/messages`);
      await addDoc(messagesRef, {
        text: message,
        senderId,
        senderRole,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
    }
  }
};

export default notificationService;