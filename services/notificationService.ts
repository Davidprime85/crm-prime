import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

interface NotificationService {
  sendEmail: (to: string, subject: string, content: string) => Promise<void>;
  sendSMS: (to: string, message: string) => Promise<void>;
  notifyClientUpdate: (processId: string, status: string, clientEmail?: string, clientName?: string) => Promise<void>;
}

const notificationService: NotificationService = {
  // 1. Função REAL de envio de e-mail (Conecta com seu backend /api/send-email)
  sendEmail: async (to: string, subject: string, content: string) => {
    try {
      console.log(`📤 Tentando enviar email para ${to}...`);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html: content
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no envio');
      }

      console.log('✅ Email enviado com sucesso pelo Resend!');
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      // Não lançamos o erro (throw) para não travar o Kanban se o email falhar
    }
  },

  // 2. Função de SMS (Por enquanto mantemos simulada até você decidir o provedor)
  sendSMS: async (to: string, message: string) => {
    console.log(`📱 [SIMULAÇÃO SMS] Para: ${to} | Msg: ${message}`);
  },

  // 3. Função Inteligente que monta a mensagem
  notifyClientUpdate: async (processId: string, status: string, clientEmail?: string, clientName?: string) => {
    try {
      // Se não vier email/nome, tenta buscar no banco
      let email = clientEmail;
      let name = clientName || 'Cliente';

      if (!email) {
        const docRef = doc(db, 'processes', processId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          email = data.client_email;
          name = data.client_name || name;
        }
      }

      if (!email) {
        console.warn('⚠️ Cancelando notificação: Email do cliente não encontrado.');
        return;
      }

      // Monta o E-mail Bonito (HTML)
      const emailSubject = `Atualização do Processo: ${status} - Prime Habitação`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #003366;">Olá, ${name}!</h2>
          <p>Temos uma novidade sobre o seu financiamento.</p>
          <div style="background-color: #f0f4f8; padding: 20px; border-left: 5px solid #003366; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">Novo Status:</p>
            <h3 style="margin: 5px 0 0 0; color: #003366;">${status.toUpperCase()}</h3>
          </div>
          <p>Acesse seu portal para ver mais detalhes e acompanhar o progresso.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">Esta é uma mensagem automática da Prime Habitação.</p>
        </div>
      `;

      // Envia
      await notificationService.sendEmail(email, emailSubject, emailHtml);

    } catch (error) {
      console.error('Erro no fluxo de notificação:', error);
    }
  }
};

export default notificationService;