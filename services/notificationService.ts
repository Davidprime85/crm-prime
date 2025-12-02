import { supabase } from '../lib/supabaseClient';
import { Notification, Process } from '../types';

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
  },

  // Gerar mensagem baseada na etapa
  generateStepMessage: (process: Process): string => {
    const clientName = process.client_name.split(' ')[0]; // Primeiro nome
    const extraFields = process.extra_fields || [];

    const getField = (label: string) => extraFields.find(f => f.label === label || f.label === label.toLowerCase())?.value;

    switch (process.status) {
      case 'credit_analysis': // 20%
        return `Parabéns ${clientName}! Seu crédito foi aprovado. Vamos avançar com o processo.`;

      case 'valuation': // 40%
        const valuationValue = getField('valuation_value') || getField('Valor da Avaliação/Laudo (R$)') || '0,00';
        return `Sua avaliação foi concluída. Valor do laudo: R$ ${valuationValue}.`;

      case 'legal_analysis': // 60%
        const pendencyType = getField('pendency_type');
        const pendencyDesc = getField('pendency_desc') || getField('Descrição da Pendência (se houver)');

        if (pendencyType === 'client' || pendencyType === 'cliente') {
          return `Olá ${clientName}! Precisamos resolver uma pendência documental: ${pendencyDesc}.`;
        }
        // Se for interna ou vazia, não notificar
        return '';

      case 'itbi_emission': // 80%
        return `Olá ${clientName}, seu boleto de ITBI já está disponível para pagamento.`;

      case 'contract_signing': // 100%
        return `Parabéns ${clientName}! Seu contrato está pronto para assinatura.`;

      default:
        return `Olá ${clientName}, seu processo teve uma atualização.`;
    }
  },

  // Gerar link do WhatsApp
  generateWhatsAppLink: (phone: string, message: string) => {
    if (!message) return '#'; // Retorna link vazio se não houver mensagem

    // Remove non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    // Add country code if missing (assuming BR +55)
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
  },

  // Salvar mensagem no histórico do chat (Persistência na tabela messages)
  saveChatMessage: async (processId: string, sender: 'admin' | 'client' | 'system', message: string) => {
    try {
      // Inserir mensagem na tabela messages (compatível com ChatWidget)
      await supabase
        .from('messages')
        .insert({
          process_id: processId,
          sender_id: sender, // 'admin', 'client', ou 'system'
          sender_name: sender === 'admin' ? 'Administrador' : sender === 'client' ? 'Cliente' : 'Sistema',
          role: sender,
          content: message
        });

      console.log('Mensagem salva com sucesso no chat do processo:', processId);
    } catch (e) {
      console.error('Erro crítico ao salvar mensagem de chat:', e);
    }
  }
};