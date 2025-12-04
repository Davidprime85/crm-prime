// Notification Service - Gerenciamento de Notificações
// Envia emails e SMS para clientes sobre atualizações de processos

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Process, ProcessStatus, PROCESS_STAGES } from '../types';

// ============================================
// CONFIGURAÇÃO DE PROVEDORES
// ============================================

// TODO: Adicionar chaves de API quando disponíveis
const EMAIL_CONFIG = {
  // SendGrid API Key
  apiKey: process.env.SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY',
  fromEmail: 'noreply@primehabitacao.com.br',
  fromName: 'Prime Habitação'
};

const SMS_CONFIG = {
  // Twilio Credentials
  accountSid: process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID',
  authToken: process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN',
  fromNumber: process.env.TWILIO_FROM_NUMBER || '+5511999999999'
};

// ============================================
// INTERFACE DO SERVIÇO
// ============================================

export interface NotificationService {
  sendEmail(to: string, subject: string, content: string): Promise<void>;
  sendSMS(to: string, message: string): Promise<void>;
  notifyClientUpdate(processId: string, newStatus: ProcessStatus): Promise<void>;
}

// ============================================
// IMPLEMENTAÇÃO
// ============================================

/**
 * Envia email para o cliente
 * TODO: Integrar com SendGrid quando API Key estiver disponível
 */
export const sendEmail = async (to: string, subject: string, content: string): Promise<void> => {
  console.log('📧 ========== SIMULANDO ENVIO DE EMAIL ==========');
  console.log('Para:', to);
  console.log('Assunto:', subject);
  console.log('Conteúdo:', content);
  console.log('De:', `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`);
  console.log('================================================');

  // TODO: Implementar integração real com SendGrid
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(EMAIL_CONFIG.apiKey);
  
  const msg = {
      to: to,
      from: {
          email: EMAIL_CONFIG.fromEmail,
          name: EMAIL_CONFIG.fromName
      },
      subject: subject,
      html: content
  };
  
  await sgMail.send(msg);
  */
};

/**
 * Envia SMS para o cliente
 * TODO: Integrar com Twilio quando credenciais estiverem disponíveis
 */
export const sendSMS = async (to: string, message: string): Promise<void> => {
  console.log('📱 ========== SIMULANDO ENVIO DE SMS ==========');
  console.log('Para:', to);
  console.log('Mensagem:', message);
  console.log('De:', SMS_CONFIG.fromNumber);
  console.log('==============================================');

  // TODO: Implementar integração real com Twilio
  /*
  const twilio = require('twilio');
  const client = twilio(SMS_CONFIG.accountSid, SMS_CONFIG.authToken);
  
  await client.messages.create({
      body: message,
      from: SMS_CONFIG.fromNumber,
      to: to
  });
  */
};

/**
 * Notifica cliente sobre atualização no processo
 * Busca dados do processo e envia email/SMS
 */
export const notifyClientUpdate = async (processId: string, newStatus: ProcessStatus): Promise<void> => {
  try {
    // Buscar dados do processo no Firestore
    const processRef = doc(db, 'processes', processId);
    const processSnap = await getDoc(processRef);

    if (!processSnap.exists()) {
      console.error('Processo não encontrado:', processId);
      return;
    }

    const process = processSnap.data() as Process;
    const stageInfo = PROCESS_STAGES[newStatus];

    // Preparar mensagens
    const emailSubject = `Atualização do seu processo - ${stageInfo.title}`;
    const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Prime Habitação</h2>
                <p>Olá, <strong>${process.client_name}</strong>!</p>
                <p>Temos uma atualização sobre o seu processo de financiamento habitacional:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1f2937; margin-top: 0;">${stageInfo.title}</h3>
                    <p style="color: #4b5563;">${stageInfo.description}</p>
                    <div style="background-color: #e5e7eb; height: 8px; border-radius: 4px; margin-top: 10px;">
                        <div style="background-color: #f59e0b; height: 8px; border-radius: 4px; width: ${stageInfo.percentage}%;"></div>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Progresso: ${stageInfo.percentage}%</p>
                </div>
                
                <p>Valor do imóvel: <strong>R$ ${process.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
                <p>Tipo: <strong>${process.type}</strong></p>
                
                <p style="margin-top: 30px;">
                    Acesse seu painel para mais detalhes:<br>
                    <a href="https://crm-prime.vercel.app" style="color: #f59e0b; text-decoration: none;">
                        https://crm-prime.vercel.app
                    </a>
                </p>
                
                <p style="color: #6b7280; font-size: 12px; margin-top: 40px;">
                    Em caso de dúvidas, entre em contato conosco.
                </p>
            </div>
        `;

    const smsMessage = `Prime Habitação: Seu processo foi atualizado para "${stageInfo.title}" (${stageInfo.percentage}%). Acesse o painel para mais detalhes.`;

    // Enviar notificações
    if (process.client_email) {
      await sendEmail(process.client_email, emailSubject, emailContent);
    }

    // TODO: Adicionar campo phone no Process e enviar SMS
    // if (process.client_phone) {
    //     await sendSMS(process.client_phone, smsMessage);
    // }

    console.log('✅ Notificações enviadas com sucesso para:', process.client_name);

  } catch (error) {
    console.error('❌ Erro ao enviar notificações:', error);
    // Não lançar erro para não quebrar o fluxo principal
  }
};

// Exportar como objeto para compatibilidade
export const notificationService = {
  sendEmail,
  sendSMS,
  notifyClientUpdate
};

export default notificationService;